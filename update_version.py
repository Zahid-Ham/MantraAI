import re

def update_files():
    # mobile
    with open('mobile/src/context/AssessmentContext.js', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('assessment_version: "1.0"', 'assessment_version: "2.0"')
    with open('mobile/src/context/AssessmentContext.js', 'w', encoding='utf-8') as f:
        f.write(content)

    # frontend
    with open('frontend/src/pages/SymptomAssessment.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('assessment_version: "1.0"', 'assessment_version: "2.0"')
    with open('frontend/src/pages/SymptomAssessment.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

    # backend schema
    with open('backend/app/schemas/assessment.py', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('Optional[str] = "1.0"', 'Optional[str] = "2.0"')
    with open('backend/app/schemas/assessment.py', 'w', encoding='utf-8') as f:
        f.write(content)

    # backend model
    with open('backend/app/models/assessment.py', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('default="1.0"', 'default="2.0"')
    with open('backend/app/models/assessment.py', 'w', encoding='utf-8') as f:
        f.write(content)

    # backend tests
    with open('backend/tests/test_api.py', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('"assessment_version": "1.0"', '"assessment_version": "2.0"')
    content = content.replace('["assessment_version"] == "1.0"', '["assessment_version"] == "2.0"')
    with open('backend/tests/test_api.py', 'w', encoding='utf-8') as f:
        f.write(content)

update_files()
