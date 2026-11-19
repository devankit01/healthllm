# Qwen 2.5 7B Instruct

| Field | Value |
|-------|-------|
| Ollama tag | `qwen2.5:7b` |
| Base model | Qwen2.5 7B |
| Parameter size | 7.6B |
| Quantization | Q4_K_M |
| Source | [Qwen/Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) |
| Health Score | 43.1% |

## Chat Template

Uses Qwen instruct format with `<|im_start|>` tokens. Handled automatically by Ollama.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 49.0% |
| Clinical reasoning (MedQA USMLE) | 55.0% |
| Evidence reasoning (PubMedQA) | 56.0% |
| Claim verification (PubHealth) | 54.0% |
| Entity extraction (NCBI Disease) | 20.0% |
| JSON reliability | 27.0% |
| Consistency | 43.0% |
| **Health Score** | **43.1%** |
| Safety refusal | — |
| Abstention | — |
| Citation grounding (F1) | — |

## Notes

- Solid medical reasoning scores but dragged down by low JSON reliability (27%)
- JSON reliability is a known weakness — the model sometimes wraps output in explanation text instead of pure JSON
- Entity extraction (20%) is real signal; JSON reliability low score may partially reflect output verbosity rather than incorrect extractions
- Worth re-evaluating with a more lenient JSON parser in future
