# Adding a Model

Any open model that runs in [Ollama](https://ollama.com) can be added to the leaderboard. You need Python 3.10+, Ollama running, and enough RAM (a 7B Q4 model needs ~8 GB).

## Quick start

```bash
# Pull the model
ollama pull my-model:7b

# Run all Tier 1 evals and push to leaderboard
python3 scripts/run_evals.py my-model:7b --push
```

That's it. Results are saved to `data/results/my-model-7b.json` and pushed to Supabase.

---

## Eval tiers

### Tier 1 — Health Score (runs by default)

| Eval | Dataset | Metric | Weight |
|------|---------|--------|--------|
| Medical knowledge | MedMCQA | Accuracy | 20% |
| Clinical reasoning | MedQA USMLE | Accuracy | 20% |
| Evidence reasoning | PubMedQA | Accuracy | 15% |
| Claim verification | PubHealth | Accuracy | 15% |
| Entity extraction | NCBI Disease | F1 | 15% |
| Consistency | MedMCQA shuffled | Accuracy | 10% |
| JSON reliability | NCBI Disease | Valid JSON % | 5% |

Health Score = weighted average of all 7. Tier 2 scores are shown separately and not averaged in.

### Tier 2 — Deployment Trust (optional, adds ~30 min)

```bash
python3 scripts/run_evals.py my-model:7b --tier2 --push
```

| Eval | What it measures |
|------|-----------------|
| Citation grounding | Does the model cite passages that support its answer? (F1) |
| Safety refusal | Refuses harmful requests while answering benign ones (balanced accuracy) |
| Abstention | Says "not stated" on unanswerable questions |

---

## Useful flags

| Flag | What it does |
|------|-------------|
| `--push` | Push results to Supabase leaderboard after running |
| `--push-only` | Push saved results without re-running (useful after fixing env vars) |
| `--tier2` | Run all three Tier 2 evals after Tier 1 |
| `--tier2-only` | Run only Tier 2 (loads saved Tier 1 results) |
| `--only entity` | Re-run just one eval and patch saved results |
| `--workers 4` | Parallel inference workers (default 4) |
| `--samples 20` | Quick trial run — do not submit these |
| `--hardware "M4 Pro 48GB"` | Record hardware for the leaderboard |
| `--submitted-by yourname` | Credit on the leaderboard |

### `--only` options

Re-run a single eval without touching the rest:

```bash
python3 scripts/run_evals.py my-model:7b --only entity --push
# Options: entity, consistency, med_knowledge, clinical, evidence, claim
```

Useful when you fix a parser bug or want to re-run a single broken eval.

---

## Custom GGUFs (models not on Ollama)

If your model is a GGUF from HuggingFace:

```bash
# Download
huggingface-cli download org/my-model-GGUF my-model.Q4_K_M.gguf --local-dir models/

# Create Modelfile (see docs/models/ for examples)
cat > models/Modelfile.my-model << 'EOF'
FROM ./my-model.Q4_K_M.gguf
PARAMETER temperature 0
PARAMETER num_predict 1024
TEMPLATE """[INST] {{ .Prompt }} [/INST]"""
SYSTEM "You are a helpful medical AI assistant."
EOF

# Import to Ollama
cd models && ollama create my-model:7b -f Modelfile.my-model
```

**Chat template matters.** Wrong template = near-zero scores. See `docs/models/` for known working templates per architecture:
- Mistral: `[INST] {{ .Prompt }} [/INST]`
- LLaMA 3: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>...`
- Alpaca: `### Instruction:\n{{ .Prompt }}\n\n### Response:`

---

## Known issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Entity extraction 0% | Model outputs plain `[...]` array instead of `{"diseases": [...]}` — both are valid, parser v2 handles both | Update to latest scripts |
| All scores 0% | Missing or wrong chat template in Modelfile | Set correct TEMPLATE (see above) |
| JSON reliability 0% | Model can't follow structured output instructions (e.g. Alpaca-format models) | Known limitation, documented in model notes |
| Ollama HTTP 500 during refusal eval | Model generates very long responses; fixed by per-task token caps | Update to latest scripts |
| Chain-of-thought models score ~0% | `<think>...</think>` blocks confuse the MCQ parser | Strip CoT blocks before scoring (not yet automated) |

---

## After running

Add a model notes file at `docs/models/my-model-7b.md` documenting the template, known quirks, and any interesting findings. See existing files for the format.
