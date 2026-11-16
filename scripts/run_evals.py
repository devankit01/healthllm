"""
Run all 7 health evals against a model via Ollama and save results.

Usage:
    pip install datasets
    ollama pull meditron:7b

    python scripts/run_evals.py meditron:7b
    python scripts/run_evals.py meditron:7b --samples 50
    python scripts/run_evals.py meditron:7b --repeats 3    # run 3 times, report mean ± stdev + 95% CI
    python scripts/run_evals.py meditron:7b --push         # upload to Supabase leaderboard
    python scripts/run_evals.py meditron:7b --grounding    # also run Citation Grounding eval (Citation F1)

Results are saved to data/results/<model-id>.json
"""

import argparse, json, math, os, re, sys, time, urllib.request, urllib.error, urllib.parse
from pathlib import Path

ROOT = Path(__file__).parent.parent
RESULTS_DIR = ROOT / "data" / "results"
RESULTS_DIR.mkdir(exist_ok=True)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
SEED = 42
TEMPERATURE = 0

# ── Ollama helper ──────────────────────────────────────────────────────────────

def ask(model: str, prompt: str, timeout: int = 600) -> str:
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": TEMPERATURE, "seed": SEED},
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())["response"].strip()
    except urllib.error.URLError as e:
        sys.exit(f"Ollama not reachable at {OLLAMA_URL}: {e}\nIs Ollama running? Run: ollama serve")


def wilson_ci(correct: int, n: int, z: float = 1.96):
    """Wilson score 95% confidence interval for a proportion."""
    if n == 0:
        return 0.0, 0.0
    p = correct / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    margin = (z / denom) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return round((centre - margin) * 100, 1), round((centre + margin) * 100, 1)


def stdev(values: list) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return round(math.sqrt(sum((x - mean) ** 2 for x in values) / (len(values) - 1)), 1)


def get_ollama_model_info(model: str) -> dict:
    try:
        payload = json.dumps({"name": model}).encode()
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/show",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        details = data.get("details", {})
        return {
            "ollama_model_digest": data.get("model_info", {}).get("general.basename", ""),
            "quantization": details.get("quantization_level", ""),
            "parameter_size": details.get("parameter_size", ""),
            "format": details.get("format", ""),
        }
    except Exception:
        return {}


def get_ollama_version() -> str:
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/version", timeout=5) as resp:
            return json.loads(resp.read()).get("version", "")
    except Exception:
        return ""


def check_ollama(model: str):
    try:
        payload = json.dumps({"name": model}).encode()
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/show",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            sys.exit(f"Model '{model}' not found in Ollama. Run: ollama pull {model}")
        raise
    except urllib.error.URLError as e:
        sys.exit(f"Ollama not reachable: {e}\nRun: ollama serve")


# ── Dataset loading ────────────────────────────────────────────────────────────

def load_hf(path: str, config=None, split="test", n=100):
    try:
        from datasets import load_dataset
    except ImportError:
        sys.exit("Run: pip install datasets")
    kw = {"split": split, "trust_remote_code": True}
    if config:
        kw["name"] = config
    ds = load_dataset(path, **kw)
    return list(ds.select(range(min(n, len(ds)))))


# ── Individual evals ───────────────────────────────────────────────────────────

def eval_med_knowledge(model: str, n: int) -> float:
    """MedMCQA — accuracy on 4-option MCQ"""
    rows = load_hf("openlifescienceai/medmcqa", split="validation", n=n)
    correct = 0
    for i, row in enumerate(rows, 1):
        opts = [row["opa"], row["opb"], row["opc"], row["opd"]]
        prompt = (
            f"{row['question']}\n"
            f"A. {opts[0]}\nB. {opts[1]}\nC. {opts[2]}\nD. {opts[3]}\n\n"
            "Answer with one letter only."
        )
        reply = ask(model, prompt)
        letter = _first_letter(reply)
        answer = "ABCD"[row["cop"]]
        if letter == answer:
            correct += 1
        _progress(i, n, "med-knowledge", correct)
    return round(correct / n * 100, 1)


