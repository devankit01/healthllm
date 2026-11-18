"""Tier 1: Medical knowledge — MedMCQA 4-option MCQ."""
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_items, LETTERS
from evals.utils.parsing import parse_letter
from evals.utils.metrics import pct


class MedKnowledgeTask(EvalTask):
    name = "med-knowledge"
    tier = 1
    max_tokens = 32  # just A/B/C/D + maybe one word

    def run(self, backend, n: int, seed: int = 42) -> dict:
        items = load_items(self.name, n, seed)
        prompts, answers = [], []
        for item in items:
            opts = "\n".join(f"{LETTERS[i]}. {o}" for i, o in enumerate(item["options"]))
            prompts.append(f"{item['question']}\n{opts}\n\nAnswer with one letter (A, B, C or D) and nothing else.")
            answers.append(LETTERS[item["answer"]])
        replies = backend.generate_batch(prompts, max_tokens=self.max_tokens)
        correct = sum(parse_letter(r) == a for r, a in zip(replies, answers))
        return {"score": pct(correct, n), "n": n, "correct": correct}
