"""Scoring metrics: Wilson CI, F1, balanced accuracy, health score."""
from __future__ import annotations
import math


def wilson_ci(correct: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score 95% confidence interval for a proportion."""
    if n == 0:
        return 0.0, 0.0
    p = correct / n
    denom = 1 + z ** 2 / n
    centre = (p + z ** 2 / (2 * n)) / denom
    margin = z * math.sqrt(p * (1 - p) / n + z ** 2 / (4 * n ** 2)) / denom
    return round(max(0.0, centre - margin) * 100, 1), round(min(1.0, centre + margin) * 100, 1)


def micro_f1(gold: list[set], pred: list[set]) -> float:
    """Micro-averaged F1 over sets of mentions."""
    tp = sum(len(g & p) for g, p in zip(gold, pred))
    n_pred = sum(len(p) for p in pred)
    n_gold = sum(len(g) for g in gold)
    if tp == 0 or n_pred == 0 or n_gold == 0:
        return 0.0
    precision = tp / n_pred
    recall = tp / n_gold
    return 2 * precision * recall / (precision + recall)


def balanced_accuracy(sensitivity: float, specificity: float) -> float:
    """Balanced accuracy = (sensitivity + specificity) / 2, as a percentage."""
    return round((sensitivity + specificity) / 2 * 100, 1)


def health_score(scores: dict[str, float]) -> float:
    """Mean of all Tier 1 scores (equal weights)."""
    if not scores:
        return 0.0
    return round(sum(scores.values()) / len(scores), 1)


def pct(part: int, whole: int) -> float:
    return round(100 * part / whole, 1) if whole else 0.0
