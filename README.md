# HealthLLM — Open Benchmarks for Health AI

**[healthxllm.netlify.app](https://healthxllm.netlify.app)** · [Leaderboard](https://healthxllm.netlify.app/leaderboard) · [Models](https://healthxllm.netlify.app/models) · [Datasets](https://healthxllm.netlify.app/datasets)

A catalogue for shortlisting open health LLMs and clinical datasets. Compare models under the same questions and settings — same datasets, same temperature, same seed every time. Live counts at the top of the site; see the leaderboard for scored models.

> **Not medical advice.** A high score does not make a model safe for patient care. Always validate with domain experts before clinical use.

---

## What's here

### Models catalog (`/models`)
Open-source and open-weight LLMs for health — from specialized medical fine-tunes to general models with strong clinical performance. Filterable by size, license, specialty, language, and tags. Counts updated weekly.

### Datasets catalog (`/datasets`)
Openly licensed datasets for training, fine-tuning, and evaluating health AI — spanning Medical QA, NER, Radiology, Clinical Records, Drug Safety, Genomics, and more. Counts updated weekly.

### Leaderboard (`/leaderboard`)
Eval scores submitted by the community. Each row shows all 7 eval scores, the Health Score, grade, and hardware used.

---

## The 7 evals

| Eval | Dataset | Metric |
|------|---------|--------|
| Medical knowledge | MedMCQA | Accuracy |
| Clinical reasoning | MedQA USMLE | Accuracy |
| Evidence reasoning | PubMedQA | Accuracy |
| Claim verification | PubHealth | Accuracy |
| Entity extraction | NCBI Disease | F1 |
| JSON reliability | (extraction replies) | % valid |
| Consistency | MedMCQA (shuffled) | % consistent |

The **Health Score** is the unweighted mean of all seven (0–100). See [docs/METHODOLOGY.md](docs/METHODOLOGY.md) for scoring rules and known limits.

### Safety evals (opt-in, not in Health Score)

| Eval | Flag | Metric |
|------|------|--------|
| Citation Grounding | `--grounding` | Citation F1 (precision + recall on PubMedQA passages) |

---

## Run evals locally

Requires Python 3.10+, [Ollama](https://ollama.com), and the `datasets` package.

```bash
pip install datasets python-dotenv
```

```bash
# Basic run — 7 evals, 100 samples
python3 scripts/run_evals.py meditron:7b --hardware "MacBook Pro M3"

# Quick trial (20 samples, do not submit)
python3 scripts/run_evals.py meditron:7b --samples 20

# Include citation grounding eval
python3 scripts/run_evals.py meditron:7b --grounding

# Measure run-to-run variance
python3 scripts/run_evals.py meditron:7b --repeats 3

# Upload result to the leaderboard
python3 scripts/run_evals.py meditron:7b --push --submitted-by yourhandle
```

**Rules for a comparable submission:**
- Keep `--samples 100` and seed 42 (the defaults)
- Run all 7 evals — Health Score only appears when all seven are present
- Do not edit the results JSON by hand
- Include `--hardware` so speed numbers are interpretable

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

Three ways to get involved:

| | Who | How |
|---|---|---|
| Add a model | ML engineers, researchers | [Open an issue](https://github.com/devankit01/healthllm/issues/new?template=add-model-catalog.yml) with the HuggingFace ID |
| Submit eval scores | Anyone with a GPU or Apple Silicon | Run the eval script and push with `--push` |
| Add a dataset | Clinicians, NLP researchers | [Open an issue](https://github.com/devankit01/healthllm/issues/new?template=add-dataset.yml) |

See [CONTRIBUTING.md](CONTRIBUTING.md) and the full guide at [/contribute](https://healthxllm.netlify.app/contribute).

---

## Repo layout

```
app/                   Next.js App Router pages
components/            React components (Header, Footer, ModelCard, etc.)
data/
  health-models.json   329 models catalog
  health-datasets.json 266 datasets catalog
  results/             eval result JSONs (one per model run)
scripts/
  run_evals.py         eval runner — queries Ollama, scores replies, pushes to Supabase
  schema.sql           Supabase table definitions
  migrate_to_supabase.py  seeds Supabase from JSON files
docs/
  METHODOLOGY.md       how Health Score is computed and its limits
  PROPOSAL_grounding_refusal_evals.md  design doc for safety evals
types/
  index.ts             shared TypeScript types
```

---

## Stack

- **Frontend:** Next.js 16 (App Router), deployed on Netlify
- **Database:** Supabase (PostgreSQL) — models, datasets, eval results, subscribers
- **Evals:** Python 3 + Ollama (local inference, temperature 0, seed 42)
- **Datasets:** Hugging Face `datasets` library (downloaded at eval time, not stored in repo)

---

## Licence

Code: [MIT](LICENSE). Datasets keep their own licences and are downloaded at run time — no dataset rows are stored in this repo.