def eval_clinical_reasoning(model: str, n: int) -> float:
    """MedQA USMLE 4-options — accuracy"""
    rows = load_hf("GBaker/MedQA-USMLE-4-options", split="test", n=n)
    correct = 0
    for i, row in enumerate(rows, 1):
        opts = row["options"]  # dict: {"A": "...", "B": "...", ...}
        opts_text = "\n".join(f"{k}. {v}" for k, v in opts.items())
        prompt = f"{row['question']}\n{opts_text}\n\nAnswer with one letter only."
        reply = ask(model, prompt)
        letter = _first_letter(reply)
        answer = row["answer_idx"] if "answer_idx" in row else row.get("answer", "")
        if isinstance(answer, str) and len(answer) == 1:
            if letter == answer.upper():
                correct += 1
        _progress(i, n, "clinical-reasoning", correct)
    return round(correct / n * 100, 1)


def eval_evidence_reasoning(model: str, n: int) -> float:
    """PubMedQA — yes/no/maybe accuracy"""
    rows = load_hf("qiaojin/PubMedQA", config="pqa_labeled", split="train", n=n)
    correct = 0
    for i, row in enumerate(rows, 1):
        contexts = row["context"]["contexts"] if isinstance(row["context"], dict) else []
        abstract = " ".join(contexts[:3]) if contexts else ""
        prompt = (
            f"Abstract: {abstract[:1200]}\n\n"
            f"Question: {row['question']}\n\n"
            "Answer yes, no or maybe."
        )
        reply = ask(model, prompt).lower()
        gold = row["final_decision"].lower().strip()
        if gold in reply[:20]:
            correct += 1
        _progress(i, n, "evidence-reasoning", correct)
    return round(correct / n * 100, 1)


def eval_claim_verification(model: str, n: int) -> float:
    """PubHealth — true/false/mixture/unproven accuracy"""
    rows = load_hf("ImperialCollegeLondon/health_fact", split="test", n=n)
    label_names = ["false", "mixture", "true", "unproven"]
    labels = set(label_names)
    valid, correct = 0, 0
    for i, row in enumerate(rows, 1):
        raw = row.get("label")
        gold = label_names[raw] if isinstance(raw, int) else (raw or "").lower().strip()
        if gold not in labels:
            continue
        prompt = (
            f"Claim: {row['claim']}\n\n"
            "Is this claim true, false, mixture or unproven? Answer with one word."
        )
        reply = ask(model, prompt).lower()
        for lbl in labels:
            if lbl in reply[:30]:
                valid += 1
                if lbl == gold:
                    correct += 1
                break
        _progress(i, n, "claim-verification", correct)
    base = valid or 1
    return round(correct / base * 100, 1)


def eval_entity_extraction(model: str, n: int):
    """NCBI Disease — F1 + JSON reliability"""
    rows = load_hf("ncbi/ncbi_disease", split="test", n=n)
    tp_total = fp_total = fn_total = 0
    valid_json = 0
    for i, row in enumerate(rows, 1):
        tokens = row["tokens"]
        tags = row["ner_tags"]
        # Build gold disease spans
        gold = _extract_spans(tokens, tags)
        text = " ".join(tokens)
        prompt = (
            'List every disease mentioned in the text as JSON: {"diseases": ["..."]}.\n\n'
            f"Text: {text}"
        )
        reply = ask(model, prompt)
        predicted, is_valid = _parse_diseases_json(reply)
        if is_valid:
            valid_json += 1
        predicted_set = {d.lower() for d in predicted}
        gold_set = {d.lower() for d in gold}
        tp_total += len(predicted_set & gold_set)
        fp_total += len(predicted_set - gold_set)
        fn_total += len(gold_set - predicted_set)
        _progress(i, n, "entity-extraction")
    precision = tp_total / (tp_total + fp_total) if (tp_total + fp_total) else 0
    recall = tp_total / (tp_total + fn_total) if (tp_total + fn_total) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    json_pct = round(valid_json / n * 100, 1)
    return round(f1 * 100, 1), json_pct


