from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Create standard SQLAlchemy engine with connection pool config
# Support both psycopg (v3) and psycopg2 depending on what is installed in the environment
try:
    import psycopg  # noqa: F401
    _pg_driver = "postgresql+psycopg://"
except ImportError:
    _pg_driver = "postgresql+psycopg2://"

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", _pg_driver, 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", _pg_driver, 1)
elif db_url.startswith("postgresql+psycopg://") and _pg_driver != "postgresql+psycopg://":
    db_url = db_url.replace("postgresql+psycopg://", _pg_driver, 1)
elif db_url.startswith("postgresql+psycopg2://") and _pg_driver != "postgresql+psycopg2://":
    db_url = db_url.replace("postgresql+psycopg2://", _pg_driver, 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "JSON"
