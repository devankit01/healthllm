# Phi 3.5 Mini Instruct

| Field | Value |
|-------|-------|
| Ollama tag | `phi3.5` |
| Base model | Phi-3.5-mini-instruct |
| Parameter size | 3.8B |
| Quantization | Q4_0 |
| Source | [microsoft/Phi-3.5-mini-instruct](https://huggingface.co/microsoft/Phi-3.5-mini-instruct) |
| Health Score | 44.7% |

## Chat Template

Uses Phi-3 instruct format. Handled automatically by Ollama.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 47.0% |
| Clinical reasoning (MedQA USMLE) | 56.0% |
| Evidence reasoning (PubMedQA) | 54.0% |
| Claim verification (PubHealth) | 54.0% |
| Entity extraction (NCBI Disease) | 28.3% |
| JSON reliability | 100.0% |
| Consistency | 34.0% |
| **Health Score** | **44.7%** |
| Safety refusal | — |
| Abstention | — |
| Citation grounding (F1) | — |

## Notes

- Impressive for a 3.8B model — matches or exceeds many 7B models
- Perfect JSON reliability (100%) — best structured output compliance of all tested models
- Entity extraction initially 0% due to parser not accepting plain JSON arrays; fixed in parser v2 — now 28.3%
- Consistency relatively low (34%) — answers shift when options are shuffled
- Strong clinical reasoning (56%) for its size
