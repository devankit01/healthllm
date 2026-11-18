"""Tier 1: Evidence reasoning — PubMedQA yes/no/maybe."""
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_items
from evals.utils.parsing import parse_choice
from evals.utils.metrics import pct

CHOICES = ["yes", "no", "maybe"]


class EvidenceReasoningTask(EvalTask):
    name = "evidence-reasoning"
    tier = 1
    max_tokens = 16  # yes / no / maybe

    def run(self, backend, n: int, seed: int = 42) -> dict:
        items = load_items(self.name, n, seed)
        prompts = [
            f"Abstract: {item['abstract'][:1200]}\n\nQuestion: {item['question']}\n\n"
            "Answer yes, no or maybe, and nothing else."
            for item in items
        ]
        replies = backend.generate_batch(prompts, max_tokens=self.max_tokens)
        correct = sum(parse_choice(r, CHOICES) == item["answer"] for r, item in zip(replies, items))
        return {"score": pct(correct, n), "n": n, "correct": correct}
