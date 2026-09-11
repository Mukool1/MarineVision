"""PostgreSQL persistence models for MarineVision."""
import os
from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

# Use PostgreSQL in deployment. SQLite keeps an existing local prototype usable.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marinevision_dev.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}, pool_pre_ping=True)
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

def init_db(): Base.metadata.create_all(bind=engine)

def get_db():
    session = SessionLocal()
    try: yield session
    finally: session.close()
