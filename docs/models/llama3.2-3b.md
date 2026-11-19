# Llama 3.2 3B Instruct

| Field | Value |
|-------|-------|
| Ollama tag | `llama3.2:3b` |
| Base model | Llama 3.2 3B |
| Parameter size | 3.2B |
| Quantization | Q4_K_M |
| Source | [meta-llama/Llama-3.2-3B-Instruct](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) |
| Health Score | 50.3% |

## Chat Template

Uses LLaMA 3 instruct format with `<|begin_of_text|>` tokens. Handled automatically by Ollama.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 46.0% |
| Clinical reasoning (MedQA USMLE) | 56.0% |
| Evidence reasoning (PubMedQA) | 60.0% |
| Claim verification (PubHealth) | 54.0% |
| Entity extraction (NCBI Disease) | 20.3% |
| JSON reliability | 90.0% |
| Consistency | 46.0% |
| **Health Score** | **50.3%** |
| Safety refusal | 72.0% |
| Abstention | 100.0% |
| Citation grounding (F1) | — |

## Notes

- Competitive for a 3B model — outperforms several 7B models
- Entity extraction initially scored 0% due to parser only accepting `{"diseases": [...]}` format; model outputs plain JSON arrays `[...]` which is valid — fixed in parser v2
- JSON reliability 90% confirms strong instruction following
- Good general-purpose small model for health tasks
