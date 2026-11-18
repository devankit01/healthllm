"""Abstract backend interface. Subclass to add a new inference provider."""
from __future__ import annotations
from abc import ABC, abstractmethod


class Backend(ABC):
    """Pluggable inference backend.

    To add a new provider (e.g. OpenAI, vLLM):
        1. Create evals/backends/myprovider.py
        2. Subclass Backend
        3. Implement generate() and optionally generate_batch()
        4. Register in evals/backends/__init__.py
    """

    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 256) -> str:
        """Generate a response for a single prompt."""
        ...

    def generate_batch(self, prompts: list[str], max_tokens: int = 256) -> list[str]:
        """Generate responses for a batch of prompts.

        Default: sequential. Override in subclasses for parallel execution.
        max_tokens is passed through to generate() so each task controls its budget.
        """
        return [self.generate(p, max_tokens) for p in prompts]
