"""Ollama backend with parallel workers and per-call token budgets."""
from __future__ import annotations
import json, sys, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

from evals.backends.base import Backend

SEED = 42
TEMPERATURE = 0


class OllamaBackend(Backend):
    """Ollama inference.

    Parallelism:
        workers > 1 enables concurrent requests via ThreadPoolExecutor.
        For true parallelism also start Ollama with OLLAMA_NUM_PARALLEL=<workers>:

            OLLAMA_NUM_PARALLEL=4 ollama serve

    Per-call token budgets:
        generate() accepts max_tokens which maps to Ollama's num_predict.
        Each task sets its own budget (MCQ=32, JSON=512, etc.) — no wasted generation.
    """

    def __init__(self, model: str, workers: int = 4, url: str = "http://localhost:11434"):
        self.model = model
        self.workers = workers
        self.url = url.rstrip("/")
        self._total_tokens = 0
        self._total_ns = 0

    # ── Core call ──────────────────────────────────────────────────────────────

    def generate(self, prompt: str, max_tokens: int = 256) -> str:
        payload = json.dumps({
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": TEMPERATURE,
                "seed": SEED,
                "num_predict": max_tokens,
                "repeat_last_n": 64,
            },
        }).encode()
        req = urllib.request.Request(
            f"{self.url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=600) as resp:
                    data = json.loads(resp.read())
                    self._total_tokens += data.get("eval_count", 0)
                    self._total_ns += data.get("eval_duration", 0)
                    return data.get("response", "").strip()
            except urllib.error.HTTPError as e:
                if e.code == 500 and attempt < 2:
                    continue
                raise
        return ""

    # ── Parallel batch ─────────────────────────────────────────────────────────

    def generate_batch(self, prompts: list[str], max_tokens: int = 256) -> list[str]:
        if self.workers <= 1 or len(prompts) == 1:
            return [self.generate(p, max_tokens) for p in prompts]
        results: list[str | None] = [None] * len(prompts)
        with ThreadPoolExecutor(max_workers=self.workers) as ex:
            futures = {ex.submit(self.generate, p, max_tokens): i for i, p in enumerate(prompts)}
            for f in as_completed(futures):
                results[futures[f]] = f.result()
        return results  # type: ignore[return-value]

    # ── Utilities ──────────────────────────────────────────────────────────────

    @property
    def tokens_per_second(self) -> float | None:
        if self._total_ns == 0:
            return None
        return round(self._total_tokens / (self._total_ns / 1e9), 1)

    def check_available(self) -> None:
        """Exit with a clear message if model is not loaded in Ollama."""
        try:
            payload = json.dumps({"name": self.model}).encode()
            req = urllib.request.Request(
                f"{self.url}/api/show",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                sys.exit(f"Model '{self.model}' not found in Ollama. Run: ollama pull {self.model}")
            raise
        except urllib.error.URLError as e:
            sys.exit(f"Ollama not reachable: {e}\nIs ollama running? Start with:\n  OLLAMA_NUM_PARALLEL={self.workers} ollama serve")

    def get_version(self) -> str:
        try:
            with urllib.request.urlopen(f"{self.url}/api/version", timeout=5) as r:
                return json.loads(r.read()).get("version", "")
        except Exception:
            return ""

    def get_model_info(self) -> dict:
        try:
            payload = json.dumps({"name": self.model}).encode()
            req = urllib.request.Request(
                f"{self.url}/api/show",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
            details = data.get("details", {})
            return {
                "quantization": details.get("quantization_level", ""),
                "parameter_size": details.get("parameter_size", ""),
            }
        except Exception:
            return {}
