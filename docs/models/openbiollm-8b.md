# OpenBioLLM 8B

| Field | Value |
|-------|-------|
| Ollama tag | `openbiollm:8b` |
| Base model | Llama 3 8B (medical fine-tune) |
| Parameter size | 8.0B |
| Quantization | Q4_K_M |
| Source | [bartowski/OpenBioLLM-Llama3-8B-GGUF](https://huggingface.co/bartowski/OpenBioLLM-Llama3-8B-GGUF) |
| Health Score | 45.8% |

## Chat Template

Uses LLaMA 3 instruct format with `<|begin_of_text|>` tokens. Custom GGUF — requires explicit Modelfile.

```
TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|><|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
```

Modelfile: `models/Modelfile.openbiollm`

**Important**: Without the explicit LLaMA 3 chat template in the Modelfile, the model scores 0% on all evals. The template must be set exactly as above.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 52.0% |
| Clinical reasoning (MedQA USMLE) | 56.0% |
| Evidence reasoning (PubMedQA) | 54.0% |
| Claim verification (PubHealth) | 49.0% |
| Entity extraction (NCBI Disease) | 26.4% |
| JSON reliability | 93.0% |
| Consistency | 42.0% |
| **Health Score** | **45.8%** |
| Safety refusal | — |
| Abstention | — |
| Citation grounding (F1) | — |

## Notes

- Competitive medical LLM — strong medical knowledge and clinical reasoning for an 8B model
- Chat template is critical: a missing or incorrect template produces all-zero scores
- Initially scored 0% across all evals due to missing Modelfile template — fixed by recreating with LLaMA 3 instruct format
- Good JSON reliability (93%) — suitable for structured output tasks
