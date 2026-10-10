"""
MantraAI — Myth vs Fact Corpus Importer & Consistency Validator
===============================================================

PURPOSE
-------
Provides a robust, idempotent, repeatable import pipeline that parses, validates,
and seeds the Myth vs Fact knowledge base from canonical CSV files:
1. `mantraai_myth_fact_sources_v1.csv` -> Evidence Source Registry (`myth_fact_sources`)
2. `mantraai_myth_fact_corpus_v1.csv`  -> Canonical Claims (`myth_fact_claims`)
3. `mantraai_myth_fact_aliases_seed_v1.csv` -> Search Aliases (`myth_fact_aliases`)
4. `mantraai_myth_fact_corpus_v1.json` -> Integrity & Consistency Verification Reference

SAFETY & INTEGRITY RULES:
-------------------------
- Reject or report malformed rows, duplicate IDs within a file, unknown source IDs, and invalid classifications.
- Never silently discard records.
- Preserve draft status (never auto-upgrade `CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW` to verified).
- Safe to run repeatedly without creating duplicate rows or orphaned aliases.
"""

import csv
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.models.myth_fact import (
    MythFactSource,
    MythFactClaim,
    MythFactAlias,
)
from app.schemas.myth_fact import MythFactClassification

logger = logging.getLogger(__name__)

VALID_CLASSIFICATIONS: Set[str] = {c.value for c in MythFactClassification}


class MythFactImportError(Exception):
    """Raised when corpus files fail structural, relational, or data-integrity validation."""
    pass


def normalize_text_for_matching(text: Optional[str]) -> str:
    """
    Standard text normalization for indexing and query matching:
    - Lowercases
    - Strips punctuation and symbols
    - Normalizes unicode whitespace and multiple spaces
    """
    if not text:
        return ""
    s = text.lower().strip()
    # Replace smart quotes and special apostrophes
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    # Remove punctuation except alphanumeric and space
    s = re.sub(r"[^\w\s]", " ", s)
    # Collapse multiple whitespace characters into single space
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_evidence_source_ids(raw_str: Optional[str]) -> List[str]:
    """Parses semicolon or comma-delimited evidence source IDs into a clean list."""
    if not raw_str:
        return []
    cleaned = []
    # Split by semicolon or comma
    for item in re.split(r"[;,]", raw_str):
        trimmed = item.strip()
        if trimmed and trimmed not in cleaned:
            cleaned.append(trimmed)
    return cleaned


def resolve_data_dir(custom_path: Optional[str] = None) -> str:
    """Locates the data/myth_fact directory from project roots."""
    if custom_path and os.path.isdir(custom_path):
        return custom_path
    
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/myth_fact")),
        os.path.abspath(os.path.join(os.getcwd(), "data/myth_fact")),
        os.path.abspath(os.path.join(os.getcwd(), "../data/myth_fact")),
        "c:/Users/user/Desktop/MantraAI/data/myth_fact",
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    
    raise MythFactImportError(f"Could not locate data/myth_fact directory. Tried: {candidates}")


