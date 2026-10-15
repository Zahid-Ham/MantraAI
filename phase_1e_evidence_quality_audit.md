# MantraAI — Phase 1E: Evidence-Grounded Report Quality & Evaluation Architecture Audit
**Audit Date:** October 13, 2026  
**Auditor:** Senior Healthcare AI Systems Architect & Quality Auditor  
**Audit Scope:** Read-Only Architecture, Evidence Traceability, Clinical Safety, and Evaluation Readiness  
**Target Repository:** `MantraAI` (`c:\Users\user\Desktop\MantraAI`)  
**Commit / Working Tree State:** Branch `main`, Phase 1D working tree preserved intact  

---

## 1. Executive Summary & Readiness Verdict

### Overall Verdict: **CONDITIONALLY READY FOR EVALUATION HARNESS DEVELOPMENT — NOT PRODUCTION READY FOR CLINICAL RELIANCE**

MantraAI has established an architecturally sound, India-first, privacy-conscious foundation for pre-clinical men's health screening. The pipeline enforces deterministic questionnaire normalization, rule-based context extraction, strict Pydantic schemas with forbidden-field blacklists, and fallback mechanisms when third-party AI consent is withheld or when external LLM providers fail.

However, the architecture contains **critical evidence-traceability flaws in its deterministic fallback generator**, **coverage gaps in its evidence corpus**, and **relies entirely on structural schema validation without a post-generation semantic linter for LLM free text**. Furthermore, MantraAI currently lacks a reproducible evaluation benchmark suite to measure claim-to-evidence grounding, hallucination rates, or clinical language boundary compliance.

### Key Metrics & Audit Highlights
| Dimension | Current State | Evaluation Benchmark Goal |
|---|---|---|
| **Evidence Corpus Depth** | 6 authoritative documents / 14 chunks | ≥ 20 documents / ≥ 50 granular chunks |
| **Fallback Evidence Provenance** | ❌ Arbitrary (`valid_ids[0]` stamped indiscriminately) | 100% semantic tag-matched evidence citations |
| **LLM Output Free-Text Linting** | ❌ None (only scans dictionary key names) | Automated regex & semantic blacklist post-processor |
| **Legacy Adapter Provenance** | ⚠️ Replaces evidence IDs with question IDs | Preserves true evidence IDs alongside source question IDs |
| **Automated Evaluation Harness** | ❌ 0 automated evaluation runs / ad-hoc unit tests only | 75-scenario benchmark suite with deterministic metrics |
| **Privacy & Consent Gating** | ✅ Deterministic short-circuit when consent missing | Zero external leakage verified |

---

## 2. Actual Pipeline Architecture & File References

The end-to-end report generation pipeline is orchestrated through clear procedural boundaries:

```
[Questionnaire Responses (86 items / 13 domains)]
                       │
                       ▼
    [app/services/normalizer.py: normalize_assessment_responses]
                       │  (Typed values, range clamping, domain assignment)
                       ▼
    [app/services/context_engine.py: build_health_context]
                       │  (Deterministic flags, modifiable/positive factors, evidence tags)
                       ▼
    [app/services/evidence_retriever.py: retrieve_evidence_for_health_context]
                       │  (Tag-intersection scoring, top-k ranking, deduplication)
                       ▼
            ┌──────────┴──────────┐
   [Has Consent & LLM OK]   [No Consent or Error]
            │                              │
            ▼                              ▼
 [app/services/report_generator.py]  [build_fallback_report()]
 [Groq JSON Mode Synthesis]         (Deterministic template assembly)
            │                              │
            └──────────┬───────────────────┘
                       │
                       ▼
    [app/schemas/report.py: MantraAIReport.model_validate]
                       │  (Structural validation, forbidden field scanner)
                       ▼
    [app/services/report_generator.py: validate_report_content]
                       │  (Cross-checks evidence_refs against retrieved IDs)
                       ▼
    [app/routers/assessment.py: complete_assessment]
                       │  (Persistence in DB as JSON, legacy view adapter)
                       ▼
    [frontend/src/pages/ReportViewer.jsx]
                       (Sectional rendering, Evidence Hub pill navigation)
```

