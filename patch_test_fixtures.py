"""
Patch test fixtures to use schema v2.0 question IDs.
Replaces perceived_stress_pss10 -> perceived_stress_rating (0-10 scale),
gad7_score -> individual gad7_item_N fields,
phq9_score -> individual phq9_item_N fields.
"""

import re

GAD7_ITEMS = {f"gad7_item_{i}": 2 for i in range(1, 8)}  # value 2 = "More than half the days"
PHQ9_ITEMS = {f"phq9_item_{i}": 2 for i in range(1, 10)}  # value 2 = "More than half the days"

PHQ9_ITEMS_MILD = {f"phq9_item_{i}": 1 for i in range(1, 10)}  # mild
GAD7_ITEMS_MILD = {f"gad7_item_{i}": 1 for i in range(1, 8)}   # mild

def inject_item_block(items_dict: dict) -> str:
    return ", ".join(f'"{k}": {v}' for k, v in items_dict.items())

for path in [
    'backend/tests/test_normalizer.py',
    'backend/tests/test_context_engine.py',
    'backend/tests/test_report_generator.py',
]:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace raw perceived_stress_pss10: N (score > 27 maps to ~8 on 0-10 scale)
    # perceived_stress_pss10: 28 -> perceived_stress_rating: 8
    # perceived_stress_pss10: 22 -> perceived_stress_rating: 7
    # perceived_stress_pss10: 20 -> perceived_stress_rating: 6
    # perceived_stress_pss10: 15 -> perceived_stress_rating: 5
    # perceived_stress_pss10: 10 -> perceived_stress_rating: 3
    pss_map = {
        '"perceived_stress_pss10": 28': '"perceived_stress_rating": 8',
        '"perceived_stress_pss10": 22': '"perceived_stress_rating": 7',
        '"perceived_stress_pss10": 20': '"perceived_stress_rating": 6',
        '"perceived_stress_pss10": 15': '"perceived_stress_rating": 5',
        '"perceived_stress_pss10": 10': '"perceived_stress_rating": 3',
        '"perceived_stress_pss10": "16"': '"perceived_stress_rating": 5',
        '"perceived_stress_pss10": "invalid_stress_string"': '"perceived_stress_rating": "invalid_stress_string"',
        '"perceived_stress_pss10"': '"perceived_stress_rating"',
    }
    for old, new in pss_map.items():
        content = content.replace(old, new)

    # Replace gad7_score: N
    content = re.sub(
        r'"gad7_score":\s*\d+,',
        inject_item_block(GAD7_ITEMS) + ',',
        content
    )
    # Replace phq9_score: N
    content = re.sub(
        r'"phq9_score":\s*\d+,',
        inject_item_block(PHQ9_ITEMS_MILD) + ',',
        content
    )
    
    # Update list of expected keys in normalizer tests
    content = content.replace(
        '"daily_work_hours", "perceived_stress_pss10", "gad7_score", "phq9_score",',
        '"daily_work_hours", "perceived_stress_rating",'
    )
    # fix assertions for the renamed key
    content = content.replace(
        'result.mental_health_stress["perceived_stress_pss10"] == 16',
        'result.mental_health_stress["perceived_stress_rating"] == 5'
    )
    content = content.replace(
        'result.mental_health_stress["perceived_stress_pss10"] is None',
        'result.mental_health_stress["perceived_stress_rating"] is None'
    )
    content = content.replace(
        'isinstance(result.mental_health_stress["perceived_stress_pss10"], int)',
        'isinstance(result.mental_health_stress["perceived_stress_rating"], int)'
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {path}')