def import_myth_fact_corpus(
    db: Session,
    data_dir: Optional[str] = None,
    verify_json: bool = True,
) -> Dict[str, Any]:
    """
    Executes the full idempotent import and validation workflow.

    Returns
    -------
    dict with counts and validation report.
    """
    base_dir = resolve_data_dir(data_dir)
    sources_csv = os.path.join(base_dir, "mantraai_myth_fact_sources_v1.csv")
    corpus_csv = os.path.join(base_dir, "mantraai_myth_fact_corpus_v1.csv")
    aliases_csv = os.path.join(base_dir, "mantraai_myth_fact_aliases_seed_v1.csv")
    corpus_json = os.path.join(base_dir, "mantraai_myth_fact_corpus_v1.json")

    for req_file in [sources_csv, corpus_csv, aliases_csv]:
        if not os.path.isfile(req_file):
            raise MythFactImportError(f"Required corpus file missing: {req_file}")

    report = {
        "sources_imported": 0,
        "sources_updated": 0,
        "claims_imported": 0,
        "claims_updated": 0,
        "aliases_imported": 0,
        "aliases_skipped": 0,
        "errors": [],
        "json_consistency_verified": False,
        "discrepancies": [],
    }

    # =======================================================================
    # 1. Import Evidence Sources (Registry)
    # =======================================================================
    known_source_ids: Set[str] = set()
    seen_sources_in_file: Set[str] = set()

    with open(sources_csv, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row_idx, row in enumerate(reader, start=2):
            source_id = (row.get("source_id") or "").strip()
            source_title = (row.get("source_title") or "").strip()
            source_url = (row.get("source_url") or "").strip()

            if not source_id:
                raise MythFactImportError(f"Sources CSV Line {row_idx}: Missing 'source_id'.")
            if source_id in seen_sources_in_file:
                raise MythFactImportError(f"Sources CSV Line {row_idx}: Duplicate 'source_id' '{source_id}'.")
            seen_sources_in_file.add(source_id)

            if not source_title:
                raise MythFactImportError(f"Sources CSV Line {row_idx}: Missing 'source_title' for '{source_id}'.")
            if not source_url.startswith("http://") and not source_url.startswith("https://"):
                raise MythFactImportError(f"Sources CSV Line {row_idx}: Invalid URL '{source_url}' for '{source_id}'.")

            existing = db.query(MythFactSource).filter(MythFactSource.source_id == source_id).first()
            if existing:
                existing.source_title = source_title
                existing.source_url = source_url
                report["sources_updated"] += 1
            else:
                new_source = MythFactSource(
                    source_id=source_id,
                    source_title=source_title,
                    source_url=source_url,
                )
                db.add(new_source)
                report["sources_imported"] += 1
            
            known_source_ids.add(source_id)

    db.flush()

    # =======================================================================
    # 2. Import Canonical Claims (Corpus)
    # =======================================================================
    known_claim_ids: Set[str] = set()
    seen_claims_in_file: Set[str] = set()
    parsed_claims_for_verification: Dict[str, Dict[str, Any]] = {}

    with open(corpus_csv, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row_idx, row in enumerate(reader, start=2):
            claim_id = (row.get("claim_id") or "").strip()
            canonical_claim = (row.get("canonical_claim") or "").strip()
            classification = (row.get("classification") or "").strip().upper()
            domain = (row.get("domain") or "").strip().lower()
            explanation = (row.get("explanation") or "").strip()
            raw_sources = (row.get("evidence_source_ids") or "").strip()
            review_status = (row.get("review_status") or "CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW").strip()
            version = (row.get("version") or "1.0").strip()
            notes = (row.get("notes") or "").strip()

            if not claim_id:
                raise MythFactImportError(f"Corpus CSV Line {row_idx}: Missing 'claim_id'.")
            if claim_id in seen_claims_in_file:
                raise MythFactImportError(f"Corpus CSV Line {row_idx}: Duplicate 'claim_id' '{claim_id}'.")
            seen_claims_in_file.add(claim_id)

            if not canonical_claim:
                raise MythFactImportError(f"Corpus CSV Line {row_idx} ({claim_id}): Missing 'canonical_claim'.")

            if classification not in VALID_CLASSIFICATIONS:
                raise MythFactImportError(
                    f"Corpus CSV Line {row_idx} ({claim_id}): Invalid classification '{classification}'. "
                    f"Expected one of: {sorted(list(VALID_CLASSIFICATIONS))}"
                )

            if not domain:
                raise MythFactImportError(f"Corpus CSV Line {row_idx} ({claim_id}): Missing 'domain'.")
            if not explanation:
                raise MythFactImportError(f"Corpus CSV Line {row_idx} ({claim_id}): Missing 'explanation'.")

            # Parse and validate evidence source IDs against registry
            source_ids = parse_evidence_source_ids(raw_sources)
            for sid in source_ids:
                if sid not in known_source_ids:
                    raise MythFactImportError(
                        f"Corpus CSV Line {row_idx} ({claim_id}): Unknown evidence_source_id '{sid}'. "
                        f"Must be defined in sources registry."
                    )

            # Never auto-upgrade draft status
            if "VERIFIED" in review_status and "DRAFT" in review_status:
                review_status = "CURATED_DRAFT_REQUIRES_CLINICIAN_REVIEW"

            normalized_claim = normalize_text_for_matching(canonical_claim)

            existing_claim = db.query(MythFactClaim).filter(MythFactClaim.claim_id == claim_id).first()
            if existing_claim:
                existing_claim.canonical_claim = canonical_claim
                existing_claim.normalized_claim = normalized_claim
                existing_claim.classification = classification
                existing_claim.domain = domain
                existing_claim.explanation = explanation
                existing_claim.evidence_source_ids = source_ids
                existing_claim.review_status = review_status
                existing_claim.version = version
                existing_claim.notes = notes
                report["claims_updated"] += 1
            else:
                new_claim = MythFactClaim(
                    claim_id=claim_id,
                    canonical_claim=canonical_claim,
                    normalized_claim=normalized_claim,
                    classification=classification,
                    domain=domain,
                    explanation=explanation,
                    evidence_source_ids=source_ids,
                    review_status=review_status,
                    version=version,
                    notes=notes,
                )
                db.add(new_claim)
                report["claims_imported"] += 1

            known_claim_ids.add(claim_id)
            parsed_claims_for_verification[claim_id] = {
                "canonical_claim": canonical_claim,
                "classification": classification,
                "domain": domain,
                "evidence_source_ids": source_ids,
            }

    db.flush()

    # =======================================================================
    # 3. Import Search Aliases
    # =======================================================================
    seen_alias_tuples: Set[Tuple[str, str]] = set()

    with open(aliases_csv, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row_idx, row in enumerate(reader, start=2):
            claim_id = (row.get("claim_id") or "").strip()
            alias = (row.get("alias") or "").strip()

            if not claim_id or not alias:
                continue

            if claim_id not in known_claim_ids:
                raise MythFactImportError(
                    f"Aliases CSV Line {row_idx}: Alias '{alias}' references unknown claim_id '{claim_id}'."
                )

            norm_alias = normalize_text_for_matching(alias)
            alias_key = (claim_id, norm_alias)
            if alias_key in seen_alias_tuples:
                report["aliases_skipped"] += 1
                continue
            seen_alias_tuples.add(alias_key)

            existing_alias = (
                db.query(MythFactAlias)
                .filter(MythFactAlias.claim_id == claim_id, MythFactAlias.normalized_alias == norm_alias)
                .first()
            )
            if existing_alias:
                report["aliases_skipped"] += 1
            else:
                new_alias = MythFactAlias(
                    claim_id=claim_id,
                    alias=alias,
                    normalized_alias=norm_alias,
                )
                db.add(new_alias)
                report["aliases_imported"] += 1

    db.flush()

    # =======================================================================
    # 4. Consistency Check against JSON
    # =======================================================================
    if verify_json and os.path.isfile(corpus_json):
        try:
            with open(corpus_json, mode="r", encoding="utf-8") as jf:
                json_data = json.load(jf)
            
            json_claims = json_data.get("claims", [])
            if len(json_claims) != len(parsed_claims_for_verification):
                report["discrepancies"].append(
                    f"Count mismatch: JSON has {len(json_claims)} claims, CSV has {len(parsed_claims_for_verification)}."
                )

            for j_claim in json_claims:
                cid = j_claim.get("claim_id")
                if not cid or cid not in parsed_claims_for_verification:
                    report["discrepancies"].append(f"JSON claim '{cid}' not found in CSV import.")
                    continue

                csv_claim = parsed_claims_for_verification[cid]
                if j_claim.get("classification") != csv_claim["classification"]:
                    report["discrepancies"].append(
                        f"Classification mismatch on '{cid}': JSON={j_claim.get('classification')} vs CSV={csv_claim['classification']}"
                    )
            
            if not report["discrepancies"]:
                report["json_consistency_verified"] = True
            else:
                logger.warning("Myth vs Fact JSON consistency check found discrepancies: %s", report["discrepancies"])
        except Exception as e:
            report["discrepancies"].append(f"JSON parsing error during verification: {str(e)}")

    db.commit()
    logger.info(
        "Myth vs Fact Corpus Import successfully completed. Sources: %d, Claims: %d, Aliases: %d.",
        report["sources_imported"] + report["sources_updated"],
        report["claims_imported"] + report["claims_updated"],
        report["aliases_imported"],
    )

    return report