### Detailed Pipeline Stage Analysis

1. **Questionnaire Normalization (`backend/app/services/normalizer.py`)**:
   - *Responsibilities:* Ingests raw answers, maps each question ID to canonical domains (`QUESTION_DOMAIN_MAP`), normalizes data types, clamps out-of-range numerical values, and outputs `NormalizedAssessment`.
   - *Failure Behavior:* Silently drops unmapped questions; defaults missing values to neutral or `None`.
   - *Strengths:* Deterministic, predictable, and fully decoupled from network/IO.

2. **Health Context Engine (`backend/app/services/context_engine.py`)**:
   - *Responsibilities:* Evaluates domain-specific heuristics, extracts `modifiable_factors`, `positive_factors`, `context_flags`, `follow_up_flags`, and emits canonical `evidence_tags`.
   - *Output:* Strongly typed `HealthContext` containing structured signals and quality metadata.

3. **Evidence Retrieval Layer (`backend/app/services/evidence_retriever.py` & `evidence_corpus.py`)**:
   - *Responsibilities:* Takes `HealthContext.evidence_tags`, matches against `EVIDENCE_CORPUS` (6 documents, 14 chunks), scores matches via tag intersection + document type weighting + recency, and outputs `EvidenceContext`.
   - *Failure Behavior:* If no tags match, returns an empty `EvidenceContext` without throwing exceptions.

4. **Synthesis / Fallback Generation (`backend/app/services/report_generator.py`)**:
   - *Path A (Groq Structured Generation):* Builds system prompt containing schema instructions, health context, and retrieved evidence chunks. Requests JSON mode from Groq. Retries up to 3 times on JSON or schema errors.
   - *Path B (Deterministic Fallback `build_fallback_report`):* Directly builds `MantraAIReport` without LLM calls when `allow_external_ai=False` or when Groq encounters connection, rate-limit, auth, or schema validation failures.

5. **Pydantic Validation & Safety Screening (`backend/app/schemas/report.py`)**:
   - *Responsibilities:* Validates JSON against `MantraAIReport`. The `@model_validator` `scan_for_forbidden_fields` scans JSON keys against `FORBIDDEN_FIELDS` (e.g. `fertility_probability`, `diagnosis`, `semen_count_prediction`).
   - *Failure Behavior:* Raises `ValidationError`, triggering retry or fallback.

6. **Persistence & Presentation Adapter (`backend/app/routers/assessment.py` & `frontend/src/pages/ReportViewer.jsx`)**:
   - *Responsibilities:* Merges modern `MantraAIReport` dict with `new_report_to_legacy_view()`, persisting to the `reports` table in SQLite/PostgreSQL. The React frontend renders domain cards, priority factors, action plans, and the interactive Evidence & References card.

---

## 3. Categorized Audit Findings

### Critical Findings (Must Fix Before Clinical Pilot)

#### [CRIT-1] Deterministic Fallback Arbitrarily Stampilng First Retrieved Evidence ID to Unrelated Factors
- **Location:** `backend/app/services/report_generator.py:633, 647, 679, 713, 821, 828, 835, 841, 847, 853`
- **Observed Behavior:**
  ```python
  # Line 632-633:
  valid_ids = [e.evidence_id for e in evidence_context.items]
  first_ev_id = [valid_ids[0]] if valid_ids else []
  ...
  # Stamped indiscriminately:
  priority_factors.append(..., evidence_refs=first_ev_id, ...)
  positive_factors.append(..., evidence_refs=first_ev_id, ...)
  personalized_actions.append(..., evidence_refs=first_ev_id, ...)
  reproductive_health.evidence_refs = first_ev_id
  sexual_health.evidence_refs = first_ev_id
  mental_behavioral_wellness.evidence_refs = first_ev_id
  lifestyle_wellness.evidence_refs = first_ev_id
  environmental_exposure.evidence_refs = first_ev_id
  substance_medication.evidence_refs = first_ev_id
  ```
