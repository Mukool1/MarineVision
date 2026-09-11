"""MarineVision API: PostgreSQL records, Cloudinary images, JWT user roles."""
import json
import os
import time
import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

load_dotenv()
import auth
import database as db
from detection import ModelUnavailableError, _is_debris, detect_objects, model_status, summarize
from storage import UPLOAD_DIR, cloudinary_enabled, delete_image, save_image

app = FastAPI(title="Marine Debris & Anomaly Detection API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"]) 
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
db.init_db()

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
class FeedbackRequest(BaseModel):
    corrections: list[dict]
    note: str = Field(default="", max_length=2000)
class ScanChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)

def user_view(user):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "created_at": user.created_at.isoformat()}
def scan_view(row, detail=False):
    data = {"scan_id": row.id, "filename": row.filename, "timestamp": row.created_at.timestamp(), "location": row.location, "depth_m": row.depth_m, "annotated_image_url": row.annotated_url, "summary": json.loads(row.summary_json)}
    if detail: data.update({"original_image_url": row.original_url, "mask_image_url": row.mask_url, "detections": json.loads(row.detections_json)})
    return data
def can_access(row, user): return user.role == "admin" or row.owner_id == user.id
def feedback_view(row): return {"corrections": json.loads(row.corrections_json), "note": row.note or "", "updated_at": row.updated_at.isoformat()}

def scan_chat_context(scan):
    """Return only the facts the assistant needs to discuss one scan."""
    return {"location": scan.location, "depth_m": scan.depth_m, "summary": json.loads(scan.summary_json), "detections": json.loads(scan.detections_json)}

def summarize_corrected(detections):
    visible = [item for item in detections if not item.get("excluded")]
    labels, severity = {}, {"low": 0, "medium": 0, "high": 0}
    for item in visible:
        labels[item["label"]] = labels.get(item["label"], 0) + 1
        severity[item["severity"]] += 1
    debris = sum(1 for item in visible if item.get("is_debris"))
    return {"total_objects": len(visible), "debris_count": debris, "non_debris_count": len(visible) - debris, "by_label": labels, "severity_counts": severity, "avg_confidence": round(sum(item.get("confidence", 0) for item in visible) / len(visible), 3) if visible else 0.0}

def redraw_local_annotation(scan, detections):
    """Apply analyst categories to the displayed local annotation image."""
    if not scan.original_url.startswith("/uploads/"): return
    source = UPLOAD_DIR / scan.original_url.rsplit("/", 1)[-1]
    image = cv2.imread(str(source))
    if image is None: return
    for item in detections:
        if item.get("excluded"): continue
        x, y, width, height = item["bbox"]
        color = (0, 0, 255) if item["severity"] == "high" else (0, 165, 255) if item["severity"] == "medium" else (0, 200, 0)
        cv2.rectangle(image, (x, y), (x + width, y + height), color, 2)
        text = f'{item["label"]} {item.get("confidence", 0) * 100:.0f}%'
        (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, .42, 1)
        cv2.rectangle(image, (x, max(0, y - text_height - 7)), (x + text_width + 5, y), color, -1)
        cv2.putText(image, text, (x + 2, max(11, y - 4)), cv2.FONT_HERSHEY_SIMPLEX, .42, (255, 255, 255), 1, cv2.LINE_AA)
    ok, encoded = cv2.imencode(".png", image)
    # Use a fresh asset name: reusing the original URL leaves browsers showing a
    # cached model overlay even though the analyst-corrected overlay was saved.
    if ok: scan.annotated_url = save_image(encoded.tobytes(), scan.id, f"annotated-corrected-{int(time.time() * 1000)}")

def create_configured_admin(session):
    email, password = os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_PASSWORD")
    if email and password and not session.scalar(select(db.User).where(db.User.email == email.lower())):
        session.add(db.User(email=email.lower(), full_name=os.getenv("ADMIN_NAME", "MarineVision Admin"), password_hash=auth.hash_password(password), role="admin"))
        session.commit()

@app.on_event("startup")
def startup():
    with db.SessionLocal() as session: create_configured_admin(session)

@app.get("/api/health")
def health(): return {"status": "ok", "service": "marine-debris-detection-api", "time": time.time(), "model": model_status(), "storage": "cloudinary" if cloudinary_enabled() else "local-development"}

@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest, session: Session = Depends(db.get_db)):
    email = payload.email.lower()
    if session.scalar(select(db.User).where(db.User.email == email)): raise HTTPException(409, "An account with that email already exists")
    user = db.User(email=email, full_name=payload.full_name.strip(), password_hash=auth.hash_password(payload.password), role="operator")
    session.add(user); session.commit(); session.refresh(user)
    return {"access_token": auth.create_token(user), "token_type": "bearer", "user": user_view(user)}

