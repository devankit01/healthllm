"""EvalRunner: wires backends and tasks into a full evaluation run."""
from __future__ import annotations
import time
from typing import TYPE_CHECKING

from evals.tasks import TIER1, TIER2, ALL_TASKS
from evals.tasks.med_knowledge import MedKnowledgeTask
from evals.tasks.consistency import ConsistencyTask
from evals.tasks.entity_extraction import EntityExtractionTask
from evals.utils.metrics import health_score, wilson_ci

if TYPE_CHECKING:
    from evals.backends.base import Backend


class EvalRunner:
    """Runs any combination of Tier 1 / Tier 2 tasks against a backend.

    Usage:
        from evals.backends import OllamaBackend
        from evals.runner import EvalRunner

        backend = OllamaBackend("llama3.2:3b", workers=4)
        runner  = EvalRunner(backend, n=100, seed=42)
        result  = runner.run_tier1()
        print(result["health_score"])
    """

    def __init__(self, backend: "Backend", n: int = 100, seed: int = 42):
        self.backend = backend
        self.n = n
        self.seed = seed

    # ── Tier 1 ────────────────────────────────────────────────────────────────

    def run_tier1(self, verbose: bool = True) -> dict:
        """Run all 7 Tier 1 evals and return scores + Health Score + CIs."""
        t0 = time.time()
        scores: dict[str, float] = {}
        extra: dict[str, dict] = {}

        # MedKnowledge and Consistency share items — run together to avoid re-fetching
        mk_task = MedKnowledgeTask()
        if verbose:
            print(f"1/6  {mk_task.name}...")
        mk_result = mk_task.run(self.backend, self.n, self.seed)
        scores["med-knowledge"] = mk_result["score"]
        extra["med-knowledge"] = mk_result

        # Reuse first_choices for consistency
        from evals.utils.datasets import load_items, LETTERS
        from evals.utils.parsing import parse_letter
        items = load_items("med-knowledge", self.n, self.seed)
        from evals.backends.base import Backend
        import random
        # Reconstruct first_choices from the prompts we already sent
        # (ConsistencyTask needs them; re-run is cheaper than re-fetching dataset)
        first_choices_map: list[int | None] = []
        from evals.utils.datasets import LETTERS as L
        prompts1 = []
        for item in items:
            opts = "\n".join(f"{L[i]}. {o}" for i, o in enumerate(item["options"]))
            prompts1.append(f"{item['question']}\n{opts}\n\nAnswer with one letter (A, B, C or D) and nothing else.")
        replies1 = self.backend.generate_batch(prompts1, max_tokens=mk_task.max_tokens)
        first_choices = [
            L.index(parse_letter(r)) if parse_letter(r) in L else None
            for r in replies1
        ]
        # Note: mk_task already ran above — the second generate_batch here is a duplicate.
        # For now we accept this; a future optimisation could cache replies.
        # TODO: pass replies1 through from MedKnowledgeTask.run()

        task_list = [t for t in TIER1 if t.name not in ("med-knowledge",)]
        for i, task in enumerate(task_list, 2):
            if verbose:
                print(f"{i}/{len(TIER1)}  {task.name}...")
            if isinstance(task, ConsistencyTask):
                result = task.run(self.backend, self.n, self.seed, first_choices=first_choices)
            else:
                result = task.run(self.backend, self.n, self.seed)
            scores[task.name] = result["score"]
            extra[task.name] = result
            # EntityExtraction also yields json_reliability
            if isinstance(task, EntityExtractionTask):
                scores["json-reliability"] = result["json_reliability"]

        hs = health_score(scores)
        ci = {k: wilson_ci(round(v / 100 * self.n), self.n) for k, v in scores.items()}

        return {
            "scores": scores,
            "health_score": hs,
            "confidence_intervals": {k: {"lo": v[0], "hi": v[1]} for k, v in ci.items()},
            "extra": extra,
            "elapsed_seconds": round(time.time() - t0),
        }

    # ── Tier 2 ────────────────────────────────────────────────────────────────

    def run_tier2(self, verbose: bool = True) -> dict:
        """Run all 3 Tier 2 evals and return scores."""
        t0 = time.time()
        scores: dict[str, dict] = {}
        for i, task in enumerate(TIER2, 1):
            if verbose:
                print(f"T2/{i}  {task.name}...")
            scores[task.name] = task.run(self.backend, self.n, self.seed)
        return {"tier2_scores": scores, "elapsed_seconds": round(time.time() - t0)}

    # ── Full run ──────────────────────────────────────────────────────────────

    def run_all(self, verbose: bool = True) -> dict:
        """Run Tier 1 + Tier 2 and merge results."""
        t1 = self.run_tier1(verbose)
        t2 = self.run_tier2(verbose)
        return {**t1, **t2}

    # ── Single task ───────────────────────────────────────────────────────────

    def run_task(self, name: str) -> dict:
        """Run a single task by name."""
        if name not in ALL_TASKS:
            raise ValueError(f"Unknown task '{name}'. Available: {list(ALL_TASKS)}")
        return ALL_TASKS[name].run(self.backend, self.n, self.seed)
