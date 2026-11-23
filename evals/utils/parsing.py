"""Reply parsing utilities shared across all eval tasks.

This is the single canonical parser.  ``scripts/run_evals.py`` imports from
here so there is one source of truth.

Parsing modes
-------------
strict  — requires the answer letter to appear in a small set of unambiguous
          patterns near the start of the reply (original behaviour).
lenient — additionally strips <think>…</think> blocks and falls back to the
          LAST standalone letter in the cleaned reply.  Use ``--strip-thinking``
          on the CLI or pass ``lenient=True`` to ``parse_letter``.
"""
from __future__ import annotations  # enables X | Y syntax on Python 3.9
import json, re

LETTERS = "ABCD"
CLAIM_LABELS = ["false", "mixture", "true", "unproven"]

# ── Think-block stripping ─────────────────────────────────────────────────────

_THINK_RE = re.compile(r"<think>.*?</think>", re.S | re.I)


def strip_thinking(text: str) -> str:
    """Remove <think>…</think> blocks emitted by reasoning models (e.g. DeepSeek-R1)."""
    return _THINK_RE.sub("", text).strip()


# ── MCQ letter parsing ────────────────────────────────────────────────────────

def _parse_letter_strict(t: str) -> str | None:
    """Core strict patterns — applied to already-cleaned text."""
    t = t.strip().replace("*", "")
    # Exact single letter  "C"  "(B)"  "C."
    m = re.fullmatch(r"\(?([A-Da-d])\)?[.:)]?", t)
    if m:
        return m.group(1).upper()
    # Leading letter with punctuation  "C. Vitamin C"  "C) ..."
    m = re.match(r"\(?([A-D])\)?[.:)]", t)
    if m:
        return m.group(1)
    # Explicit answer phrase  "The answer is B."  "Answer: D"
    m = re.search(r"(?i:\banswer\b)(?i:\s+is)?\s*[:\-]?\s*\(?([A-D])\)?(?![A-Za-z])", t)
    if m:
        return m.group(1)
    # "Correct answer is C" / "Correct option is C"
    m = re.search(r"(?i:correct\s+(?:answer|option|choice))\s*[:is]+\s*\**([A-D])\b", t)
    if m:
        return m.group(1)
    # "Therefore … B)" or "Therefore the answer is B"
    m = re.search(r"[Tt]herefore[^.]*\b([A-D])\b", t)
    if m:
        return m.group(1)
    return None


def parse_letter(text: str, lenient: bool = False) -> str | None:
    """Return the MCQ option letter (A-D) a reply chose, or None if ambiguous.

    Parameters
    ----------
    lenient:
        If True, strip <think> blocks first, then fall back to the LAST
        standalone letter in the cleaned reply when strict patterns fail.
        Appropriate for chain-of-thought / thinking models.
    """
    cleaned = strip_thinking(text) if lenient else text
    result = _parse_letter_strict(cleaned)
    if result is not None:
        return result
    if lenient:
        # Last standalone letter is more reliable than first for reasoning models
        # that enumerate all options before concluding.
        matches = list(re.finditer(r"\b([A-Da-d])\b", cleaned))
        if matches:
            return matches[-1].group(1).upper()
    return None


def parse_choice(text: str, choices: list[str], lenient: bool = False) -> str | None:
    """Return first of `choices` that appears as a whole word in `text`.

    If ``lenient=True``, strip <think> blocks before searching so that
    keywords in a reasoning trace don't fire before the actual answer.
    """
    t = strip_thinking(text) if lenient else text
    m = re.search(r"\b(" + "|".join(map(re.escape, choices)) + r")\b", t.lower())
    return m.group(1) if m else None


def parse_diseases(text: str) -> tuple[list[str], bool]:
    """Parse a {"diseases": [...]} JSON reply.

    Returns (mentions, strictly_valid). `strictly_valid` is True only when
    the whole reply is the JSON object (possibly inside a code fence).
    """
    t = text.strip()
    fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", t, flags=re.S)
    if fenced:
        t = fenced.group(1)

    def _read(s: str) -> list[str] | None:
        try:
            obj = json.loads(s)
        except ValueError:
            return None
        items = obj.get("diseases") if isinstance(obj, dict) else None
        if isinstance(items, list) and all(isinstance(x, str) for x in items):
            return items
        return None

    items = _read(t)
    if items is not None:
        return items, True
    m = re.search(r"\{.*\}", text, flags=re.S)
    items = _read(m.group(0)) if m else None
    return (items or []), False


def normalise(mention: str) -> str:
    """Normalise a disease mention for fuzzy matching."""
    return re.sub(r"\s+", " ", re.sub(r"\s*([-/(),'])\s*", r"\1", mention.lower())).strip()


def bio_mentions(tokens: list[str], tags: list[int]) -> set[str]:
    """Convert BIO NER tags (1=begin, 2=inside) to a set of normalised mention strings."""
    mentions, current = set(), []
    for token, tag in zip(tokens, tags):
        if tag == 1:
            if current:
                mentions.add(" ".join(current))
            current = [token]
        elif tag == 2 and current:
            current.append(token)
        else:
            if current:
                mentions.add(" ".join(current))
            current = []
    if current:
        mentions.add(" ".join(current))
    return {normalise(m) for m in mentions}
