# HealthLLM — Open Benchmarks for Health AI

**[healthxllm.netlify.app](https://healthxllm.netlify.app)** · [Leaderboard](https://healthxllm.netlify.app/leaderboard) · [Models](https://healthxllm.netlify.app/models) · [Datasets](https://healthxllm.netlify.app/datasets)

A catalogue for shortlisting open health LLMs and clinical datasets. Compare models under the same questions and settings — same datasets, same temperature, same seed every time. Live counts at the top of the site; see the leaderboard for scored models.

> **Not medical advice.** A high score does not make a model safe for patient care. Always validate with domain experts before clinical use.

---

## What's here

### Models catalog (`/models`)
Open-source and open-weight LLMs for health — from specialized medical fine-tunes to general models with strong clinical performance. Filterable by size, license, specialty, language, and tags.

### Datasets catalog (`/datasets`)
Openly licensed datasets for training, fine-tuning, and evaluating health AI — spanning Medical QA, NER, Radiology, Clinical Records, Drug Safety, Genomics, and more.

### Leaderboard (`/leaderboard`)
Eval scores submitted by the community. Each row shows all Tier 1 scores, the Health Score, grade, and hardware used. Tier 2 (deployment trust) scores appear in a separate column group.

---

## The evals

### Tier 1 — Health Score (7 scores from 6 tasks)

| Eval | Dataset | Metric |
|------|---------|--------|
| Medical knowledge | MedMCQA | Accuracy |
| Clinical reasoning | MedQA USMLE | Accuracy |
| Evidence reasoning | PubMedQA | Accuracy |
| Claim verification | PubHealth | Accuracy |
| Entity extraction | NCBI Disease | F1 |
| JSON reliability | (extraction replies) | % valid |
| Consistency | MedMCQA (shuffled options) | % consistent |

The **Health Score** is the unweighted mean of all seven (0–100). Entity extraction and JSON reliability share one API call but count as separate scores.

### Tier 2 — Deployment Trust (not in Health Score)

| Eval | Flag | Metric |
|------|------|--------|
| Citation Grounding | `--grounding` | Citation F1 |
| Harmful Request Refusal | `--refusal` | Balanced accuracy |
| Epistemic Humility | `--abstention` | % correct abstentions |

See [docs/METHODOLOGY.md](docs/METHODOLOGY.md) for scoring rules, known limits, and design rationale.

---

## Run evals locally

Requires Python 3.10+, [Ollama](https://ollama.com), and the `datasets` package.

```bash
pip install datasets
```

For best performance, start Ollama with parallel request support before running:

```bash
OLLAMA_NUM_PARALLEL=4 ollama serve
```

### Using the eval library (recommended)

```python
from evals.backends import OllamaBackend
from evals.runner import EvalRunner

backend = OllamaBackend("llama3.2:3b", workers=4)
runner  = EvalRunner(backend, n=100, seed=42)

result = runner.run_tier1()
print(result["health_score"])

result = runner.run_tier2()
print(result["tier2_scores"])
```

### Using the CLI script

```bash
# Tier 1 — 7 scores, 100 samples (use for leaderboard submissions)
python3 scripts/run_evals.py llama3.2:3b --workers 4

# Quick trial (20 samples, do not submit)
python3 scripts/run_evals.py llama3.2:3b --samples 20

# Include all Tier 2 evals
python3 scripts/run_evals.py llama3.2:3b --tier2

# Tier 2 only (loads saved Tier 1 from JSON)
python3 scripts/run_evals.py llama3.2:3b --tier2-only

# Measure run-to-run variance
python3 scripts/run_evals.py llama3.2:3b --repeats 3

# Upload result to the leaderboard
python3 scripts/run_evals.py llama3.2:3b --push --submitted-by yourhandle
```

### Apple Silicon (MLX backend)

```bash
python3.11 -m venv .venv-mlx && source .venv-mlx/bin/activate
pip install mlx-lm datasets
python3 scripts/run_evals.py mlx-community/Llama-3.2-3B-Instruct-4bit --backend mlx
```

> MLX and Ollama use different quantisation schemes — scores are not directly comparable across backends. Use Ollama for official leaderboard submissions.

**Rules for a comparable submission:**
- Keep `--samples 100` and seed 42 (the defaults)
- Run all 7 Tier 1 evals — Health Score only appears when all seven are present
- Do not edit the results JSON by hand
- Include `--hardware` so speed numbers are interpretable

---

## Extend the eval library

The `evals/` package is designed to be extended. Adding a new eval takes two steps:

**1. Create the task** in `evals/tasks/my_eval.py`:
```python
from evals.tasks.base import EvalTask

class MyEval(EvalTask):
    name = "my-eval"
    tier = 1          # 1 = in Health Score, 2 = deployment trust
    max_tokens = 64   # keep small for MCQ, larger for generation tasks

    def run(self, backend, n: int, seed: int = 42) -> dict:
        # load data, build prompts, call backend.generate_batch(), score
        return {"score": 72.0, "n": n}
```

**2. Register it** in `evals/tasks/__init__.py`:
```python
from evals.tasks.my_eval import MyEval
TIER1.append(MyEval())   # or TIER2
```

Adding a new backend (OpenAI, vLLM, Groq) works the same way — subclass `Backend` in `evals/backends/`.

---

## Run the site locally

Node 22+ required.

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build
```

---

## Contribute

| | Who | How |
|---|---|---|
| Add a model | ML engineers, researchers | [Open an issue](https://github.com/devankit01/healthllm/issues/new?template=add-model-catalog.yml) with the HuggingFace ID |
| Submit eval scores | Anyone with a GPU or Apple Silicon | Run the eval script and push with `--push` |
| Add a dataset | Clinicians, NLP researchers | [Open an issue](https://github.com/devankit01/healthllm/issues/new?template=add-dataset.yml) |
| Add a new eval | Researchers | Subclass `EvalTask` and open a PR |

See [CONTRIBUTING.md](CONTRIBUTING.md) and the full guide at [/contribute](https://healthxllm.netlify.app/contribute).

---

## Repo layout

```
evals/                       Python eval library
  backends/
    base.py                  Backend ABC — subclass to add a provider
    ollama.py                OllamaBackend (workers + per-call token budgets)
    mlx_backend.py           MLXBackend (Apple Silicon, chat template applied)
  tasks/
    base.py                  EvalTask ABC — subclass to add an eval
    med_knowledge.py         Tier 1: MedMCQA MCQ (max_tokens=32)
    clinical_reasoning.py    Tier 1: MedQA USMLE (max_tokens=32)
    evidence_reasoning.py    Tier 1: PubMedQA yes/no/maybe (max_tokens=16)
    claim_verification.py    Tier 1: PubHealth (max_tokens=16)
    entity_extraction.py     Tier 1: NCBI Disease NER (max_tokens=512)
    consistency.py           Tier 1: shuffled MCQ (max_tokens=32)
    citation_grounding.py    Tier 2: PubMedQA citation F1 (max_tokens=512)
    safety_refusal.py        Tier 2: harmful vs benign prompts (max_tokens=256)
    abstention.py            Tier 2: clinical notes, unanswerable Qs (max_tokens=256)
  utils/
    parsing.py               parse_letter, parse_choice, parse_diseases
    metrics.py               wilson_ci, micro_f1, health_score
    datasets.py              load_items, FIXTURES, DATASETS registry
  runner.py                  EvalRunner — run_tier1(), run_tier2(), run_all()
  run_eval.py                Legacy CLI entry point (tests pass against this)
scripts/
  run_evals.py               Full-featured CLI (Tier 1 + Tier 2 + push to Supabase)
  schema.sql                 Supabase table definitions
  migrate_to_supabase.py     Seeds Supabase from JSON files
app/                         Next.js App Router pages
components/                  React components (Header, Footer, ModelCard, etc.)
data/
  health-models.json         Model catalog
  health-datasets.json       Dataset catalog
  results/                   Eval result JSONs (one per model run)
docs/
  METHODOLOGY.md             How Health Score is computed and its limits
types/
  index.ts                   Shared TypeScript types
```

---

## Stack

- **Frontend:** Next.js 16 (App Router), deployed on Netlify
- **Database:** Supabase (PostgreSQL) — models, datasets, eval results, subscribers
- **Evals:** Python 3 + Ollama (local inference, temperature 0, seed 42) or MLX (Apple Silicon)
- **Datasets:** Hugging Face `datasets` library (downloaded at eval time, not stored in repo)

---

## Licence

Code: [MIT](LICENSE). Datasets keep their own licences and are downloaded at run time — no dataset rows are stored in this repo.
