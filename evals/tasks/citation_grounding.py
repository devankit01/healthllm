"""Tier 2: Citation grounding — does the model cite passages that support its answer?"""
from __future__ import annotations
import re
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_raw_rows
from evals.utils.metrics import pct


class CitationGroundingTask(EvalTask):
    name = "citation-grounding"
    tier = 2
    max_tokens = 512

    def run(self, backend, n: int, seed: int = 42) -> dict:
        rows = load_raw_rows("citation-grounding", n, seed)
        tp_total = fp_total = fn_total = cited_any = processed = 0

        prompts, gold_sets = [], []
        for row in rows:
            ctx = row["context"]
            passages = ctx["contexts"] if isinstance(ctx, dict) else []
            labels = ctx.get("labels", []) if isinstance(ctx, dict) else []
            if not passages:
                continue

            gold = {idx + 1 for idx, lbl in enumerate(labels)
                    if isinstance(lbl, str) and lbl.lower() == "yes"}
            if not gold:
                gold = set(range(1, len(passages) + 1))

            passage_text = "\n".join(f"[{j+1}] {p[:400]}" for j, p in enumerate(passages[:5]))
            prompts.append(
                f"Passages:\n{passage_text}\n\n"
                f"Question: {row['question']}\n\n"
                "Answer the question based on the passages above. "
                "After your answer, list which passage numbers support it, "
                'e.g. "Sources: [1][3]"'
            )
            gold_sets.append((gold, len(passages)))
            processed += 1

        replies = backend.generate_batch(prompts, max_tokens=self.max_tokens)

        for reply, (gold, n_passages) in zip(replies, gold_sets):
            cited = {int(m) for m in re.findall(r'\[(\d+)\]', reply)
                     if 1 <= int(m) <= n_passages}
            if cited:
                cited_any += 1
            tp_total += len(cited & gold)
            fp_total += len(cited - gold)
            fn_total += len(gold - cited)

        precision = tp_total / (tp_total + fp_total) if (tp_total + fp_total) else 0
        recall    = tp_total / (tp_total + fn_total) if (tp_total + fn_total) else 0
        f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0

        return {
            "score": round(f1 * 100, 1),
            "n": processed,
            "precision": round(precision * 100, 1),
            "recall": round(recall * 100, 1),
            "cited_any": pct(cited_any, processed),
        }