def eval_citation_grounding(model: str, n: int) -> float:
    """PubMedQA — Citation F1: does the model cite passages that actually support its answer?"""
    rows = load_hf("qiaojin/PubMedQA", config="pqa_labeled", split="train", n=n)
    tp_total = fp_total = fn_total = cited_any = 0

    for i, row in enumerate(rows, 1):
        ctx = row["context"]
        passages = ctx["contexts"] if isinstance(ctx, dict) else []
        labels = ctx.get("labels", []) if isinstance(ctx, dict) else []

        if not passages:
            continue

        # Gold = passages labelled "yes" (1-indexed to match prompt)
        gold = {idx + 1 for idx, lbl in enumerate(labels) if isinstance(lbl, str) and lbl.lower() == "yes"}
        if not gold:
            gold = set(range(1, len(passages) + 1))  # fallback: all passages

        passage_text = "\n".join(f"[{j+1}] {p[:400]}" for j, p in enumerate(passages[:5]))
        prompt = (
            f"Passages:\n{passage_text}\n\n"
            f"Question: {row['question']}\n\n"
            "Answer the question based on the passages above. "
            "After your answer, list which passage numbers support it, "
            'e.g. "Sources: [1][3]"'
        )
        reply = ask(model, prompt)

        # Extract [N] tags from reply
        cited = {int(m) for m in re.findall(r'\[(\d+)\]', reply) if 1 <= int(m) <= len(passages)}
        if cited:
            cited_any += 1

        tp_total += len(cited & gold)
        fp_total += len(cited - gold)
        fn_total += len(gold - cited)
        _progress(i, n, "citation-grounding")

    precision = tp_total / (tp_total + fp_total) if (tp_total + fp_total) else 0
    recall    = tp_total / (tp_total + fn_total) if (tp_total + fn_total) else 0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    print(f"\n     F1: {round(f1*100,1)}%  P: {round(precision*100,1)}%  R: {round(recall*100,1)}%  cited-any: {round(cited_any/n*100,1)}%")
    return round(f1 * 100, 1)


def eval_consistency(model: str, n: int) -> float:
    """MedMCQA — same question, shuffled options. % consistent answers."""
    rows = load_hf("openlifescienceai/medmcqa", split="validation", n=n)
    consistent = 0
    for i, row in enumerate(rows, 1):
        opts = [row["opa"], row["opb"], row["opc"], row["opd"]]
        # Order 1: A B C D
        p1 = (
            f"{row['question']}\n"
            f"A. {opts[0]}\nB. {opts[1]}\nC. {opts[2]}\nD. {opts[3]}\n\n"
            "Answer with one letter only."
        )
        # Order 2: C D A B  (shift by 2)
        shuffled = [opts[2], opts[3], opts[0], opts[1]]
        p2 = (
            f"{row['question']}\n"
            f"A. {shuffled[0]}\nB. {shuffled[1]}\nC. {shuffled[2]}\nD. {shuffled[3]}\n\n"
            "Answer with one letter only."
        )
        r1 = _first_letter(ask(model, p1))
        r2 = _first_letter(ask(model, p2))
        # Map back to original option index
        order1 = {"A": 0, "B": 1, "C": 2, "D": 3}
        order2 = {"A": 2, "B": 3, "C": 0, "D": 1}
        idx1 = order1.get(r1, -1)
        idx2 = order2.get(r2, -2)
        if idx1 == idx2:
            consistent += 1
        _progress(i, n, "consistency", consistent)
    return round(consistent / n * 100, 1)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _first_letter(text: str) -> str:
    m = re.search(r"\b([A-Da-d])\b", text)
    if m:
        return m.group(1).upper()
    m = re.search(r"[A-Da-d]", text)
    return m.group(0).upper() if m else ""


def _extract_spans(tokens, tags):
    spans, current = [], []
    for token, tag in zip(tokens, tags):
        if tag == 1:   # B-Disease
            if current:
                spans.append(" ".join(current))
            current = [token]
        elif tag == 2: # I-Disease
            current.append(token)
        else:
            if current:
                spans.append(" ".join(current))
            current = []
    if current:
        spans.append(" ".join(current))
    return spans


def _parse_diseases_json(text: str):
    # Strip markdown fences
    text = re.sub(r"```(?:json)?", "", text).strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict) and isinstance(data.get("diseases"), list):
            return [str(d) for d in data["diseases"]], True
    except Exception:
        pass
    return [], False


def _progress(i: int, n: int, name: str, correct: int = None):
    pct = f" — acc {correct/i*100:.0f}%" if correct is not None else ""
    print(f"  [{i}/{n}] {name}{pct}", end="\r", flush=True)


