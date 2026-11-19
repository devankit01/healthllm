# BioMistral 7B

| Field | Value |
|-------|-------|
| Ollama tag | `biomistral:7b` |
| Base model | Mistral 7B v0.1 |
| Parameter size | 7.2B |
| Quantization | Q4_K_M |
| Source | [MaziyarPanahi/BioMistral-7B-GGUF](https://huggingface.co/MaziyarPanahi/BioMistral-7B-GGUF) |
| Health Score | 45.3% |

## Chat Template

Uses Mistral instruct format (`[INST]...[/INST]`). Custom GGUF — requires explicit Modelfile.

```
TEMPLATE """[INST] {{ .Prompt }} [/INST]"""
```

Modelfile: `models/Modelfile.biomistral`

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 38.0% |
| Clinical reasoning (MedQA USMLE) | 54.0% |
| Evidence reasoning (PubMedQA) | 58.0% |
| Claim verification (PubHealth) | 23.0% |
| Entity extraction (NCBI Disease) | 34.5% |
| JSON reliability | 94.0% |
| Consistency | 49.0% |
| **Health Score** | **45.3%** |
| Safety refusal | 54.0% |
| Abstention | 100.0% |
| Citation grounding (F1) | 8.7% |

## Notes

- Good at evidence reasoning and clinical tasks
- Claim verification notably low (23%) — struggles with fact-checking structured claims
- Citation F1 very low (8.7%) — does not ground answers well to provided passages
- Strong abstention (100%) — always says "I don't know" when it should
- Mistral `[INST]` template must be set explicitly in Modelfile; without it all scores drop to ~0%
