# Meditron 7B (Base)

| Field | Value |
|-------|-------|
| Ollama tag | `meditron:7b` |
| Base model | LLaMA 2 7B (medical fine-tune, base — not instruct) |
| Parameter size | 7B |
| Quantization | Q4_0 |
| Source | [epfl-llm/meditron-7b](https://huggingface.co/epfl-llm/meditron-7b) |
| Health Score | 15.4% |

## Chat Template

Uses ChatML template in Ollama but the underlying model is a **base model**, not an instruct/chat model. It echoes or completes prompts rather than following instructions.

## Eval Scores

| Eval | Score |
|------|-------|
| Medical knowledge (MedMCQA) | 23.0% |
| Clinical reasoning (MedQA USMLE) | 24.0% |
| Evidence reasoning (PubMedQA) | 36.0% |
| Claim verification (PubHealth) | 17.0% |
| Entity extraction (NCBI Disease) | 0.0% |
| JSON reliability | 95.0% |
| Consistency | 7.0% |
| **Health Score** | **15.4%** |
| Safety refusal | — |
| Abstention | — |
| Citation grounding (F1) | — |

## Notes

- **Critical**: The `meditron:7b` tag on Ollama is a base language model, not a chat/instruct model. It was fine-tuned on medical text but not trained to follow instructions.
- With standard instruct prompting, it echoes or continues the prompt rather than answering
- With `raw: true` + few-shot completion format, it does produce correct answers (confirmed manually)
- JSON reliability is high (95%) because the model happens to output `{}` or similar short responses that parse as valid JSON
- Entity extraction 0% confirmed as genuine — model does not follow NER instructions
- For a usable chat model, use `meditron-chat:7b` instead (see separate doc)
- **Do not use for production health AI** — scores reflect base model limitations, not medical knowledge ceiling