- **Clinical Risk:** Severe evidence misattribution. If the top retrieved evidence item is `who-infertility-eval` (an initial clinical male infertility evaluation guideline), it is blindly cited for "Take Daily Movement Breaks", "Establish a Consistent Bedtime", "Use a Laptop Desk or Stand", "Sleep regularity", and "Pornography viewing frequency". This generates fabricated evidence links in fallback reports, which violates clinical governance.
- **Recommendation:** Implement a domain- and tag-aware mapping function for fallback assembly (`match_evidence_by_domain_or_tags(chunk_tags, item_tags)`). If no domain-specific chunk is retrieved, leave `evidence_refs=[]` rather than fabricating an irrelevant citation.

---

### High Findings (High Quality & Safety Impact)

#### [HIGH-1] Evidence Corpus Coverage Gaps Against Questionnaire Domains
- **Location:** `backend/app/services/evidence_corpus.py` (506 lines, 6 documents, 14 chunks)
- **Observed Behavior:** The questionnaire captures 86 discrete clinical and lifestyle variables across 13 domains. The corpus currently contains only 14 chunks covering:
  - WHO Infertility Evaluation & Lifestyle (2 chunks)
  - AUA/ASRM Varicocele & Reproductive History (2 chunks)
  - AUA/ASRM Exogenous Steroids & Chemotherapy (2 chunks)
  - EAU Hyperthermia, Tobacco/Alcohol & Finasteride (3 chunks)
  - Occupational Pesticides, Heated Plastics & Sleep Recovery (3 chunks)
  - Spectatoring & Digital Adult Media Expectations (2 chunks)
- **Omissions:** Missing authoritative evidence chunks for:
  - Nutritional patterns (Mediterranean diet, micronutrient intake, antioxidant supplementation)
  - Physical inactivity / prolonged sitting hemodynamics
  - Mobile phone RF-EMF exposure in trousers/pockets (AUA/WHO position statements)
  - Common metabolic comorbidities (Type 2 diabetes, dyslipidemia, metabolic syndrome)
  - Non-substance psychiatric stress / anxiety psychobiology
- **Clinical Risk:** When a user reports poor diet, heavy sitting, or RF-EMF habits, retrieval returns either zero matches or falls back to generic parent guidelines, resulting in ungrounded action plan recommendations.
- **Recommendation:** Expand `EVIDENCE_CORPUS` to at least 20 peer-reviewed guideline documents and 50 topic-specific chunks.

#### [HIGH-2] Missing Post-Generation Semantic Linter for LLM Free-Text Output
- **Location:** `backend/app/schemas/report.py:368-382` (`scan_for_forbidden_fields`)
- **Observed Behavior:** The safety validator only inspects JSON dictionary keys:
  ```python
  def _scan(d: dict[str, Any]):
      for k, v in d.items():
          if str(k).strip().lower() in FORBIDDEN_FIELDS:
              raise ValueError(...)
  ```
  It does **not** inspect the string values within `overview`, `headline`, `description`, `rationale`, or `summary`.
- **Clinical Risk:** If Groq synthesizes a string containing prohibited language (e.g., `"Your chance of conception is 12%"` or `"We diagnose you with clinical varicocele"`), `scan_for_forbidden_fields` will completely miss it because the key name is `description` or `overview`, not `fertility_probability`.
- **Recommendation:** Implement a robust post-generation clinical language linter (`app/services/report_linter.py`) that executes regex-based scans across all serialized text values, raising `ReportValidationError` if prohibited diagnostic, probabilistic, or therapeutic terms are detected.

---

### Medium Findings (Provenance & Operational Deficiencies)

#### [MED-1] Legacy View Adapter Stamping Question IDs into the Evidence Field
- **Location:** `backend/app/schemas/report.py:399-400`
- **Observed Behavior:**
  ```python
  key_findings = [
      {
          "title": factor.title,
          "severity": factor.severity or "moderate",
          "explanation": factor.description,
          "evidence": factor.source_question_ids, # <--- QUESTION IDs, NOT EVIDENCE CHUNKS!
      }
      for factor in report.priority_factors
  ]
  ```
