from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Handling postgres url variants
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Detect available driver (psycopg3 or psycopg2)
if db_url.startswith("postgresql://") and "+psycopg" not in db_url:
    try:
        import psycopg  # psycopg v3
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    except ImportError:
        pass

engine = create_engine(
    db_url,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
