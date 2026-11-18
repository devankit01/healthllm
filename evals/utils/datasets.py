"""Dataset loaders and fixtures for all eval tasks."""
from __future__ import annotations
import random, sys
from typing import Callable, Optional

from evals.utils.parsing import bio_mentions, LETTERS, CLAIM_LABELS


# ── Row converters ─────────────────────────────────────────────────────────────

def _mcq_medmcqa(row) -> Optional[dict]:
    if row.get("cop") not in (0, 1, 2, 3):
        return None
    return {"question": row["question"], "options": [row["opa"], row["opb"], row["opc"], row["opd"]], "answer": row["cop"]}


def _mcq_medqa(row) -> Optional[dict]:
    options = row["options"]
    if isinstance(options, dict):
        options = [options[k] for k in LETTERS if k in options]
    elif options and isinstance(options[0], dict):
        options = [o["value"] for o in options]
    answer = row.get("answer_idx")
    if isinstance(answer, str):
        answer = LETTERS.find(answer.strip().upper())
    if len(options) != 4 or answer not in (0, 1, 2, 3):
        return None
    return {"question": row["question"], "options": list(options), "answer": answer}


def _pubmedqa(row) -> Optional[dict]:
    context = row["context"]
    passages = context["contexts"] if isinstance(context, dict) else context
    answer = str(row["final_decision"]).lower()
    if answer not in ("yes", "no", "maybe"):
        return None
    return {"abstract": " ".join(passages), "question": row["question"], "answer": answer}


def _pubhealth(row) -> Optional[dict]:
    label = row["label"]
    if isinstance(label, int):
        if not 0 <= label < len(CLAIM_LABELS):
            return None
        label = CLAIM_LABELS[label]
    label = str(label).lower()
    if label not in CLAIM_LABELS or not row.get("claim"):
        return None
    return {"claim": row["claim"], "answer": label}


def _ncbi(row) -> dict:
    return {"text": " ".join(row["tokens"]), "gold": bio_mentions(row["tokens"], row["ner_tags"])}


# ── Dataset registry ───────────────────────────────────────────────────────────
# Add a new dataset here, then create a task in evals/tasks/.

DATASETS: dict[str, dict] = {
    "med-knowledge": {
        "hf": "openlifescienceai/medmcqa", "config": None,
        "split": "validation", "to_item": _mcq_medmcqa,
    },
    "clinical-reasoning": {
        "hf": "GBaker/MedQA-USMLE-4-options", "config": None,
        "split": "test", "to_item": _mcq_medqa,
    },
    "evidence-reasoning": {
        "hf": "qiaojin/PubMedQA", "config": "pqa_labeled",
        "split": "train", "to_item": _pubmedqa,
    },
    "claim-verification": {
        "hf": "ImperialCollegeLondon/health_fact", "config": None,
        "split": "test", "to_item": _pubhealth,
    },
    "entity-extraction": {
        "hf": "ncbi/ncbi_disease", "config": None,
        "split": "test", "to_item": _ncbi,
    },
    # citation-grounding uses raw PubMedQA rows (passages + labels)
    "citation-grounding": {
        "hf": "qiaojin/PubMedQA", "config": "pqa_labeled",
        "split": "train", "to_item": None,
    },
}

# ── Fixtures for --dry-run / tests ─────────────────────────────────────────────

FIXTURES: dict[str, list[dict]] = {
    "med-knowledge": [
        {"question": "Which vitamin deficiency causes scurvy?",
         "options": ["Vitamin C", "Vitamin B12", "Vitamin A", "Vitamin D"], "answer": 0},
        {"question": "Which organ produces insulin?",
         "options": ["Liver", "Pancreas", "Kidney", "Spleen"], "answer": 1},
    ],
    "clinical-reasoning": [
        {"question": "ST elevation in leads II, III and aVF most often means occlusion of which artery?",
         "options": ["Right coronary", "Left anterior descending", "Left circumflex", "Left main"], "answer": 0},
    ],
    "evidence-reasoning": [
        {"abstract": "Walking lowered systolic pressure by 6 mmHg versus 1 mmHg in controls (p < 0.001).",
         "question": "Does brisk walking lower systolic blood pressure?", "answer": "yes"},
    ],
    "claim-verification": [
        {"claim": "Antibiotics are effective against the common cold.", "answer": "false"},
    ],
    "entity-extraction": [
        {"text": "She uses an inhaler for asthma .", "gold": {"asthma"}},
        {"text": "History of type 2 diabetes mellitus .", "gold": {"type 2 diabetes mellitus"}},
    ],
}


# ── Loaders ────────────────────────────────────────────────────────────────────

def load_items(eval_id: str, n: int, seed: int, dry_run: bool = False) -> list[dict]:
    """Load n items for an eval, shuffled by seed. Use dry_run for offline testing."""
    if dry_run:
        return FIXTURES[eval_id]
    try:
        from datasets import load_dataset
    except ImportError:
        sys.exit("Run: pip install datasets")
    spec = DATASETS[eval_id]
    rows = load_dataset(spec["hf"], spec["config"], split=spec["split"])
    order = list(range(len(rows)))
    random.Random(seed).shuffle(order)
    items = []
    for i in order:
        item = spec["to_item"](rows[i])
        if item is not None:
            items.append(item)
        if len(items) == n:
            break
    if not items:
        sys.exit(f"No usable rows from {spec['hf']}. Run --inspect {eval_id} to debug.")
    return items


def load_raw_rows(eval_id: str, n: int, seed: int) -> list:
    """Load raw HF rows without converting (for tasks that need full row structure)."""
    try:
        from datasets import load_dataset
    except ImportError:
        sys.exit("Run: pip install datasets")
    spec = DATASETS[eval_id]
    rows = load_dataset(spec["hf"], spec["config"], split=spec["split"])
    order = list(range(len(rows)))
    random.Random(seed).shuffle(order)
    return [rows[i] for i in order[:n]]
