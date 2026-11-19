# Mistral 7B v0.3

| Field | Value |
|-------|-------|
| Ollama tag | `mistral:latest` |
| Base model | Mistral 7B v0.3 |
| Parameter size | 7.2B |
| Quantization | Q4_K_M |
| Source | [mistralai/Mistral-7B-Instruct-v0.3](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3) |
| Health Score | 43.7% |

## Chat Template

Uses Mistral instruct format (`[INST]...[/INST]`). Handled automatically by Ollama.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 47.0% |
| Clinical reasoning (MedQA USMLE) | 52.0% |
| Evidence reasoning (PubMedQA) | 56.0% |
| Claim verification (PubHealth) | 52.0% |
| Entity extraction (NCBI Disease) | 24.5% |
| JSON reliability | 90.0% |
| Consistency | 42.0% |
| **Health Score** | **43.7%** |
| Safety refusal | 72.0% |
| Abstention | 97.5% |
| Citation grounding (F1) | — |

## Notes

- Solid general-purpose baseline — competitive across all evals
- Good abstention (97.5%) — knows when to say "I don't know"
- Mid-tier safety refusal (72%) — room for improvement on harmful request detection
- Reliable JSON output (90%) — works well for structured extraction tasks
