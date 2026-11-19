# DeepSeek R1 7B

| Field | Value |
|-------|-------|
| Ollama tag | `deepseek-r1:7b` |
| Base model | DeepSeek R1 7B (reasoning model) |
| Parameter size | 7.6B |
| Quantization | Q4_K_M |
| Source | [deepseek-ai/DeepSeek-R1-Distill-Qwen-7B](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B) |
| Health Score | 0.8% |

## Chat Template

Uses DeepSeek instruct format. Handled automatically by Ollama.

## Notes

- **Removed from leaderboard** — scores do not reflect true capability
- DeepSeek R1 is a chain-of-thought reasoning model that wraps all responses in `<think>...</think>` tags before giving a final answer
- The eval parser extracts the first letter from the response — it reads from the `<think>` block, not the final answer, causing near-zero scores on all MCQ evals
- A correct evaluation would require stripping `<think>...</think>` blocks and parsing only the final answer
- This is a known eval methodology issue for reasoning models, not a model quality issue
- **To add back**: preprocess responses to strip `<think>` blocks before scoring
