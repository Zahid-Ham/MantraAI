import re

def update_normalizer():
    with open('backend/app/services/normalizer.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add legacy_scores to NormalizedAssessment
    content = content.replace(
        'unmapped_fields:                dict[str, Any] = Field(default_factory=dict)',
        'unmapped_fields:                dict[str, Any] = Field(default_factory=dict)\n    legacy_scores:                  dict[str, Any] = Field(default_factory=dict)'
    )

    # Change QUESTION_DOMAIN_MAP
    # Remove perceived_stress_pss10, gad7_score, phq9_score
    qmap_old = """    "perceived_stress_pss10":         "mental_health_stress",
    "gad7_score":                     "mental_health_stress",
    "phq9_score":                     "mental_health_stress","""
    qmap_new = """    "perceived_stress_rating":        "mental_health_stress",
"""
    for i in range(1, 10):
        qmap_new += f'    "phq9_item_{i}":                  "mental_health_stress",\n'
    for i in range(1, 8):
        qmap_new += f'    "gad7_item_{i}":                  "mental_health_stress",\n'
    
    content = content.replace(qmap_old, qmap_new)

    # Change NUMERIC_FIELDS
    num_old = """    "perceived_stress_pss10",  # slider: 0–33 (integer)
    "gad7_score",          # slider: 0–16 (integer)
    "phq9_score",          # slider: 0–19 (integer)"""
    num_new = """    "perceived_stress_rating",\n"""
    for i in range(1, 10):
        num_new += f'    "phq9_item_{i}",\n'
    for i in range(1, 8):
        num_new += f'    "gad7_item_{i}",\n'
    
    content = content.replace(num_old, num_new)
    
    # Change normalize_assessment_responses
    norm_old = """def normalize_assessment_responses(raw_responses: dict[str, Any]) -> NormalizedAssessment:"""
    norm_new = """def normalize_assessment_responses(raw_responses: dict[str, Any], version: str = "2.0") -> NormalizedAssessment:"""
    content = content.replace(norm_old, norm_new)

    # Update logic in normalize_assessment_responses
    logic_old = """    for question_id, raw_value in raw_responses.items():
        domain = QUESTION_DOMAIN_MAP.get(question_id)

        if domain is None:"""
    logic_new = """    legacy_scores = {}
    for question_id, raw_value in raw_responses.items():
        if version == "1.0" and question_id in ["perceived_stress_pss10", "gad7_score", "phq9_score", "perceived_stress_rating"]:
            # perceived_stress_pss10 alias handling
            legacy_scores[question_id] = _to_int_safe(raw_value)
            continue
            
        domain = QUESTION_DOMAIN_MAP.get(question_id)

        if domain is None:"""
    content = content.replace(logic_old, logic_new)

    ret_old = """        unmapped_fields=unmapped,
    )"""
    ret_new = """        unmapped_fields=unmapped,
        legacy_scores=legacy_scores,
    )
    
    # Compute derived totals for phq9_score and gad7_score if v2
    if version != "1.0":
        mental = domain_buckets["mental_health_stress"]
        
        phq9_items = [mental.get(f"phq9_item_{i}") for i in range(1, 10)]
        if all(x is not None for x in phq9_items):
            mental["phq9_score"] = sum(phq9_items)
        else:
            mental["phq9_score"] = None
            
        gad7_items = [mental.get(f"gad7_item_{i}") for i in range(1, 8)]
        if all(x is not None for x in gad7_items):
            mental["gad7_score"] = sum(gad7_items)
        else:
            mental["gad7_score"] = None
            
    return ret"""
    
    content = content.replace("return NormalizedAssessment(", "ret = NormalizedAssessment(")
    content = content.replace(ret_old, ret_new)
    
    with open('backend/app/services/normalizer.py', 'w', encoding='utf-8') as f:
        f.write(content)

update_normalizer()