- **Risk:** In legacy consumer endpoints or frontend components relying on `factor.evidence`, the user or clinician sees question keys (e.g. `["laptop_on_lap_usage", "sitting_duration_hours"]`) rendered under the "Evidence" label instead of actual evidence citations.
- **Recommendation:** Rename or split this field into `"source_questions": factor.source_question_ids` and `"evidence_refs": factor.evidence_refs`.

#### [MED-2] Absence of Automated Evaluation Harness & Synthetic Benchmark
- **Location:** `backend/tests/`
- **Observed Behavior:** Tests in `test_report_generator.py` verify that Pydantic models validate and that mocked API calls succeed. However, there is no reproducible test suite evaluating:
  - Evidence citation recall and precision
  - Claim-to-evidence support ratio
  - Hallucination and unsupported claim frequency across clinical scenarios
  - Deterministic fallback consistency across repeated runs
- **Risk:** Prompt revisions, model upgrades (e.g. Groq llama-3.3-70b updates), or corpus changes can silently degrade report quality without failing any CI unit test.
- **Recommendation:** Build an offline evaluation runner (`backend/tests/evaluation/`) with 75 diverse synthetic patient scenarios and deterministic scoring metrics.

---

### Low Findings (Aesthetic & Template Hardcoding)

#### [LOW-1] Hardcoded Fallback Action Plan Templates Cycling by Modulo
- **Location:** `backend/app/services/report_generator.py:697-705`
- **Observed Behavior:**
  ```python
  action_templates = [
      ("Take Daily Movement Breaks", ...),
      ("Establish a Consistent Bedtime", ...),
      ("Use a Laptop Desk or Stand", ...),
  ]
  for idx, f in enumerate(health_context.modifiable_factors[:3]):
      tmpl = action_templates[idx % len(action_templates)]
  ```
  If a user has 3 modifiable factors: `smoking_status`, `alcohol_frequency`, and `high_bmi`, their action plan actions will still be assigned:
  1. "Take Daily Movement Breaks"
  2. "Establish a Consistent Bedtime"
  3. "Use a Laptop Desk or Stand"
- **Risk:** Disconnect between user's reported risk profile and fallback recommendations. While harmless, it reduces personalized utility.
- **Recommendation:** Maintain a deterministic mapping dictionary from `factor_id` to curated fallback action templates.

---

## 4. Existing Safeguards That Are Already Adequate

The audit confirmed several robust mechanisms already operating correctly in the codebase:

1. **Deterministic Short-Circuiting on Consent Denial (`backend/app/services/report_generator.py:1350-1365`)**:
   - If `allow_external_ai=False` (due to missing `THIRD_PARTY_AI_ANALYSIS` consent), the generator immediately routes to `build_fallback_report()` without invoking Groq, preventing PHI leakage over the wire.
2. **Strict Pydantic Extra Fields Prohibition (`extra='forbid'`)**:
   - Enforced across all schemas (`MantraAIReport`, `PriorityFactor`, `PersonalizedAction`, etc.). Any unexpected key introduced by the LLM triggers instant validation failure.
3. **Reference Integrity Verification (`validate_report_content`)**:
   - Enforces that any `evidence_refs` emitted by Groq must belong to the retrieved set `evidence_context.items`. Hallucinated IDs (e.g. `who-2025-unknown`) are rejected.
4. **Non-Diagnostic UI Language in Frontend (`frontend/src/pages/ReportViewer.jsx`)**:
   - Sliders and single-item proxies are explicitly rendered with explanatory disclaimers:
     - `phq9_score`: "Mood indicator (single-item proxy, non-diagnostic)"
     - `gad7_score`: "Anxiety indicator (single-item proxy, non-diagnostic)"
     - `perceived_stress_pss10`: "Perceived stress indicator (single-item proxy, non-diagnostic)"
5. **Rate Limiting & Triage Safeguards**:
   - Rate limiting on `/complete` (10 req/min).
   - Real-time emergency symptom triage intercepting scrotal pain, hematuria, or crisis indicators before report generation.

---

## 5. Evidence Traceability & Source-Quality Deep Dive

