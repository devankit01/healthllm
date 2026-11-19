# Meditron 7B Chat

| Field | Value |
|-------|-------|
| Ollama tag | `meditron-chat:7b` |
| Base model | LLaMA 2 7B (medical fine-tune, chat/instruct) |
| Parameter size | 6.7B |
| Quantization | Q4_K_M |
| Source | [TheBloke/meditron-7B-chat-GGUF](https://huggingface.co/TheBloke/meditron-7B-chat-GGUF) |
| Health Score | 32.4% |

## Chat Template

Uses **Alpaca format** — not LLaMA-2 chat (`[INST]...[/INST]`) despite being LLaMA-2 based.

```
TEMPLATE """### Instruction:
{{ if .System }}{{ .System }}

{{ end }}{{ .Prompt }}

### Response:
"""
```

Modelfile: `models/Modelfile.meditron-chat`

**Important**: Initial Modelfile used LLaMA-2 chat template which produced `### ANSWER` outputs and near-zero scores. Must use Alpaca format.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 38.0% |
| Clinical reasoning (MedQA USMLE) | 28.0% |
| Evidence reasoning (PubMedQA) | 58.0% |
| Claim verification (PubHealth) | 61.0% |
| Entity extraction (NCBI Disease) | 0.0% |
| JSON reliability | 0.0% |
| Consistency | 14.0% |
| **Health Score** | **32.4%** |
| Safety refusal | 82.0% |
| Abstention | 72.5% |
| Citation grounding (F1) | 81.3% |

## Notes

- Strong citation grounding (81.3%) — best of all tested models on this metric
- Strong safety refusal (82%) — refuses harmful requests while answering benign ones
- Entity extraction and JSON reliability both 0% — Alpaca format cannot follow structured JSON output instructions reliably
- Consistency very low (14%) — answer changes significantly when options are shuffled
- Clinical reasoning low (28%) vs medical knowledge (38%) — better at factual recall than reasoning chains
- Use this model when citation grounding or safety refusal matters; avoid for structured output tasks
