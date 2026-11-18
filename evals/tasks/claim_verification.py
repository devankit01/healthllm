"""Tier 1: Claim verification — PubHealth true/false/mixture/unproven."""
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_items, CLAIM_LABELS
from evals.utils.parsing import parse_choice
from evals.utils.metrics import pct


class ClaimVerificationTask(EvalTask):
    name = "claim-verification"
    tier = 1
    max_tokens = 16  # one word label

    def run(self, backend, n: int, seed: int = 42) -> dict:
        items = load_items(self.name, n, seed)
        prompts = [
            f"Claim: {item['claim']}\n\n"
            "Is this claim true, false, mixture or unproven? Answer with one word."
            for item in items
        ]
        replies = backend.generate_batch(prompts, max_tokens=self.max_tokens)
        correct = sum(parse_choice(r, CLAIM_LABELS) == item["answer"] for r, item in zip(replies, items))
        return {"score": pct(correct, n), "n": n, "correct": correct}