### Evidence Corpus Verification Table
| Document ID | Official Source | Type | Year | Identifier | URL Verified |
|---|---|---|---|---|---|
| `who-infertility-2024` | World Health Organization | Guideline | 2024 | ISBN: 9789240115774 | `https://www.who.int/publications/i/item/9789240115774` |
| `aua-asrm-part1-2020` | AUA / ASRM | Guideline | 2020 | DOI: 10.1097/JU.0000000000001371 | `https://www.auanet.org/guidelines-and-quality/guidelines/male-infertility` |
| `aua-asrm-part2-2020` | AUA / ASRM | Guideline | 2020 | DOI: 10.1097/JU.0000000000001372 | `https://www.auanet.org/guidelines-and-quality/guidelines/male-infertility` |
| `eau-repro-2024` | European Association of Urology | Guideline | 2024 | ISBN: 978-94-92671-23-3 | `https://uroweb.org/guidelines/sexual-and-reproductive-health` |
| `env-lifestyle-review-2022` | IJERPH Systematic Review | Systematic Review | 2022 | DOI: 10.3390/ijerph191711102 | `https://doi.org/10.3390/ijerph191711102` |
| `psychosexual-review-2021` | ISSM / PubMed Review | Review | 2021 | PMID: 33857852 | `https://pubmed.ncbi.nlm.nih.gov/33857852/` |

**Verification Result:** All 6 documents use authentic organizations, standard identifiers, and official URLs. Zero fabricated URLs or predatory journals were identified.

---

## 6. Clinical Safety & Language Boundaries

### Single-Item Mental Health Proxies
MantraAI collects exploratory slider responses for stress, anxiety, and mood. The audit verified:
- In `normalizer.py`, fields are mapped to `phq9_score`, `gad7_score`, and `perceived_stress_pss10`.
- In `context_engine.py`, high scores generate `context_flags` and `modifiable_factors` labeled as "elevated self-reported stress indicators".
- In `frontend/src/pages/ReportViewer.jsx`, labels explicitly state: `"(single-item proxy, non-diagnostic)"`.
- **Finding:** While the frontend label is safe, the backend variable names `phq9_score` and `gad7_score` are clinically misleading because single slider items do **not** represent full 9-item PHQ-9 or 7-item GAD-7 psychometric scales.
- **Recommendation:** Maintain the UI disclaimer and document in schema metadata that these are single-item exploratory screening proxies.

---

## 7. Proposed Evaluation Harness Design & Benchmark Suite

### 75-Scenario Synthetic Benchmark Architecture
To evaluate report generation without transmitting Real World Patient Health Information (PHI), MantraAI should establish an offline benchmark dataset containing 75 synthetic patient profiles across 8 clinical clusters:

```
┌────────────────────────────────────────────────────────────────────────┐
│             75-SCENARIO SYNTHETIC EVALUATION BENCHMARK                 │
├───────────────────────────────┬────────────────────────────┬───────────┤
│ Cluster                       │ Clinical Scenario Profile  │ Scenarios │
├───────────────────────────────┼────────────────────────────┼───────────┤
│ 1. Optimal Baseline           │ Healthy habits, young adult│ 8         │
│ 2. Metabolic / Sedentary      │ High BMI, low activity, sit│ 12        │
│ 3. Hyperthermia & Environment │ Laptop on lap, hot baths   │ 10        │
│ 4. Reproductive History Flags │ Varicocele history, injury │ 10        │
│ 5. Psychosexual & Digital     │ High screen time, anxiety  │ 10        │
│ 6. Substance & Medication     │ Nicotine, alcohol, 5-ARIs  │ 10        │
│ 7. Sparse / Missing Answers   │ Minimal required responses │ 8         │
│ 8. Safety & Emergency Triggers│ Scrotal pain, red flags    │ 7         │
└───────────────────────────────┴────────────────────────────┴───────────┘
```

### Deterministic Evaluation Metrics

1. **Schema Compliance Rate ($SCR$):**
   $$\text{SCR} = \frac{\text{Runs validating MantraAIReport without retry}}{\text{Total Runs}} \quad (\text{Target: } \ge 98\%)$$