@app.post("/api/auth/login")
def login(payload: LoginRequest, session: Session = Depends(db.get_db)):
    user = session.scalar(select(db.User).where(db.User.email == payload.email.lower()))
    if not user or not auth.verify_password(payload.password, user.password_hash): raise HTTPException(401, "Incorrect email or password")
    return {"access_token": auth.create_token(user), "token_type": "bearer", "user": user_view(user)}

@app.get("/api/auth/me")
def me(user: db.User = Depends(auth.current_user)): return user_view(user)

@app.post("/api/scan")
async def scan_image(file: UploadFile = File(...), location: str = Form("Unknown"), depth_m: float = Form(0.0), session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    if not (file.filename or "").lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff")): raise HTTPException(400, "Unsupported image type")
    raw_bytes = await file.read()
    if len(raw_bytes) > 15 * 1024 * 1024: raise HTTPException(400, "Image must be 15 MB or smaller")
    image = cv2.imdecode(np.frombuffer(raw_bytes, np.uint8), cv2.IMREAD_COLOR)
    if image is None: raise HTTPException(400, "Could not decode image")
    h, w = image.shape[:2]
    if max(h, w) > 1200: image = cv2.resize(image, (int(w * 1200 / max(h, w)), int(h * 1200 / max(h, w))))
    try: detections, annotated, mask = detect_objects(image)
    except ModelUnavailableError as exc: raise HTTPException(503, str(exc)) from exc
    scan_id = str(uuid.uuid4())
    ok, original_bytes = cv2.imencode(".png", image); ok2, annotated_bytes = cv2.imencode(".png", annotated); ok3, mask_bytes = cv2.imencode(".png", mask)
    if not (ok and ok2 and ok3): raise HTTPException(500, "Unable to encode processed images")
    urls = [save_image(value.tobytes(), scan_id, kind) for value, kind in ((original_bytes, "original"), (annotated_bytes, "annotated"), (mask_bytes, "mask"))]
    detection_data, summary = [d.to_dict() for d in detections], summarize(detections)
    row = db.Scan(id=scan_id, filename=file.filename, location=location[:255] or "Unknown", depth_m=max(depth_m, 0), original_url=urls[0], annotated_url=urls[1], mask_url=urls[2], detections_json=json.dumps(detection_data), summary_json=json.dumps(summary), owner_id=user.id)
    session.add(row); session.commit(); session.refresh(row)
    return scan_view(row, detail=True)

@app.get("/api/history")
def history(limit: int = 100, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    query = select(db.Scan).order_by(db.Scan.created_at.desc()).limit(min(max(limit, 1), 500))
    if user.role != "admin": query = query.where(db.Scan.owner_id == user.id)
    return [scan_view(row) for row in session.scalars(query)]

@app.get("/api/history/{scan_id}")
def history_detail(scan_id: str, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    row = session.get(db.Scan, scan_id)
    if not row or not can_access(row, user): raise HTTPException(404, "Scan not found")
    return scan_view(row, detail=True)

@app.post("/api/history/{scan_id}/chat")
def chat_about_scan(scan_id: str, payload: ScanChatRequest, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    """Answer an operator's question using the persisted facts for one scan."""
    scan = session.get(db.Scan, scan_id)
    if not scan or not can_access(scan, user): raise HTTPException(404, "Scan not found")
    if not os.getenv("OPENAI_API_KEY"): raise HTTPException(503, "Scan assistant is not configured. Add OPENAI_API_KEY to the backend environment.")
    try:
        from openai import OpenAI
        response = OpenAI().responses.create(
            model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini"),
            instructions=("You are MarineVision's sonar-scan assistant. Give concise, operational answers using only the supplied scan data. "
                          "Treat detections as model predictions, not confirmed facts. State confidence and recommend human verification for hazards or cleanup decisions. "
                          "Do not invent conditions, object locations, dimensions, or environmental impacts not present in the data."),
            input=f"Scan data:\n{json.dumps(scan_chat_context(scan))}\n\nOperator question: {payload.message.strip()}",
            max_output_tokens=350,
            store=False,
        )
    except Exception as exc:
        raise HTTPException(502, "The scan assistant could not generate a response. Please try again.") from exc
    reply = (response.output_text or "").strip()
    if not reply: raise HTTPException(502, "The scan assistant returned an empty response. Please try again.")
    return {"reply": reply}

@app.get("/api/history/{scan_id}/feedback")
def get_feedback(scan_id: str, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    scan = session.get(db.Scan, scan_id)
    if not scan or not can_access(scan, user): raise HTTPException(404, "Scan not found")
    record = session.scalar(select(db.ScanFeedback).where(db.ScanFeedback.scan_id == scan_id))
    return feedback_view(record) if record else {"corrections": [], "note": "", "updated_at": None}

@app.put("/api/history/{scan_id}/feedback")
def save_feedback(scan_id: str, payload: FeedbackRequest, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    scan = session.get(db.Scan, scan_id)
    if not scan or not can_access(scan, user): raise HTTPException(404, "Scan not found")
    detection_ids = {item.get("id") for item in json.loads(scan.detections_json)}
    cleaned = [{"id": str(item.get("id")), "label": str(item.get("label", "Uncategorized"))[:120], "severity": str(item.get("severity", "low")).lower(), "status": str(item.get("status", "confirmed")).lower()} for item in payload.corrections if str(item.get("id")) in detection_ids]
    cleaned = [item for item in cleaned if item["severity"] in {"low", "medium", "high"} and item["status"] in {"confirmed", "false_positive", "needs_review"}]
    record = session.scalar(select(db.ScanFeedback).where(db.ScanFeedback.scan_id == scan_id))
    # Corrections are merged into the scan itself, so history, analytics and re-opened
    # images use analyst categories rather than the original model classification.
    original = json.loads(scan.detections_json)
    correction_by_id = {item["id"]: item for item in cleaned}
    for detection in original:
        correction = correction_by_id.get(str(detection.get("id")))
        if not correction: continue
        detection["label"] = correction["label"]
        detection["severity"] = correction["severity"]
        detection["excluded"] = correction["status"] == "false_positive"
        detection["review_status"] = correction["status"]
        detection["is_debris"] = _is_debris(correction["label"])
    scan.detections_json = json.dumps(original)
    scan.summary_json = json.dumps(summarize_corrected(original))
    redraw_local_annotation(scan, original)
    if record:
        record.corrections_json, record.note, record.reviewer_id, record.updated_at = json.dumps(cleaned), payload.note.strip(), user.id, datetime.now(timezone.utc)
    else:
        record = db.ScanFeedback(scan_id=scan_id, corrections_json=json.dumps(cleaned), note=payload.note.strip(), reviewer_id=user.id)
        session.add(record)
    session.commit(); session.refresh(record)
    return feedback_view(record) | {"scan": scan_view(scan, detail=True)}

@app.delete("/api/history/{scan_id}")
def delete_history(scan_id: str, session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    row = session.get(db.Scan, scan_id)
    if not row or not can_access(row, user): raise HTTPException(404, "Scan not found")
    for url in (row.original_url, row.annotated_url, row.mask_url): delete_image(url)
    session.delete(row); session.commit()
    return {"status": "deleted", "scan_id": scan_id}

@app.get("/api/stats")
def stats(session: Session = Depends(db.get_db), user: db.User = Depends(auth.current_user)):
    query = select(db.Scan)
    if user.role != "admin": query = query.where(db.Scan.owner_id == user.id)
    rows = list(session.scalars(query))
    labels, severity, timeline = {}, {"low": 0, "medium": 0, "high": 0}, []
    for row in rows:
        summary = json.loads(row.summary_json)
        for key, value in summary.get("by_label", {}).items(): labels[key] = labels.get(key, 0) + value
        for key, value in summary.get("severity_counts", {}).items(): severity[key] = severity.get(key, 0) + value
        timeline.append({"timestamp": row.created_at.timestamp(), "scan_id": row.id, "debris_count": summary.get("debris_count", 0), "total_objects": summary.get("total_objects", 0)})
    return {"total_scans": len(rows), "total_objects_detected": sum(x["total_objects"] for x in timeline), "total_debris_detected": sum(x["debris_count"] for x in timeline), "label_counts": labels, "severity_counts": severity, "timeline": sorted(timeline, key=lambda x: x["timestamp"])}

@app.get("/api/admin/users")
def admin_users(session: Session = Depends(db.get_db), _: db.User = Depends(auth.admin_user)):
    return [user_view(user) | {"scan_count": session.scalar(select(func.count(db.Scan.id)).where(db.Scan.owner_id == user.id))} for user in session.scalars(select(db.User).order_by(db.User.created_at.desc()))]

@app.delete("/api/reset")
def reset_all(session: Session = Depends(db.get_db), _: db.User = Depends(auth.admin_user)):
    rows = list(session.scalars(select(db.Scan)))
    for row in rows:
        for url in (row.original_url, row.annotated_url, row.mask_url): delete_image(url)
        session.delete(row)
    session.commit()
    return {"status": "reset complete"}
