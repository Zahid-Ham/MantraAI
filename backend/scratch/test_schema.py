import os
import sys
import json
sys.path.insert(0, os.path.abspath("."))

from app.schemas.report import (
    MantraAIReport, ReportMetadata, PriorityFactorReportItem, PositiveFactorReportItem,
    PersonalizedAction, ClinicianDiscussionQuestion, ProfessionalHelpGuidance, EvidenceReference,
    ExecutiveSummary, ReproductiveHealthReportSection, SexualHealthReportSection,
    MentalBehavioralWellnessReportSection, LifestyleWellnessReportSection,
    EnvironmentalExposureReportSection, SubstanceMedicationReportSection,
    ReportLimitations, new_report_to_legacy_view
)
from app.services.report_generator import normalize_report_domain

# Test creating objects with various shapes
def test_schema_robustness():
    # Test positive factor with alternate keys
    pf = PositiveFactorReportItem.model_validate({
        "id": "pos_1",
        "domain": "lifestyle_wellness",
        "title": "Hydration",
        "description": "Good water intake",
        "source_question_ids": ["water_intake"],
        "evidence_refs": ["eau-tobacco-alcohol"]
    })
    print("Positive factor valid:", pf.title)
    
if __name__ == "__main__":
    test_schema_robustness()
