import json
import re
from pathlib import Path
from app.services.normalizer import QUESTION_DOMAIN_MAP, BLOCK_TO_DOMAIN_MAP


def get_repo_root() -> Path:
    # backend/tests/test_schema_sync.py -> backend -> repo root
    return Path(__file__).resolve().parents[2]


def test_shared_schema_exists_and_valid():
    repo_root = get_repo_root()
    shared_schema_path = repo_root / "shared" / "assessment_schema.json"
    assert shared_schema_path.is_file(), f"Missing canonical schema at {shared_schema_path}"

    with open(shared_schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    assert "blocks" in schema
    assert "questions" in schema
    assert len(schema["blocks"]) == 13
    assert len(schema["questions"]) == 100

    # Ensure all question IDs are valid and have existing block mapping
    q_ids = set()
    for q in schema["questions"]:
        assert "id" in q and q["id"], "Question must have non-empty id"
        assert q["id"] not in q_ids, f"Duplicate question id: {q['id']}"
        q_ids.add(q["id"])
        assert q["block"] in BLOCK_TO_DOMAIN_MAP, f"Invalid block {q['block']} for question {q['id']}"


def test_question_domain_map_derived_from_shared_schema():
    repo_root = get_repo_root()
    shared_schema_path = repo_root / "shared" / "assessment_schema.json"
    with open(shared_schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    expected_map = {
        q["id"]: BLOCK_TO_DOMAIN_MAP[q["block"]]
        for q in schema["questions"]
    }

    assert len(QUESTION_DOMAIN_MAP) == len(expected_map)
    for q_id, domain in expected_map.items():
        assert q_id in QUESTION_DOMAIN_MAP, f"Question {q_id} missing from QUESTION_DOMAIN_MAP"
        assert QUESTION_DOMAIN_MAP[q_id] == domain, f"Domain mismatch for {q_id}: {QUESTION_DOMAIN_MAP[q_id]} vs {domain}"


def extract_json_from_js(file_path: Path) -> dict:
    content = file_path.read_text(encoding="utf-8")
    # Match everything between "export const assessmentSchema =" and the trailing semicolon
    match = re.search(r"export\s+const\s+assessmentSchema\s*=\s*(\{[\s\S]*\});?\s*$", content)
    assert match, f"Could not find 'export const assessmentSchema = ...' in {file_path}"
    return json.loads(match.group(1))


def test_frontend_schema_matches_shared_schema():
    repo_root = get_repo_root()
    shared_schema_path = repo_root / "shared" / "assessment_schema.json"
    frontend_schema_path = repo_root / "frontend" / "src" / "data" / "assessmentSchema.js"

    assert frontend_schema_path.is_file(), f"Missing frontend schema at {frontend_schema_path}"

    with open(shared_schema_path, "r", encoding="utf-8") as f:
        canonical = json.load(f)

    frontend_data = extract_json_from_js(frontend_schema_path)

    assert frontend_data == canonical, (
        "frontend/src/data/assessmentSchema.js is out of sync with shared/assessment_schema.json! "
        "Run 'node scripts/sync-schema.mjs' to regenerate."
    )


def test_mobile_schema_matches_shared_schema():
    repo_root = get_repo_root()
    shared_schema_path = repo_root / "shared" / "assessment_schema.json"
    mobile_schema_path = repo_root / "mobile" / "src" / "data" / "assessmentSchema.js"

    assert mobile_schema_path.is_file(), f"Missing mobile schema at {mobile_schema_path}"

    with open(shared_schema_path, "r", encoding="utf-8") as f:
        canonical = json.load(f)

    mobile_data = extract_json_from_js(mobile_schema_path)

    assert mobile_data == canonical, (
        "mobile/src/data/assessmentSchema.js is out of sync with shared/assessment_schema.json! "
        "Run 'node scripts/sync-schema.mjs' to regenerate."
    )