# ── Supabase upload ────────────────────────────────────────────────────────────

def push_to_supabase(result: dict):
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    if not url or not key:
        print("Skipping Supabase push — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY not set")
        return
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    row = {
        "model_id": result["model_id"],
        "model_name": result["model_name"],
        "hardware": result.get("hardware", ""),
        "ollama_version": result.get("ollama_version", ""),
        "submitted_by": result.get("submitted_by", ""),
        "med_knowledge": result["scores"].get("med_knowledge"),
        "clinical_reasoning": result["scores"].get("clinical_reasoning"),
        "evidence_reasoning": result["scores"].get("evidence_reasoning"),
        "claim_verification": result["scores"].get("claim_verification"),
        "entity_extraction": result["scores"].get("entity_extraction"),
        "json_reliability": result["scores"].get("json_reliability"),
        "consistency": result["scores"].get("consistency"),
        "citation_grounding": result.get("safety_scores", {}).get("citation_grounding"),
        "samples": result.get("samples", 100),
        "seed": result.get("seed", 42),
    }
    # Delete existing entry for this model first to avoid duplicates
    del_req = urllib.request.Request(
        f"{url}/rest/v1/eval_results?model_name=eq.{urllib.parse.quote(row['model_name'])}",
        headers=headers,
        method="DELETE",
    )
    try:
        with urllib.request.urlopen(del_req) as r: r.read()
    except Exception:
        pass

    body = json.dumps(row).encode()
    req = urllib.request.Request(
        f"{url}/rest/v1/eval_results",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            resp.read()
        print("Pushed to Supabase leaderboard.")
    except urllib.error.HTTPError as e:
        print(f"Supabase push failed: {e.code} {e.read().decode()}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("model", help="Ollama model tag, e.g. meditron:7b or llama3.1:8b")
    ap.add_argument("--samples", type=int, default=100, help="Samples per eval (default 100)")
    ap.add_argument("--repeats", type=int, default=1, help="Run each eval N times and report mean ± stdev + 95%% CI")
    ap.add_argument("--grounding", action="store_true", help="Also run Citation Grounding eval (Citation F1 on PubMedQA passages)")
    ap.add_argument("--push", action="store_true", help="Upload results to Supabase")
    ap.add_argument("--submitted-by", default="", help="Your name/handle for the leaderboard")
    ap.add_argument("--hardware", default="", help="e.g. 'MacBook Pro M3 32GB'")
    args = ap.parse_args()

    model = args.model
    n = args.samples
    repeats = max(1, args.repeats)

    print(f"\nHealthLLM Eval Runner")
    print(f"Model   : {model}")
    print(f"Samples : {n} per eval  Repeats: {repeats}")
    print(f"Temp    : {TEMPERATURE}  Seed: {SEED}\n")

    check_ollama(model)

    ollama_version = get_ollama_version()
    model_info = get_ollama_model_info(model)
    if ollama_version:
        print(f"Ollama  : {ollama_version}  Quant: {model_info.get('quantization','?')}\n")

    # Derive model_id from Ollama tag: "meditron:7b" → "meditron-7b"
    model_id = model.replace(":", "-").replace("/", "-")

    # Store per-repeat scores for CI/stdev
    all_runs: dict[str, list] = {
        "med_knowledge": [], "clinical_reasoning": [], "evidence_reasoning": [],
        "claim_verification": [], "entity_extraction": [], "json_reliability": [],
        "consistency": [],
    }

    scores = {}
    t0 = time.time()

    for repeat in range(repeats):
        if repeats > 1:
            print(f"\n── Repeat {repeat + 1}/{repeats} ──")

        print("1/7  Medical knowledge (MedMCQA)...")
        s = eval_med_knowledge(model, n)
        all_runs["med_knowledge"].append(s)
        print(f"\n     Score: {s}%")

        print("2/7  Clinical reasoning (MedQA USMLE)...")
        s = eval_clinical_reasoning(model, n)
        all_runs["clinical_reasoning"].append(s)
        print(f"\n     Score: {s}%")

        print("3/7  Evidence reasoning (PubMedQA)...")
        s = eval_evidence_reasoning(model, n)
        all_runs["evidence_reasoning"].append(s)
        print(f"\n     Score: {s}%")

        print("4/7  Claim verification (PubHealth)...")
        s = eval_claim_verification(model, n)
        all_runs["claim_verification"].append(s)
        print(f"\n     Score: {s}%")

        print("5/7  Entity extraction + JSON reliability (NCBI Disease)...")
        f1, json_pct = eval_entity_extraction(model, n)
        all_runs["entity_extraction"].append(f1)
        all_runs["json_reliability"].append(json_pct)
        print(f"\n     F1: {f1}%  JSON valid: {json_pct}%")

        print("6/7  (json_reliability computed above)")

        print("7/7  Consistency (MedMCQA shuffled)...")
        s = eval_consistency(model, n)
        all_runs["consistency"].append(s)
        print(f"\n     Score: {s}%")

    # Aggregate across repeats
    for k, vals in all_runs.items():
        scores[k] = round(sum(vals) / len(vals), 1)

    # Compute Wilson CI on the final mean (treating mean% as proportion)
    ci: dict[str, tuple] = {}
    for k, vals in all_runs.items():
        mean_pct = sum(vals) / len(vals)
        correct_equiv = round(mean_pct / 100 * n)
        ci[k] = wilson_ci(correct_equiv, n)

    run_stdev: dict[str, float] = {k: stdev(v) for k, v in all_runs.items()}

    health_score = round(sum(scores.values()) / len(scores), 1)

    # Optional: Citation Grounding eval (not included in health_score)
    safety_scores = {}
    if args.grounding:
        print("\n── Safety Evals ──")
        print("G/1  Citation Grounding (PubMedQA passages)...")
        g = eval_citation_grounding(model, n)
        safety_scores["citation_grounding"] = g
        print(f"\n     Citation F1: {g}%")

    elapsed = round(time.time() - t0)

    result = {
        "model_id": model_id,
        "model_name": model,
        "hardware": args.hardware,
        "submitted_by": args.submitted_by,
        "samples": n,
        "repeats": repeats,
        "seed": SEED,
        "temperature": TEMPERATURE,
        "ollama_version": ollama_version,
        "quantization": model_info.get("quantization", ""),
        "parameter_size": model_info.get("parameter_size", ""),
        "elapsed_seconds": elapsed,
        "scores": scores,
        "confidence_intervals": {k: {"lo": v[0], "hi": v[1]} for k, v in ci.items()},
        "run_stdev": run_stdev if repeats > 1 else {},
        "health_score": health_score,
        "safety_scores": safety_scores,
    }

    # Save locally
    out = RESULTS_DIR / f"{model_id}.json"
    out.write_text(json.dumps(result, indent=2))

    def _ci(k):
        lo, hi = ci[k]
        return f"  [{lo}–{hi}]"

    print(f"\n{'─'*56}")
    print(f"  Medical knowledge    {scores['med_knowledge']:>6}%  95% CI {_ci('med_knowledge')}")
    print(f"  Clinical reasoning   {scores['clinical_reasoning']:>6}%  95% CI {_ci('clinical_reasoning')}")
    print(f"  Evidence reasoning   {scores['evidence_reasoning']:>6}%  95% CI {_ci('evidence_reasoning')}")
    print(f"  Claim verification   {scores['claim_verification']:>6}%  95% CI {_ci('claim_verification')}")
    print(f"  Entity extraction    {scores['entity_extraction']:>6}%  95% CI {_ci('entity_extraction')}  (F1)")
    print(f"  JSON reliability     {scores['json_reliability']:>6}%  95% CI {_ci('json_reliability')}")
    print(f"  Consistency          {scores['consistency']:>6}%  95% CI {_ci('consistency')}")
    print(f"{'─'*56}")
    print(f"  Health Score         {health_score:>6}%")
    if repeats > 1:
        print(f"  Run-to-run stdev     {stdev(list(scores.values())):>6}%  (across {repeats} repeats)")
    if safety_scores:
        print(f"{'─'*56}")
        for k, v in safety_scores.items():
            print(f"  {k.replace('_',' ').title():<22} {v:>6}%  (not in health score)")
    print(f"{'─'*56}")
    print(f"\nSaved: {out}")
    print(f"Time : {elapsed//60}m {elapsed%60}s\n")

    if args.push:
        push_to_supabase(result)


if __name__ == "__main__":
    main()
