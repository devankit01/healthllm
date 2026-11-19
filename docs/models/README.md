# Model Notes

Per-model documentation covering chat templates, known quirks, and eval notes.

## Models

| Model | Size | Health Score | Notes |
|-------|------|-------------|-------|
| [MedGemma 4B](./medgemma-4b.md) | 4.3B | 54.6% | Top performer |
| [Llama 3.2 3B](./llama3.2-3b.md) | 3.2B | 50.3% | Best small model |
| [OpenBioLLM 8B](./openbiollm-8b.md) | 8.0B | 45.8% | Requires explicit Modelfile template |
| [BioMistral 7B](./biomistral-7b.md) | 7.2B | 45.3% | Custom GGUF, Mistral template |
| [Phi 3.5](./phi3.5.md) | 3.8B | 44.7% | Perfect JSON reliability |
| [Mistral 7B](./mistral-7b.md) | 7.2B | 43.7% | Solid general baseline |
| [Qwen 2.5 7B](./qwen2.5-7b.md) | 7.6B | 43.1% | Low JSON reliability |
| [Meditron Chat 7B](./meditron-chat-7b.md) | 6.7B | 32.4% | Best citation grounding (81.3%) |
| [Meditron 7B](./meditron-7b.md) | 7B | 15.4% | Base model — not instruct tuned |
| [Tev1 0.8B](./tev1-0.8b.md) | 752M | 12.6% | Smallest tested |
| [DeepSeek R1 7B](./deepseek-r1-7b.md) | 7.6B | — | Removed — CoT format breaks parser |

## Common Issues

### Chat template not set (custom GGUFs)
Models imported from GGUF files (BioMistral, OpenBioLLM, Meditron Chat) require an explicit `TEMPLATE` in their Modelfile. Without it, scores drop to ~0% across all evals.

### JSON array vs object format
Some models output `["disease1", "disease2"]` for entity extraction instead of `{"diseases": [...]}`. Both formats are valid — the parser accepts either as of v2.

### Chain-of-thought models
Reasoning models like DeepSeek R1 wrap answers in `<think>...</think>` blocks. The standard parser reads from the beginning of the response and extracts the wrong content. These models need a preprocessing step to strip CoT blocks before scoring.

### Base models vs chat models
`meditron:7b` on Ollama is a base model (not instruct-tuned). It echoes prompts rather than following instructions. Use `meditron-chat:7b` for a usable chat variant.
