"""PostgreSQL persistence models for MarineVision."""
import os
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

# PostgreSQL is the only supported database. Set DATABASE_URL before starting:
#   postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME
# (%-encode special characters in the password, e.g. @ becomes %40)
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL.startswith("postgresql"):
    raise RuntimeError(
        "DATABASE_URL must point at PostgreSQL, e.g. "
        "postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME. "
        "Set it in backend/.env (never commit a real .env to git)."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # recover from connections dropped by firewalls/cloud proxies
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,    # recycle connections before cloud providers kill them
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="operator", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    scans: Mapped[list["Scan"]] = relationship(back_populates="owner")

class Scan(Base):
    __tablename__ = "scans"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    location: Mapped[str] = mapped_column(String(255), default="Unknown")
    depth_m: Mapped[float] = mapped_column(Float, default=0)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True, default=None)
    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    annotated_url: Mapped[str] = mapped_column(Text, nullable=False)
    mask_url: Mapped[str] = mapped_column(Text, nullable=False)
    detections_json: Mapped[str] = mapped_column(Text, nullable=False)
    summary_json: Mapped[str] = mapped_column(Text, nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    owner: Mapped[User] = relationship(back_populates="scans")

class ScanFeedback(Base):
    __tablename__ = "scan_feedback"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scan_id: Mapped[str] = mapped_column(ForeignKey("scans.id"), unique=True, nullable=False, index=True)
    corrections_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    note: Mapped[str] = mapped_column(Text, default="")
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class PasswordReset(Base):
    """Single-use, expiring password-reset tokens. Only the SHA-256 hash is stored."""
    __tablename__ = "password_resets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

def init_db(): Base.metadata.create_all(bind=engine); _ensure_geo_columns()

def _ensure_geo_columns():
    """Add latitude/longitude to a pre-existing `scans` table created before the geo columns."""
    from sqlalchemy import inspect, text
    existing = {c["name"] for c in inspect(engine).get_columns("scans")}
    for column in ("latitude", "longitude"):
        if column not in existing:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE scans ADD COLUMN {column} FLOAT"))

def get_db():
    session = SessionLocal()
    try: yield session
    finally: session.close()
