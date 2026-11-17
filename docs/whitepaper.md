---
title: "HealthLLM Benchmark: An Open Evaluation Framework for Health AI"
subtitle: "A Community White Paper — Draft v0.1 · November 2026"
author: "HealthLLM Project · healthllm.netlify.app"
date: "November 2026"
geometry: "margin=2.5cm"
fontsize: 11pt
linestretch: 1.4
colorlinks: true
linkcolor: "blue"
---

---

# Abstract

Large language models are being adopted in healthcare faster than our ability to evaluate them. Existing benchmarks measure medical knowledge on standardised exam questions but tell clinicians and developers almost nothing about deployment safety — whether a model refuses harmful requests, admits uncertainty, or cites its sources. This paper introduces the HealthLLM Benchmark: an open, reproducible two-tier evaluation framework that separates *medical knowledge* (Tier 1, 7 evals) from *deployment trust* (Tier 2, 3 evals). We report baseline results for four general-purpose models run on consumer hardware, discuss key limitations, and call on the community to contribute model runs, challenge our methodology, and propose new evals.

---

# 1. The Problem

Health AI benchmarking is broken in three ways.

**It measures the wrong thing.** Most benchmarks (MedQA, MedMCQA, PubMedQA) measure whether a model can answer multiple-choice medical questions. This is a proxy for knowledge, not capability. A clinician does not interact with a language model by asking it to pick A, B, C, or D.

**It ignores the most important failure modes.** A model that answers 80% of USMLE questions correctly can still dispense dangerous advice, hallucinate drug dosages, fail to cite any source for a clinical claim, or answer confidently when it should say "I don't know." None of these failures are captured by standard benchmarks.

**It is not reproducible.** Most published benchmark results use proprietary APIs, undisclosed prompts, or evaluation harnesses that cannot be re-run on a local model. Community comparison is effectively impossible.

HealthLLM was built to address all three. Every eval runs locally via Ollama. Temperature 0, seed 42, 100 samples. Any model on any machine can be evaluated and compared.

---

# 2. Our Approach: Two Tiers, Two Questions

We separate evaluation into two tiers that answer fundamentally different questions.

**Tier 1 — Medical Knowledge (Health Score)**
*Does this model know medicine?*

Seven deterministic evals on standardised public datasets. Results are averaged into a 0–100 Health Score and graded A–E. These run on every model automatically.

**Tier 2 — Deployment Trust**
*Can this model be trusted in a real clinical deployment?*

Three opt-in evals that test capabilities no MCQ benchmark can measure: citation grounding, harmful request refusal, and epistemic humility. Results appear in a separate column group and are never averaged into the Health Score. A model can score D on Tier 1 and excellent on Tier 2, or vice versa.

**Why keep them separate?** A well-aligned model that refuses a harmful request or says "I don't know" would *score lower* on the Health Score if safety were mixed in with knowledge. Separating them lets you see both signals without one distorting the other.

---

# 3. Tier 1 — The Seven Core Evals

| # | Eval | Dataset | Metric | Licence |
|---|------|---------|--------|---------|
| 1 | Medical knowledge | MedMCQA | Accuracy | Apache 2.0 |
| 2 | Clinical reasoning | MedQA USMLE | Accuracy | CC BY 4.0 |
| 3 | Evidence reasoning | PubMedQA | Accuracy | MIT |
| 4 | Health claim verification | PubHealth | Accuracy | MIT |
| 5 | Disease entity extraction | NCBI Disease | F1 | CC0 1.0 |
| 6 | Structured output (JSON) | (extraction replies) | % valid | — |
| 7 | Answer consistency | (re-ask MCQ) | % consistent | — |

Each eval uses fixed deterministic scoring. No judge model. No human annotation. The Health Score is the unweighted mean of all seven (0–100).

**Grade thresholds:**

| Grade | Health Score |
|-------|-------------|
| A | ≥ 85 |
| B | 70–84 |
| C | 55–69 |
| D | 40–54 |
| E | < 40 |

---

# 4. Tier 2 — Deployment Trust Evals

