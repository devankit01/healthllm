"""Apple Silicon native inference via mlx-lm."""
from __future__ import annotations
from evals.backends.base import Backend

_model = None
_tokenizer = None
_loaded_id: str | None = None


class MLXBackend(Backend):
    """MLX inference for Apple Silicon Macs.

    Key differences from OllamaBackend:
    - Single-threaded (model loaded in-process, not a server)
    - Uses greedy sampling (deterministic, equivalent to temp=0)
    - Applies the model's instruct chat template automatically
      (Ollama does this transparently; without it instruct models score ~50% lower)

    Install:
        python3.11 -m venv .venv-mlx
        source .venv-mlx/bin/activate
        pip install mlx-lm datasets

    Use HuggingFace model IDs, e.g.:
        mlx-community/Llama-3.2-3B-Instruct-4bit
        mlx-community/Mistral-7B-Instruct-v0.3-4bit
    """

    def __init__(self, model_id: str):
        self.model_id = model_id

    def _load(self) -> None:
        global _model, _tokenizer, _loaded_id
        if _loaded_id == self.model_id:
            return
        try:
            from mlx_lm import load
        except ImportError:
            import sys
            sys.exit("mlx-lm not installed.\nRun: python3.11 -m venv .venv-mlx && source .venv-mlx/bin/activate && pip install mlx-lm")
        print(f"Loading MLX model {self.model_id}...")
        _model, _tokenizer = load(self.model_id)
        _loaded_id = self.model_id
        print("MLX model loaded.\n")

    def generate(self, prompt: str, max_tokens: int = 256) -> str:
        from mlx_lm import generate
        from mlx_lm.sample_utils import greedy_sampler
        self._load()
        # Apply the model's instruct chat template (same as Ollama does automatically)
        messages = [{"role": "user", "content": prompt}]
        formatted = _tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        return generate(_model, _tokenizer, prompt=formatted, verbose=False,
                        max_tokens=max_tokens, sampler=greedy_sampler)
