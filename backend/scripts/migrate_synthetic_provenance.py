import sqlalchemy
from app.config import settings

def run_migration():
    for db_url in [settings.DATABASE_URL, settings.DATABASE_URL.replace("/mantraai", "/mantraai_test")]:
        db_name = db_url.split("/")[-1]
        print(f"Applying schema and data migration to {db_name}...")
        engine = sqlalchemy.create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("ALTER TABLE health_daily_metrics ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE NOT NULL"))
            conn.execute(sqlalchemy.text("ALTER TABLE health_daily_metrics ADD COLUMN IF NOT EXISTS provenance VARCHAR DEFAULT 'device_sensor'"))
            # Quarantine / tag known synthetic mock rows
            res1 = conn.execute(sqlalchemy.text("UPDATE health_daily_metrics SET is_synthetic = TRUE, provenance = 'mock_provider' WHERE source = 'mock'"))
            # Quarantine known demo writer rows
            res2 = conn.execute(sqlalchemy.text("UPDATE health_daily_metrics SET is_synthetic = TRUE, provenance = 'synthetic_demo' WHERE steps = 6842 AND active_calories = 412.0"))
            conn.commit()
            print(f"Successfully migrated {db_name}. Tagged {res1.rowcount} mock rows, {res2.rowcount} demo rows as synthetic.")

if __name__ == "__main__":
    run_migration()
