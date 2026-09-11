"""Cloudinary image storage, with local fallback when not configured."""
import os
from pathlib import Path
import cloudinary
import cloudinary.uploader
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
cloudinary.config(cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"), api_key=os.getenv("CLOUDINARY_API_KEY"), api_secret=os.getenv("CLOUDINARY_API_SECRET"), secure=True)
def cloudinary_enabled(): return all(os.getenv(key) for key in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"))
def save_image(image_bytes, scan_id, kind):
    if cloudinary_enabled():
        return cloudinary.uploader.upload(image_bytes, public_id=f"marinevision/{scan_id}_{kind}", resource_type="image", overwrite=True)["secure_url"]
    filename = f"{scan_id}_{kind}.png"
    (UPLOAD_DIR / filename).write_bytes(image_bytes)
    return f"/uploads/{filename}"
def delete_image(url):
    if url.startswith("/uploads/"):
        path = UPLOAD_DIR / url.rsplit("/", 1)[-1]
        if path.exists(): path.unlink()
