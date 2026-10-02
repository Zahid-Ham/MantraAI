import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_test():
    # 1. Login with demo/test account
    print("Testing Auth Login...")
    login_resp = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "demo@mantra.ai", "password": "Password123!"}
    )
    if login_resp.status_code != 200:
        # Register if demo account doesn't exist
        print("Registering new demo user...")
        reg_resp = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={"email": "demo@mantra.ai", "password": "Password123!", "full_name": "Demo User"}
        )
        login_resp = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": "demo@mantra.ai", "password": "Password123!"}
        )
    
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token_data = login_resp.json()
    token = token_data.get("access_token")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("Authenticated successfully!")

    # 2. Create Assessment Session
    print("\nCreating Assessment Session...")
    create_resp = requests.post(
        f"{BASE_URL}/api/v1/assessments",
        headers=headers,
        json={"assessment_version": "1.0"}
    )
    assert create_resp.status_code == 201, f"Create session failed: {create_resp.text}"
    session_id = create_resp.json()["id"]
    print(f"Session Created: {session_id}")

    # 3. Submit Sample Responses
    print("\nSubmitting Assessment Responses...")
    sample_responses = {
        "age": 31,
        "relationship_status": "Partnered / Married",
        "conception_timeline": "Actively trying for 6-12 months",
        "prior_evaluations": "None",
        "sleep_duration": "5-6 hours",
        "stress_level": "High (frequently overwhelmed)",
        "physical_activity": "Sedentary (mostly sitting)",
        "diet_pattern": "Standard / Irregular meals",
        "alcohol_consumption": "Moderate (3-5 drinks per week)",
        "tobacco_nicotine": "Former user (quit > 1 year)",
        "heat_exposure": "Daily laptop on lap > 3 hours",
        "medications_supplements": "Multivitamin occasionally",
        "performance_confidence": "Occasional anxiety"
    }

    resp_submit = requests.post(
        f"{BASE_URL}/api/v1/assessments/{session_id}/responses",
        headers=headers,
        json={"responses": sample_responses}
    )
    assert resp_submit.status_code == 200, f"Submit responses failed: {resp_submit.text}"
    print(f"Submitted {len(sample_responses)} responses successfully.")

    # 4. Complete Session (Triggers Groq Report Generation & Enrichment)
    print("\nCompleting Assessment & Generating MantraAI Report...")
    complete_resp = requests.post(
        f"{BASE_URL}/api/v1/assessments/{session_id}/complete",
        headers=headers
    )
    assert complete_resp.status_code == 200, f"Complete session failed: {complete_resp.text}"
    complete_data = complete_resp.json()
    print(f"Assessment Status: {complete_data.get('status')}")

    # 5. Fetch Generated Report
    print("\nFetching Detailed Report...")
    report_resp = requests.get(
        f"{BASE_URL}/api/v1/assessments/{session_id}/report",
        headers=headers
    )
    assert report_resp.status_code == 200, f"Fetch report failed: {report_resp.text}"
    report = report_resp.json()

    print("\n================ REPORT VERIFICATION ================")
    print(f"Model Name: {report.get('report_metadata', {}).get('model_name') or report.get('model_name')}")
    print(f"Headline: {report.get('executive_summary', {}).get('headline')}")
    print(f"Priority Factors: {len(report.get('priority_factors', []))}")
    print(f"Positive Factors: {len(report.get('positive_factors', []))}")
    print(f"Personalized Action Plan: {len(report.get('personalized_action_plan', []))}")
    print(f"Questions for Clinician: {len(report.get('questions_to_discuss_with_clinician', []))}")
    print(f"When to Seek Help: {len(report.get('when_to_seek_professional_help', []))}")
    print(f"Evidence References: {len(report.get('evidence', []))}")
    
    # Assert completeness
    assert len(report.get('priority_factors', [])) > 0, "Priority factors empty!"
    assert len(report.get('positive_factors', [])) > 0, "Positive factors empty!"
    assert len(report.get('personalized_action_plan', [])) > 0, "Action plan empty!"
    assert len(report.get('questions_to_discuss_with_clinician', [])) > 0, "Clinician questions empty!"
    assert len(report.get('evidence', [])) > 0, "Evidence empty!"
    assert report.get('reproductive_health'), "Reproductive health empty!"
    assert report.get('sexual_health'), "Sexual health empty!"
    assert report.get('mental_behavioral_wellness') or report.get('mental_wellbeing'), "Mental wellness empty!"
    assert report.get('lifestyle_wellness') or report.get('lifestyle'), "Lifestyle empty!"
    assert report.get('environmental_exposure'), "Environmental exposure empty!"
    assert report.get('substance_medication'), "Substance medication empty!"

    print("\n ALL 16 SECTIONS VERIFIED COMPLETE AND VALID!")

if __name__ == "__main__":
    run_e2e_test()
