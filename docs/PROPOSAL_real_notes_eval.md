# Proposal: Real Clinical Notes Eval

**Status:** Design — not yet implemented
**Motivation:** Every commenter with clinical software or research experience said the same thing: clean MCQ scores on textbook questions do not predict how a model behaves on real clinical text. Notes are messy, abbreviated, contradictory, and full of implicit context. This eval is the gap that turns HealthLLM from a directory into a benchmark.

---

## What "real notes" means

A real clinical note is not:
- A multiple-choice question with a clean answer
- A PubMed abstract with a yes/no conclusion
- A well-formed clinical vignette written for an exam

A real clinical note is:
- A discharge summary with 12 diagnoses, 8 medications, and a confusing allergy section
- A progress note written at 2am with abbreviations, missing punctuation, and a corrected dosage
- A referral letter that contradicts the previous admission summary

The eval must reflect this. Clean inputs produce inflated scores.

---

## Dataset options (no credentialed access required)

| Dataset | Source | Size | Notes |
|---------|--------|------|-------|
| **MTSamples** | mtsamples.com / HuggingFace | ~4,000 transcriptions | Real medical transcriptions across 40 specialties. Public domain. Best starting point. |
| **MedS-Bench** | HuggingFace `Henrychur/MedS-Bench` | Multi-task | Clinical NLP benchmark, some note-based tasks |
| **MIMIC-III** | PhysioNet | 50k+ notes | Gold standard but requires credentialed access — gate behind a flag |
| **Synthetic notes** | Generated from templates | Unlimited | Useful for adversarial/edge cases. Not real but controllable. |
| **OmicsBank / partner data** | Indian hospital networks (potential) | TBD | Live de-identified data from Tier-1 Indian hospitals — highest-value if partnership confirms |

**Start with MTSamples.** It is openly available, covers multiple specialties, and no access request is needed. Add MIMIC-III as a `--notes-mimic` flag for users who have credentialed access.

---

## The 4 tasks

Each note in the eval set is used for all four tasks. Tasks are scored independently and combined into a **Notes Score**.

### Task 1 — Entity Extraction
**What:** Given a clinical note, extract diagnoses and active medications.

**Prompt:**
```
Clinical note:
{note}

List the diagnoses and active medications mentioned in this note.
Return JSON: {"diagnoses": [...], "medications": [...]}
```

**Scoring:** Token-level F1 against a gold annotation set. Partial match (e.g. "type 2 diabetes" matches "diabetes mellitus type 2") counted via stemmed overlap, not exact string match.

**Why it matters:** A model that hallucinates a diagnosis or misses an active medication is dangerous regardless of its MedQA score.

---

### Task 2 — Faithful Summarisation
**What:** Ask the model to summarise a discharge note in 3–5 sentences. Check that every sentence is grounded in the note — no hallucinated facts.

**Prompt:**
```
Summarise the following clinical note in 3-5 sentences.
Only include information that appears in the note.

Note:
{note}
```

**Scoring:**
- **Factual precision:** Each sentence in the summary is checked against the note using NLI entailment (cross-encoder/nli-MiniLM2-L6-H768 or rule-based substring). Precision = sentences entailed / total sentences.
- **Coverage recall:** Key facts from the gold summary are covered. Recall = gold facts covered / total gold facts.
- **Faithfulness F1** = harmonic mean.

**Why it matters:** Summarisation is the most common real deployment task. A hallucinated sentence in a summary handed to a clinician is a patient safety event.

---

### Task 3 — Clinical QA on the Note
**What:** Ask 3–5 questions about a specific note where the answer must come from the note, not from general medical knowledge.

**Prompt:**
```
Answer the following question using only the information in the clinical note below.
If the answer is not in the note, say "not stated".

Note:
{note}

Question: {question}
```

**Examples:**
- "What was the patient's creatinine on admission?"
- "Which antibiotic was prescribed and at what dose?"
- "Was the patient discharged to home or a facility?"

