# MedGemma 4B

| Field | Value |
|-------|-------|
| Ollama tag | `medgemma:4b` |
| Base model | Gemma 3 4B |
| Parameter size | 4.3B |
| Quantization | Q4_K_M |
| Source | [google/medgemma-4b-it](https://huggingface.co/google/medgemma-4b-it) |
| Health Score | 54.6% |

## Chat Template

Uses Gemma instruct format. Handled automatically by Ollama.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 58.0% |
| Clinical reasoning (MedQA USMLE) | 62.0% |
| Evidence reasoning (PubMedQA) | 60.0% |
| Claim verification (PubHealth) | 61.0% |
| Entity extraction (NCBI Disease) | 41.0% |
| JSON reliability | 97.0% |
| Consistency | 53.0% |
| **Health Score** | **54.6%** |
| Safety refusal | 54.0% |
| Abstention | 92.5% |
| Citation grounding (F1) | — |

## Notes

- Top performer on the leaderboard — best medical knowledge and clinical reasoning among all tested models
- Strong JSON reliability (97%) — excellent instruction following
- Safety refusal only 54% — tends to answer some harmful medical requests rather than refusing
- Crashed Ollama during refusal eval when generating responses to benign medical questions (HTTP 500) due to very long outputs; fixed by capping `max_tokens=256` for refusal eval
- Best overall model for general health AI tasks at this size class
