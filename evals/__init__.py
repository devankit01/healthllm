"""HealthLLM eval library.

Quick start:
    from evals.backends import OllamaBackend
    from evals.runner import EvalRunner

    runner = EvalRunner(OllamaBackend("llama3.2:3b", workers=4), n=100)
    result = runner.run_tier1()
    print(result["health_score"])

Adding a new eval:
    1. Create evals/tasks/my_eval.py — subclass EvalTask, set name/tier/max_tokens, implement run()
    2. Register in evals/tasks/__init__.py under TIER1 or TIER2
    Done.

Adding a new backend:
    1. Create evals/backends/myprovider.py — subclass Backend, implement generate()
    2. Register in evals/backends/__init__.py
    Done.
"""
from evals.runner import EvalRunner
from evals.backends import OllamaBackend, MLXBackend
from evals.tasks import TIER1, TIER2, ALL_TASKS

__all__ = ["EvalRunner", "OllamaBackend", "MLXBackend", "TIER1", "TIER2", "ALL_TASKS"]
