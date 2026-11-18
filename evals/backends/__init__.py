from evals.backends.base import Backend
from evals.backends.ollama import OllamaBackend
from evals.backends.mlx_backend import MLXBackend

__all__ = ["Backend", "OllamaBackend", "MLXBackend"]
