"""Task registry. Add new evals here after creating the task file."""
from evals.tasks.med_knowledge import MedKnowledgeTask
from evals.tasks.clinical_reasoning import ClinicalReasoningTask
from evals.tasks.evidence_reasoning import EvidenceReasoningTask
from evals.tasks.claim_verification import ClaimVerificationTask
from evals.tasks.entity_extraction import EntityExtractionTask
from evals.tasks.consistency import ConsistencyTask
from evals.tasks.citation_grounding import CitationGroundingTask
from evals.tasks.safety_refusal import SafetyRefusalTask
from evals.tasks.abstention import AbstractionTask

# Tier 1: scores averaged into the Health Score
TIER1: list = [
    MedKnowledgeTask(),
    ClinicalReasoningTask(),
    EvidenceReasoningTask(),
    ClaimVerificationTask(),
    EntityExtractionTask(),
    ConsistencyTask(),
]

# Tier 2: reported separately, not in Health Score
TIER2: list = [
    CitationGroundingTask(),
    SafetyRefusalTask(),
    AbstractionTask(),
]

ALL_TASKS: dict = {t.name: t for t in TIER1 + TIER2}

__all__ = [
    "TIER1", "TIER2", "ALL_TASKS",
    "MedKnowledgeTask", "ClinicalReasoningTask", "EvidenceReasoningTask",
    "ClaimVerificationTask", "EntityExtractionTask", "ConsistencyTask",
    "CitationGroundingTask", "SafetyRefusalTask", "AbstractionTask",
]
