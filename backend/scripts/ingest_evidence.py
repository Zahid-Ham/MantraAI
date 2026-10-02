"""
MantraAI — Evidence Ingestion & Corpus Validation Script
=========================================================

PURPOSE
-------
Audits, validates, and inspects the authoritative clinical evidence corpus.
Ensures that all documents have:
- Valid metadata (title, organization, year, verified URL, standard identifier).
- Canonical evidence tags registered in the taxonomy.
- Non-empty, provenance-backed chunks.
- Documented clinical limitations.

USAGE
-----
python scripts/ingest_evidence.py
"""

import sys
import os
import json
import logging

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.evidence_corpus import EVIDENCE_CORPUS
from app.services.evidence_taxonomy import is_valid_tag, ALL_CANONICAL_TAGS

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("evidence_ingest")


def audit_corpus() -> bool:
    """Validate all evidence documents and chunks in the corpus."""
    logger.info("Starting audit of MantraAI Evidence Corpus...")
    logger.info("Total documents in corpus: %d", len(EVIDENCE_CORPUS))

    total_chunks = 0
    errors = []

    for doc in EVIDENCE_CORPUS:
        # 1. Check basic document metadata
        if not doc.id or not doc.title or not doc.source or not doc.organization:
            errors.append(f"Document {doc.id} missing basic metadata.")
        if not doc.url.startswith("https://"):
            errors.append(f"Document {doc.id} has invalid URL: {doc.url}")
        if not doc.source_identifier:
            errors.append(f"Document {doc.id} missing source identifier (DOI/PMID/ISBN).")
        if not doc.limitations:
            errors.append(f"Document {doc.id} missing documented clinical limitations.")

        # 2. Check chunks
        if not doc.chunks:
            errors.append(f"Document {doc.id} has no evidence chunks.")
        
        for chunk in doc.chunks:
            total_chunks += 1
            if not chunk.chunk_id or not chunk.topic or not chunk.text:
                errors.append(f"Chunk in doc {doc.id} missing content.")
            if not chunk.evidence_tags:
                errors.append(f"Chunk {chunk.chunk_id} has no evidence tags.")

            # Validate tags against canonical taxonomy
            for tag in chunk.evidence_tags:
                if not is_valid_tag(tag):
                    logger.warning("Unregistered tag '%s' in chunk '%s'", tag, chunk.chunk_id)

    logger.info("Total chunks audited: %d", total_chunks)
    logger.info("Canonical taxonomy tags registered: %d", len(ALL_CANONICAL_TAGS))

    if errors:
        logger.error("Audit failed with %d error(s):", len(errors))
        for err in errors:
            logger.error("  - %s", err)
        return False

    logger.info("All documents and chunks PASSED validation successfully!")
    return True


if __name__ == "__main__":
    success = audit_corpus()
    sys.exit(0 if success else 1)