These three evals answer the question every developer deploying a health chatbot actually needs answered.

## 4.1 Citation Grounding (`--grounding`)

**Question:** When a model gives a clinical answer, does it cite the passages that actually support it — or does it hallucinate a source?

Given a clinical question and 3–5 numbered PubMedQA passages, the model must answer and list which passage numbers support its answer. We compute Citation F1 (precision × recall harmonic mean) on the cited passage set.

**Why it matters:** A model that always says "Sources: [1][2][3]" for every answer has zero precision. A model that never cites has zero recall. We want models that cite exactly what they used.

## 4.2 Harmful Request Refusal (`--refusal`)

**Question:** Does the model refuse requests that could cause harm — while still answering legitimate clinical questions?

We present 50 curated prompts: 25 clearly harmful (lethal dose queries, prescription fraud guidance, dangerous self-treatment instructions) and 25 legitimate clinical questions (medication mechanisms, disease explanations, screening guidelines). We score **balanced accuracy** — the harmonic mean of sensitivity (harmful prompts correctly refused) and specificity (benign prompts correctly answered, not over-refused).

A model that refuses everything scores 50%. A model that answers everything scores 50%. We want discriminating models.

**Why it matters:** Over-refusal is as much a problem as under-refusal. A clinical decision support tool that refuses to explain metformin dosing is useless. We penalise both failure modes equally.

## 4.3 Epistemic Humility / Abstention (`--abstention`)

**Question:** When a clinical question cannot be answered from the information provided, does the model say so — or does it confabulate?

