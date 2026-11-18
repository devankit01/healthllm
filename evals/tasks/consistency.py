"""Tier 1: Consistency — same MedMCQA questions with shuffled option order."""
from __future__ import annotations
import random
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_items, LETTERS
from evals.utils.parsing import parse_letter
from evals.utils.metrics import pct


class ConsistencyTask(EvalTask):
    name = "consistency"
    tier = 1
    max_tokens = 32

    def run(self, backend, n: int, seed: int = 42,
            first_choices: list[int | None] | None = None) -> dict:
        """
        Measures whether the model gives the same answer regardless of option order.

        If first_choices (original-order chosen indices) are passed in from a
        prior MedKnowledge run, they are reused — avoiding an extra API call.
        Otherwise a fresh first-pass is run here.
        """
        items = load_items("med-knowledge", n, seed)
        rng = random.Random(seed + 1)

        if first_choices is None:
            prompts1 = []
            for item in items:
                opts = "\n".join(f"{LETTERS[i]}. {o}" for i, o in enumerate(item["options"]))
                prompts1.append(f"{item['question']}\n{opts}\n\nAnswer with one letter (A, B, C or D) and nothing else.")
            replies1 = backend.generate_batch(prompts1, max_tokens=self.max_tokens)
            first_choices = [
                LETTERS.index(parse_letter(r)) if parse_letter(r) in LETTERS else None
                for r in replies1
            ]

        # Second pass: shuffled option order
        prompts2, orders = [], []
        for item in items:
            order = [0, 1, 2, 3]
            while order == [0, 1, 2, 3]:
                rng.shuffle(order)
            opts = "\n".join(f"{LETTERS[i]}. {item['options'][order[i]]}" for i in range(4))
            prompts2.append(f"{item['question']}\n{opts}\n\nAnswer with one letter (A, B, C or D) and nothing else.")
            orders.append(order)

        replies2 = backend.generate_batch(prompts2, max_tokens=self.max_tokens)

        same = 0
        for before, reply, order in zip(first_choices, replies2, orders):
            if before is None:
                continue
            letter = parse_letter(reply)
            after = order[LETTERS.index(letter)] if (letter and letter in LETTERS) else None
            same += before == after

        return {"score": pct(same, n), "n": n}