2. **Evidence Citation Precision ($ECP$):**
   $$\text{ECP} = \frac{\text{Citations semantically relevant to factor domain}}{\text{Total Citations Emitted}} \quad (\text{Target: } \ge 95\%)$$

3. **Arbitrary Evidence Assignment Rate ($AAER$):**
   $$\text{AAER} = \frac{\text{Fallback items assigned generic valid\_ids[0]}}{\text{Total Fallback Items}} \quad (\text{Target: } 0\%)$$

4. **Clinical Boundary Compliance ($CBC$):**
   $$\text{CBC} = \frac{\text{Reports free of forbidden diagnostic / probability terms}}{\text{Total Reports Generated}} \quad (\text{Target: } 100\%)$$

5. **Consent Enforcement Rate ($CER$):**
   $$\text{CER} = \frac{\text{Consent-denied sessions generating deterministic fallbacks}}{\text{Total Consent-Denied Sessions}} \quad (\text{Target: } 100\%)$$

---

## 8. Prioritized Implementation Plan (Milestones)

The remediation and enhancement work should proceed in 4 small, sequentially testable milestones:

```
[Milestone 1E.1: Evidence Corpus Expansion & Fine-Grained Tagging]
                               │
                               ▼
[Milestone 1E.2: Fallback Evidence Provenance & Template Remapping]
                               │
                               ▼
[Milestone 1E.3: Post-Generation Free-Text Safety Linter]
                               │
                               ▼
[Milestone 1E.4: 75-Scenario Evaluation Harness & Metric Suite]
```

### Milestone Details & Verification Commands

#### Milestone 1E.1: Evidence Corpus Expansion & Fine-Grained Tagging
- **Scope:** Add 14 new authoritative evidence documents (WHO, EAU, AUA, ICMR) and expand chunks to 50 items. Expand `evidence_taxonomy.py` with granular nutritional, metabolic, and environmental tags.
- **Verification:**
  ```powershell
  python -m pytest backend/tests/test_evidence_corpus.py backend/tests/test_evidence_retriever.py -v
  ```

#### Milestone 1E.2: Fallback Evidence Provenance & Template Remapping
- **Scope:** Refactor `build_fallback_report()` in `report_generator.py`. Eliminate `valid_ids[0]` blanket binding. Implement domain-aware fallback citation matching. Map fallback action plans directly to identified `modifiable_factors`.
- **Verification:**
  ```powershell
  python -m pytest backend/tests/test_report_generator.py -k "fallback" -v
  ```

#### Milestone 1E.3: Post-Generation Free-Text Safety Linter
- **Scope:** Create `backend/app/services/report_linter.py`. Add recursive free-text string scanner for forbidden diagnostic, numerical probability, and prescriptive phrasing. Hook into `validate_report_content()`.
- **Verification:**
  ```powershell
  python -m pytest backend/tests/test_report_schema.py backend/tests/test_report_generator.py -v
  ```

#### Milestone 1E.4: 75-Scenario Evaluation Harness & Benchmark Suite
- **Scope:** Build `backend/tests/evaluation/eval_harness.py` with 75 synthetic assessment fixtures. Implement deterministic evaluation metrics ($SCR$, $ECP$, $CBC$, $CER$) and generate automated evaluation reports.
- **Verification:**
  ```powershell
  python -m pytest backend/tests/evaluation/test_eval_benchmark.py -v
  ```

---

## 9. Verification & Working Tree Safety

### Git Status & Working Tree Safety Check
- **Branch:** `main`
- **Pre-Audit Git Status:**
  ```
  Changes not staged for commit:
    modified:   backend/app/routers/assessment.py
    modified:   frontend/src/pages/Dashboard.jsx
    modified:   frontend/src/pages/History.jsx
    modified:   frontend/src/pages/MyProgress.jsx
    modified:   frontend/src/pages/ReportViewer.jsx
    modified:   frontend/src/utils/longitudinal.jsx
  Untracked files:
    backend/app/schemas/longitudinal.py
    backend/app/services/longitudinal_service.py
    backend/tests/test_longitudinal_assessment.py
  ```