**Scoring:** Exact match on extractive answers (numbers, drug names, locations). F1 on longer answers. "Not stated" is correct if the answer is genuinely absent — this tests abstention.

**Why it matters:** Tests retrieval from noisy text, not memorised medical facts. Directly relevant to RAG pipelines.

---

### Task 4 — Epistemic Humility (Abstention Rate)
**What:** Ask questions where the answer is deliberately NOT in the note. Measure whether the model admits it doesn't know vs fabricating an answer.

**Prompt:**
```
Answer the following question using only the information in the clinical note below.
If the answer is not in the note, say exactly "not stated".

Note:
{note}

Question: {question}  ← answer is absent from this note
```

**Scoring:**
- **Abstention precision:** fraction of unanswerable questions where the model said "not stated" (or equivalent)
- **Answer precision:** fraction of answerable questions where model gave a correct answer (from Task 3)
- **Combined:** harmonic mean of both — rewards models that are right when they answer AND honest when they can't

**Why it matters:** Ashish Patel (Oracle) put it best: "The ultimate benchmark is epistemic humility — how accurately a model knows what it doesn't know." No current health leaderboard measures this.

---

## Composite Notes Score

```
Notes Score = mean(entity_f1, faithfulness_f1, qa_f1, abstention_score)
```

Shown as a separate column group on the leaderboard — not averaged into Health Score, to avoid penalising general-purpose models.

---

## Annotation strategy for MTSamples

MTSamples has no gold annotations. We need to create them. Two options:

**Option A — Automated silver labels:** Use GPT-4o or Claude to annotate a fixed 200-note split. Publish the annotations as a fixed eval set. Fast, imperfect, transparent.

**Option B — Manual gold labels:** Ask domain expert volunteers (the LinkedIn community includes clinicians) to annotate 50 notes. Slow, high-quality, more credible.

**Recommendation:** Do Option A first with 100 notes. Publish the annotation script alongside the eval so the community can challenge and correct it. Mark as "silver labels — community review open."

---

## Implementation plan

| Step | What | Owner |
|------|------|-------|
| 1 | Download MTSamples, pick 100 notes across 10 specialties (10 per specialty) | Script |
| 2 | Generate silver annotations (entities, gold summaries, QA pairs, unanswerable questions) | Annotation script |
| 3 | Publish as `data/notes-eval/` with annotation script and methodology note | Repo |
| 4 | Add `eval_notes()` to `run_evals.py` with `--notes` flag | Python |
| 5 | Add Notes Score column group to leaderboard | Next.js |
| 6 | Run on 5 models, publish results | Eval run |
| 7 | Write article: "We ran 5 health LLMs on real clinical notes. Here's what MCQ scores miss." | Blog |

---

## Open questions

1. **MTSamples licensing:** Marked as "for educational use" on the original site. The HuggingFace upload needs a licence check before we publish a fixed eval split from it. Fallback: use 100% synthetic notes generated from MTSamples templates.
2. **Specialties to include:** Suggest starting with internal medicine, cardiology, neurology, oncology, emergency medicine, psychiatry, paediatrics, orthopaedics, radiology, and primary care (10 notes each).
3. **MIMIC-III flag:** Add `--notes-mimic` as a credentialed-access path. Users with PhysioNet access get a higher-quality eval; results are tagged separately on the leaderboard.
4. **OmicsBank partnership:** If de-identified Indian hospital notes become available, they form a third path — geographically diverse, real-world messy. Would be the first eval of this kind on a public leaderboard.

---

## What makes this different from existing evals

| Existing eval | Input | What it misses |
|---------------|-------|----------------|
| MedQA USMLE | Clean vignette, 4 options | No extraction, no noise, no abstention |
| PubMedQA | Abstract, yes/no/maybe | Research text not clinical text |
| NCBI Disease NER | Clean PubMed sentences | Not clinical notes |
| MedRAG (grounding) | Retrieved passages | Not full notes, no summarisation |
| **This eval** | Messy real discharge summaries, progress notes, referrals | — |

---

*Design document. No code changes included. Feedback welcome via GitHub Issues.*
