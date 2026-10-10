"""
MantraAI — Myth vs Fact Knowledge Base Seeder
==============================================

PURPOSE
-------
Command-line utility to seed and idempotently update the Myth vs Fact
knowledge base (sources, claims, aliases) from CSV files in `data/myth_fact/`.

USAGE
-----
python scripts/seed_myth_fact.py [--data-dir PATH] [--skip-json-check]
"""

import sys
import os
import argparse
import logging

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
import app.models  # Register all models with Base
from app.services.myth_fact_importer import import_myth_fact_corpus

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("seed_myth_fact")


def main():
    parser = argparse.ArgumentParser(description="Seed Myth vs Fact knowledge base from CSV corpus.")
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="Path to data/myth_fact directory containing CSV and JSON files.",
    )
    parser.add_argument(
        "--skip-json-check",
        action="store_true",
        help="Skip consistency check against mantraai_myth_fact_corpus_v1.json.",
    )
    args = parser.parse_args()

    logger.info("Initializing Myth vs Fact database tables if not existing...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        logger.info("Starting idempotent Myth vs Fact corpus import...")
        report = import_myth_fact_corpus(
            db=db,
            data_dir=args.data_dir,
            verify_json=not args.skip_json_check,
        )

        logger.info("==================================================")
        logger.info("MYTH VS FACT CORPUS IMPORT SUMMARY")
        logger.info("==================================================")
        logger.info("  Sources Imported:         %d", report["sources_imported"])
        logger.info("  Sources Updated:          %d", report["sources_updated"])
        logger.info("  Canonical Claims Imported:%d", report["claims_imported"])
        logger.info("  Canonical Claims Updated: %d", report["claims_updated"])
        logger.info("  Aliases Imported:         %d", report["aliases_imported"])
        logger.info("  Aliases Skipped (Dupes):  %d", report["aliases_skipped"])
        logger.info("  JSON Consistency Verified:%s", report["json_consistency_verified"])
        if report["discrepancies"]:
            logger.warning("  Discrepancies found: %s", report["discrepancies"])
        logger.info("==================================================")
        logger.info("Seeding completed successfully.")
    except Exception as e:
        logger.error("Seeding failed: %s", str(e), exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
