# Contributing

Thanks for helping build open benchmarks for health AI. Here are the three main ways to contribute.

---

## 1. Submit eval scores

Run the eval script locally on any model available in Ollama and submit the result.

**Requirements:** Python 3.10+, Ollama, the `datasets` package, 8+ GB RAM.

```bash
pip install datasets python-dotenv
ollama pull meditron:7b

python3 scripts/run_evals.py meditron:7b \
  --hardware "MacBook Pro M3 32GB" \
  --submitted-by yourhandle \
  --push
```

The `--push` flag uploads directly to the leaderboard. Or open an [issue](https://github.com/devankit01/healthllm/issues/new?template=add-eval-results.yml) and attach the JSON from `data/results/`.

**Rules for a comparable submission:**
- Keep `--samples 100` and seed 42 (the defaults). Lower sample counts are for local testing only.
- Run all 7 evals — Health Score only appears when all seven are present.
- Do not edit the results JSON by hand.
- Include `--hardware` so speed numbers are interpretable.

---

## 2. Add a model

If a health LLM is missing from the catalog, open an [issue](https://github.com/devankit01/healthllm/issues/new?template=add-model-catalog.yml) with:
- HuggingFace ID (e.g. `epfl-llm/meditron-7b`)
- Ollama tag if available
- Developer name and licence
- Specialty tags

We review and add within 24 hours.

---

## 3. Add a dataset

Clinical NLP datasets are welcome: EHR, radiology, drug safety, genomics, clinical notes, multilingual — all categories.

Open an [issue](https://github.com/devankit01/healthllm/issues/new?template=add-dataset.yml) with:
- HuggingFace ID or source URL
- Licence
- Task type and size
- Language(s)

**Requirements for a dataset to be added:** openly licensed (no signed DUA required to access), does not contain real patient data, available on HuggingFace or a stable public URL.

---

## 4. Propose a new eval

Open an issue before writing code. A new eval needs:
- An openly licensed dataset that downloads without an access request
- A metric computable without a judge model (or a judge model that is itself open and reproducible)
- A clear clinical motivation — what does this measure that existing evals don't?

See [docs/METHODOLOGY.md](docs/METHODOLOGY.md) for how existing evals are scored.

---

## 5. Fix something in the site or scripts

Small fixes can go straight to a pull request. For larger changes — especially to scoring rules or the Health Score formula — open an issue first. Scoring changes affect every model's numbers.

```bash
# Run the site locally
npm install && npm run dev

# Check types
npm run check
```

---

## Ground rules

- **Open models and open data only.** No closed-API models or datasets requiring a signed agreement.
- **No dataset rows in the repo.** Datasets download at eval time via HuggingFace `datasets`. Examples shown on the site are written for the site.
- **No hand-edited scores.** Results files must come from `scripts/run_evals.py`.
- **No patient data, ever.** Do not include real clinical text in issues, examples, or code.
- **Safety evals are opt-in.** `--grounding` and `--refusal` results are welcome but not required.
