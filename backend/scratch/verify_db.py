import sys
import os

# Add parent directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.database import engine

def verify():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print("Successfully connected to the PostgreSQL database!")
        print("Tables found in the database:", tables)
        
        expected_tables = ["users", "assessment_sessions", "assessment_responses", "assessment_results", "reports", "audit_events"]
        missing = [t for t in expected_tables if t not in tables]
        
        if not missing:
            print("SUCCESS: All 6 required tables exist in the PostgreSQL database!")
            return 0
        else:
            print("ERROR: Missing tables:", missing)
            return 1
    except Exception as e:
        print("Failed to connect to the database or verify tables:", str(e))
        return 1

if __name__ == "__main__":
    sys.exit(verify())
