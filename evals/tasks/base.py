"""Abstract base class for all eval tasks."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from evals.backends.base import Backend


class EvalTask(ABC):
    """Base for all eval tasks.

    To add a new eval:
        1. Create evals/tasks/my_eval.py
        2. Subclass EvalTask
        3. Set name, tier, max_tokens
        4. Implement run()
        5. Register in evals/tasks/__init__.py

    max_tokens controls how many tokens Ollama/MLX generates per call.
    Set it as small as the task allows — huge wins on MCQ tasks (32 vs 1024).
    """

    name: str        # unique slug, e.g. "med-knowledge"
    tier: int = 1    # 1 = in Health Score, 2 = reported separately
    max_tokens: int = 256

    @abstractmethod
    def run(self, backend: "Backend", n: int, seed: int = 42) -> dict:
        """Run the eval and return a result dict.

        Must include at least {"score": float, "n": int}.
        May include extra keys (e.g. "correct", "f1", "sensitivity").
        """
        ...