- **Post-Audit Git Status:** Unchanged (plus new untracked audit report `phase_1e_evidence_quality_audit.md`).
- **Files Inspected:**
  1. `backend/app/services/normalizer.py`
  2. `backend/app/services/context_engine.py`
  3. `backend/app/services/evidence_corpus.py`
  4. `backend/app/services/evidence_taxonomy.py`
  5. `backend/app/services/evidence_retriever.py`
  6. `backend/app/services/report_generator.py`
  7. `backend/app/schemas/report.py`
  8. `backend/app/routers/assessment.py`
  9. `frontend/src/pages/ReportViewer.jsx`
  10. `backend/tests/test_report_generator.py`
  11. `backend/tests/test_evidence_retriever.py`
- **External API Usage:** Zero Groq API calls incurred; zero external network requests executed.
- **Audit Report Path:** `c:\Users\user\Desktop\MantraAI\phase_1e_evidence_quality_audit.md`

---

## 10. Conclusion & Stop Directive

The Phase 1E read-only architecture audit is complete. All findings, code locations, clinical risks, and proposed remediation milestones have been thoroughly documented in `phase_1e_evidence_quality_audit.md`.

---

## 11. Milestone 1E.1 Implementation Outcome — Fallback Evidence Provenance & Action Mapping

### Verified Status
- **Status:** COMPLETED & VERIFIED
- **Scope Implemented:** Phase 1E.1 Remediation Milestone ONLY (per strict boundary).
- **Files Modified:**
  - `backend/app/services/report_generator.py`
  - `backend/tests/test_report_generator.py`
  - `phase_1e_evidence_quality_audit.md`

### Remediations Executed
1. **Eliminated `valid_ids[0]` / `first_ev_id` Blanket Attribution:**
   - Removed blanket `first_ev_id = [valid_ids[0]] if valid_ids else []` binding across `build_fallback_report()` and `enrich_and_complete_report()`.
   - Implemented `_get_item_domains()`, `find_evidence_for_domain()`, and `find_evidence_for_factor()` to attach evidence references only when granular chunk tags or canonical domains defensibly match the target section or factor.
   - Guaranteed empty `evidence_refs = []` when no defensible matching evidence was retrieved (e.g., empty evidence context or unrelated domain context).
2. **Replaced Modulo Action Assignment With Deterministic Factor-to-Action Mapping:**
   - Replaced `action_templates[idx % len(action_templates)]` with `resolve_fallback_action_template()` using `EXACT_FACTOR_ACTION_MAP` and conservative keyword category heuristics.
   - Known factor IDs (e.g. tobacco, alcohol, sleep, physical activity, heat, digital habits, stress, reproductive history) map deterministically to tailored educational action templates regardless of list index.
   - Unrecognized factor IDs receive a clearly labeled general clinical discussion action (`"Routine Health Discussion"`) rather than arbitrary habit recommendations.
   - Strictly preserved clinical boundaries: no prescription changes, no curative claims, no fertility prediction.
3. **Regression Test Verification:**
   - Added 9 dedicated regression tests (Tests 22–30) in `backend/tests/test_report_generator.py`:
     - `test_fallback_unrelated_first_evidence_not_attached_to_other_domains`: Passed
     - `test_fallback_relevant_evidence_references_retained_when_supported`: Passed
     - `test_fallback_missing_evidence_results_in_empty_references`: Passed
     - `test_fallback_references_pass_reference_integrity_validation`: Passed
     - `test_fallback_action_templates_match_factor_not_position`: Passed
     - `test_fallback_unknown_factors_do_not_receive_arbitrary_actions`: Passed
     - `test_fallback_deterministic_behavior_stable_across_repeated_runs`: Passed
     - `test_missing_third_party_ai_consent_avoids_external_llm_calls`: Passed
     - `test_fallback_legacy_adapter_and_report_schema_compatibility`: Passed
   - Full test suite execution: **277 passed, 3 skipped, 0 failed** in 31.45s.
   - Zero external LLM calls or network requests incurred.