We present 40 curated clinical note snippets. Each note is 2–4 sentences. Each question asks about something deliberately absent from the note (e.g., a note describes chest pain treatment but the question asks for the patient's cholesterol level). We score the percentage of cases where the model correctly responds with "not stated", "not mentioned", or equivalent.

**Why it matters:** In medicine, a confident wrong answer is more dangerous than "I don't know." A model that invents missing information in a clinical note is a liability in production.

---

# 5. Current Leaderboard Results

Results for four general-purpose models run on consumer MacBook hardware, temperature 0, seed 42, 100 samples each.

| Model | Med | Clinical | Evidence | Claims | NER | JSON | Consist. | **Health Score** | Grade |
|-------|-----|----------|----------|--------|-----|------|----------|-----------------|-------|
| mistral:latest (7.2B) | 42.0 | 50.0 | 44.0 | 23.2 | 37.5 | 82.0 | 55.0 | **47.7** | D |
| qwen2.5:7b (7.6B) | 51.0 | 67.0 | 30.0 | 23.0 | 22.4 | 27.0 | 68.0 | **41.2** | D |
| llama3.2:3b (3.2B) | 47.0 | 57.0 | 61.0 | 48.5 | 0.0 | 1.0 | 55.0 | **38.5** | E |
| meditron:7b (7B) | 38.0 | 25.0 | 0.0 | 0.0 | 0.0 | 0.0 | 3.0 | **9.4** | E |

**Key observations:**

1. **No model breaks 50%.** The highest Health Score is 47.7 (mistral). All four models grade D or E. Health AI is an unsolved problem.

2. **JSON reliability is the great divide.** Mistral (82%) vs meditron (0%) vs llama3.2 (1%). Instruction following, not medical knowledge, is the primary differentiator in structured tasks.

3. **Meditron is a cautionary tale.** The only medically fine-tuned model scores lowest overall. It was trained to *continue* clinical text, not to *follow instructions*. It likely has deeper medical knowledge than these scores suggest — but cannot express it in structured formats. This is a known limitation of first-generation medical fine-tunes.

4. **Tier 2 results are pending.** No model has been run with `--grounding`, `--refusal`, or `--abstention` yet. This is a gap we are asking the community to help fill.

---

# 6. Limitations

We want to be direct about what these scores do not tell you.

**Not clinical validation.** Exam questions and journal abstracts are not patient care. A score tells you how a model performs on these benchmarks, not whether it is safe or effective for clinical use.

**Training data contamination.** These are public datasets. Medical fine-tunes may have been trained on them, inflating their scores. We cannot detect this programmatically.

**Strict parsing punishes chatty models.** A model that explains before answering ("The answer is C because...") may be marked wrong if the letter appears in the wrong position. We use tolerant parsing but edge cases exist.

**MCQ bias.** 4 of 7 Tier 1 evals are multiple-choice. The Health Score is 57% driven by MCQ performance. High scores reflect strong knowledge on standardised questions — not necessarily real clinical workflow performance. That is what Tier 2 evals are for.

**Consumer hardware.** All current results are from MacBook hardware. Performance may differ on server GPUs. We record hardware per submission and do not compare across hardware classes.

**Community-submitted results.** Results are not independently re-run before appearing on the leaderboard. Use `--repeats 3` to measure your own variance.

---

# 7. What We Need From the Community

We are asking for three types of input.

## 7.1 Challenge the Methodology

The 10 evals (7 + 3) represent our best current thinking. We expect to be wrong about some of it. Specifically, we are seeking input on:

- **Are these the right 10 dimensions?** What important capability are we missing?
- **Are the Tier 2 prompt sets well-calibrated?** Should the harmful/benign split in `--refusal` be different? Are the abstention cases realistic?
- **Should the Health Score be weighted?** Is medical knowledge really worth the same as JSON reliability?
- **Should Tier 2 evals be folded into the Health Score** for clinical-deployment-focused models, while keeping them separate for general models?

## 7.2 Submit Model Runs

We have results for 4 models. The leaderboard is sparse. We need:

- More general models (Gemma 2, Phi-3.5, Command-R)
- Medical fine-tunes (Llama-Med, BioMistral, OpenBioLLM)
- Larger models (13B, 34B, 70B)
- Non-English models (health AI is a global problem)

Running an eval takes 25–35 minutes on a modern laptop. All you need is Ollama.

```bash
git clone https://github.com/devankit01/healthllm
cd healthllm
pip install datasets
ollama pull <model>
python3 scripts/run_evals.py <model> --push --submitted-by "@yourhandle"
```

## 7.3 Propose New Evals

The two Tier 2 evals we have not yet built are `--notes` (real clinical notes extraction) and a demographic bias eval (do scores differ by patient age, gender, ethnicity in the clinical vignettes?). If you want to design or build either of these, open an issue on GitHub.

---

# 8. Roadmap

| Week | Work |
|------|------|
| W1 (now) | Citation Grounding eval live · `--grounding` |
| W2 | Run grounding eval on 5 models |
| W3 | Drug Interaction eval · `--drug-interaction` |
| W4 | First article: LLMs on drug interactions |
| W5 | Demographic bias slicing |
| W6 | Model detail pages `/models/[id]` |
| W7 | Errors of Omission eval |
| W8 | Article: 77% of AI harms from what models don't say |
| W9 | Safety/Refusal eval · `--refusal` |
| W10 | Article: Which health LLMs refuse the right requests? |
| W11 | ICD-10 coding prototype |
| W12 | Q1 retrospective · re-run all evals |

---

# 9. How to Contribute

**Run an eval:** `python3 scripts/run_evals.py <model> --push`

**Submit feedback:** Open an issue at github.com/devankit01/healthllm

**Follow the leaderboard:** healthllm.netlify.app/leaderboard

**Share this paper:** We want critiques. If you think we are measuring the wrong things, we want to hear it before the methodology hardens.

---

# 10. Conclusion

No model in our current benchmark scores above 50%. The highest grade is D. Health AI is not solved. The benchmarks that exist measure knowledge on clean exam questions. They do not measure whether a model is safe to deploy, honest about its uncertainty, or capable of handling the messy reality of clinical notes and patient questions.

We built HealthLLM to start filling that gap — openly, reproducibly, and with the community's help. The methodology is a starting point, not a final answer. We expect it to evolve as more models are tested, more failure modes are discovered, and more people challenge our assumptions.

That challenge is exactly what this paper is asking for.

---

*HealthLLM is an open-source project. All eval code, datasets, and results are publicly available at github.com/devankit01/healthllm. The leaderboard is live at healthllm.netlify.app.*
