"""Tier 1: Entity extraction + JSON reliability — NCBI Disease NER."""
from evals.tasks.base import EvalTask
from evals.utils.datasets import load_items
from evals.utils.parsing import parse_diseases, normalise
from evals.utils.metrics import micro_f1, pct


class EntityExtractionTask(EvalTask):
    name = "entity-extraction"
    tier = 1
    max_tokens = 512  # JSON output

    def run(self, backend, n: int, seed: int = 42) -> dict:
        items = load_items(self.name, n, seed)
        prompts = [
            'List every disease mentioned in the text as JSON in the form {"diseases": ["..."]}. '
            "Copy each mention exactly as written. Reply with the JSON only.\n\n"
            f"Text: {item['text']}"
            for item in items
        ]
        replies = backend.generate_batch(prompts, max_tokens=self.max_tokens)

        predicted_sets, valid_json = [], 0
        for reply in replies:
            mentions, is_valid = parse_diseases(reply)
            predicted_sets.append({normalise(m) for m in mentions})
            valid_json += is_valid

        gold_sets = [item["gold"] for item in items]
        f1 = micro_f1(gold_sets, predicted_sets)

        return {
            "score": round(f1 * 100, 1),
            "n": n,
            "json_reliability": pct(valid_json, n),
        }
