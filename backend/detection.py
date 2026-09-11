"""YOLO-backed detection for side-scan sonar imagery.

The supplied Ultralytics checkpoint lives at ``models/best.pt``.  It is
loaded once, on the first scan, and its predictions are normalised into the
same API schema used by the rest of the application.
"""

import cv2
import logging
import numpy as np
import os
import uuid
from dataclasses import asdict, dataclass
from typing import List, Tuple


LOGGER = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_configured_model_path = os.getenv("MODEL_PATH", os.path.join("models", "best.pt"))
MODEL_PATH = _configured_model_path if os.path.isabs(_configured_model_path) else os.path.join(BASE_DIR, _configured_model_path)
MODEL_CONFIDENCE = float(os.getenv("MODEL_CONFIDENCE", "0.25"))
MODEL_IMAGE_SIZE = int(os.getenv("MODEL_IMAGE_SIZE", "640"))

_model = None
_model_error = None


class ModelUnavailableError(RuntimeError):
    """Raised when the trained detector cannot be used for a scan."""


# Legacy taxonomy retained for the optional offline heuristic helper below.
CLASS_LABELS = [
    "Debris - Metallic (Drum/Can)",
    "Debris - Net/Rope (Fishing Gear)",
    "Debris - Tyre/Rubber",
    "Debris - Plastic/Container",
    "Anomaly - Unidentified Object",
    "Natural - Rock/Boulder",
    "Natural - Seabed Ripple/Texture",
]

DEBRIS_KEYWORDS = {"debris", "ghost", "gear", "crab", "net", "rope", "plastic", "can", "tyre"}


@dataclass
class Detection:
    id: str
    label: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x, y, w, h
    area_px: int
    is_debris: bool
    severity: str  # low / medium / high

    def to_dict(self):
        d = asdict(self)
        d["bbox"] = list(self.bbox)
        return d


def model_status() -> dict:
    """Return a safe, lightweight status payload for the health endpoint."""
    if _model is not None:
        state = "ready"
    elif _model_error:
        state = "error"
    elif os.path.isfile(MODEL_PATH):
        state = "available"
    else:
        state = "missing"
    return {
        "state": state,
        "path": os.path.basename(MODEL_PATH),
        "confidence_threshold": MODEL_CONFIDENCE,
        "error": str(_model_error) if _model_error else None,
    }


def _get_model():
    """Load the Ultralytics model once and retain it for future requests."""
    global _model, _model_error
    if _model is not None:
        return _model
    if _model_error is not None:
        raise ModelUnavailableError(str(_model_error)) from _model_error
    if not os.path.isfile(MODEL_PATH):
        _model_error = FileNotFoundError(f"Model weights were not found at {MODEL_PATH}")
        raise ModelUnavailableError(str(_model_error)) from _model_error
    try:
        from ultralytics import YOLO

        _model = YOLO(MODEL_PATH)
        LOGGER.info("Loaded YOLO detector from %s", MODEL_PATH)
        return _model
    except Exception as exc:
        _model_error = exc
        LOGGER.exception("Could not load YOLO detector from %s", MODEL_PATH)
        raise ModelUnavailableError(f"Could not load trained model: {exc}") from exc


def _display_label(label: str) -> str:
    """Make model class names readable without changing their meaning."""
    return label.replace("_", " ").replace("-", " ").strip()


def _is_debris(label: str) -> bool:
    words = set(_display_label(label).lower().split())
    return bool(words & DEBRIS_KEYWORDS)


def _empty_mask(shape: tuple) -> np.ndarray:
    return np.zeros(shape[:2], dtype=np.uint8)


def _detect_with_yolo(image_bgr: np.ndarray) -> Tuple[List[Detection], np.ndarray, np.ndarray]:
    """Run object detection and convert Ultralytics boxes to ``Detection``.

    The checkpoint was trained on side-scan sonar intensity images.  Every
    upload is therefore normalised to a CLAHE-enhanced grayscale image before
    inference, including uploads that began as colour images.
    """
    model = _get_model()
    model_input = preprocess_for_yolo(image_bgr)
    results = model.predict(
        source=model_input,
        conf=MODEL_CONFIDENCE,
        imgsz=MODEL_IMAGE_SIZE,
        verbose=False,
    )
    if not results:
        return [], image_bgr.copy(), _empty_mask(image_bgr.shape)

    result = results[0]
    annotated = result.plot(labels=True, conf=True, line_width=2)
    mask = _empty_mask(image_bgr.shape)
    detections: List[Detection] = []
    image_h, image_w = image_bgr.shape[:2]
    names = result.names or getattr(model, "names", {})

    if result.boxes is None:
        return detections, annotated, mask

    for box in result.boxes:
        class_id = int(box.cls[0].item())
        raw_label = names[class_id] if isinstance(names, dict) else names[class_id]
        label = _display_label(str(raw_label))
        confidence = round(float(box.conf[0].item()), 3)
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        x1 = max(0, min(image_w - 1, int(round(x1))))
        y1 = max(0, min(image_h - 1, int(round(y1))))
        x2 = max(x1 + 1, min(image_w, int(round(x2))))
        y2 = max(y1 + 1, min(image_h, int(round(y2))))
        width, height = x2 - x1, y2 - y1
        is_debris = _is_debris(label)
        severity = _severity(confidence, is_debris)

        detections.append(Detection(
            id=str(uuid.uuid4())[:8],
            label=label,
            confidence=confidence,
            bbox=(x1, y1, width, height),
            area_px=width * height,
            is_debris=is_debris,
            severity=severity,
        ))
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)

    detections.sort(key=lambda detection: detection.confidence, reverse=True)
    return detections, annotated, mask


def _clahe_enhance(gray: np.ndarray) -> np.ndarray:
    """Contrast-Limited Adaptive Histogram Equalization — standard first
    step for sonar imagery which has strong intensity gradients across the
    swath (near-range vs far-range) and heavy speckle noise."""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def preprocess_for_yolo(image_bgr: np.ndarray) -> np.ndarray:
    """Convert a scan to the 3-channel enhanced grayscale format YOLO expects.

    A BGR image is deliberately returned after processing: Ultralytics YOLO
    accepts three-channel image inputs, while the three channels now contain
    the same sonar-intensity information rather than colour values.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if image_bgr.ndim == 3 else image_bgr
    enhanced = _clahe_enhance(gray)
    return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)


def _denoise(gray: np.ndarray) -> np.ndarray:
    """Speckle-noise suppression typical of acoustic/sonar returns."""
    return cv2.fastNlMeansDenoising(gray, None, h=9, templateWindowSize=7, searchWindowSize=21)


def _segment(gray: np.ndarray) -> np.ndarray:
    """Adaptive threshold to separate high-return objects / acoustic
    shadows from the seabed background."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, 5
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=2)
    return cleaned


def _classify_contour(cnt, gray_shape) -> Tuple[str, float, bool]:
    """Heuristic 'classifier' using shape descriptors (area, circularity,
    aspect ratio, solidity) as a stand-in for a learned feature embedding.
    Returns (label, confidence, is_debris)."""
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt, True)
    if perimeter == 0:
        return "Natural - Seabed Ripple/Texture", 0.3, False

    circularity = 4 * np.pi * (area / (perimeter ** 2))
    x, y, w, h = cv2.boundingRect(cnt)
    aspect_ratio = w / float(h) if h else 1.0
    hull = cv2.convexHull(cnt)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0

    img_h, img_w = gray_shape
    rel_area = area / float(img_h * img_w)

    # deterministic pseudo-confidence derived from shape "cleanliness"
    base_conf = 0.55 + 0.35 * solidity

    if circularity > 0.75 and 0.8 < aspect_ratio < 1.25 and rel_area < 0.02:
        return "Debris - Metallic (Drum/Can)", min(0.97, base_conf + 0.15), True
    if aspect_ratio > 3.0 or aspect_ratio < 0.33:
        if solidity < 0.55:
            return "Debris - Net/Rope (Fishing Gear)", min(0.93, base_conf + 0.05), True
        return "Natural - Seabed Ripple/Texture", max(0.3, base_conf - 0.2), False
    if 0.5 < circularity <= 0.75 and solidity > 0.7:
        return "Debris - Tyre/Rubber", min(0.9, base_conf), True
    if solidity > 0.85 and rel_area < 0.015:
        return "Debris - Plastic/Container", min(0.88, base_conf), True
    if rel_area > 0.03 and solidity > 0.6:
        return "Natural - Rock/Boulder", max(0.4, base_conf - 0.1), False
    if rel_area < 0.001:
        return "Natural - Seabed Ripple/Texture", 0.35, False

    return "Anomaly - Unidentified Object", min(0.75, base_conf), True


def _severity(confidence: float, is_debris: bool) -> str:
    if not is_debris:
        return "low"
    if confidence >= 0.85:
        return "high"
    if confidence >= 0.65:
        return "medium"
    return "low"


def detect_objects_heuristic(image_bgr: np.ndarray,
                              min_area: int = 40,
                              max_area_ratio: float = 0.35) -> Tuple[List[Detection], np.ndarray, np.ndarray]:
    """
    Runs the full pipeline on a BGR image and returns:
      - list of Detection objects
      - annotated BGR image (bounding boxes + labels drawn)
      - the intermediate binary segmentation mask (useful for debugging/UI)
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if image_bgr.ndim == 3 else image_bgr.copy()
    enhanced = _clahe_enhance(gray)
    denoised = _denoise(enhanced)
    mask = _segment(denoised)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray.shape
    max_area = h * w * max_area_ratio

    detections: List[Detection] = []
    annotated = image_bgr.copy()
    if annotated.ndim == 2:
        annotated = cv2.cvtColor(annotated, cv2.COLOR_GRAY2BGR)

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area or area > max_area:
            continue
        label, confidence, is_debris = _classify_contour(cnt, (h, w))
        x, y, bw, bh = cv2.boundingRect(cnt)
        severity = _severity(confidence, is_debris)

        det = Detection(
            id=str(uuid.uuid4())[:8],
            label=label,
            confidence=round(float(confidence), 3),
            bbox=(int(x), int(y), int(bw), int(bh)),
            area_px=int(area),
            is_debris=is_debris,
            severity=severity,
        )
        detections.append(det)

        color = (0, 0, 255) if severity == "high" else (0, 165, 255) if severity == "medium" else (0, 200, 0)
        cv2.rectangle(annotated, (x, y), (x + bw, y + bh), color, 2)
        text = f"{label.split(' - ')[0]} {confidence*100:.0f}%"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(annotated, (x, max(0, y - th - 8)), (x + tw + 6, y), color, -1)
        cv2.putText(annotated, text, (x + 3, max(12, y - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    # sort strongest first
    detections.sort(key=lambda d: d.confidence, reverse=True)
    return detections, annotated, mask


def detect_objects(image_bgr: np.ndarray) -> Tuple[List[Detection], np.ndarray, np.ndarray]:
    """Run the trained YOLO detector for every production scan.

    ``detect_objects_heuristic`` remains available only for offline experiments;
    the API intentionally never falls back to it, so a failed model setup is
    immediately visible instead of producing placeholder detections.
    """
    return _detect_with_yolo(image_bgr)


def summarize(detections: List[Detection]) -> dict:
    total = len(detections)
    debris = [d for d in detections if d.is_debris]
    by_label = {}
    for d in detections:
        by_label[d.label] = by_label.get(d.label, 0) + 1
    severity_counts = {"low": 0, "medium": 0, "high": 0}
    for d in detections:
        severity_counts[d.severity] += 1
    avg_conf = round(sum(d.confidence for d in detections) / total, 3) if total else 0.0
    return {
        "total_objects": total,
        "debris_count": len(debris),
        "non_debris_count": total - len(debris),
        "by_label": by_label,
        "severity_counts": severity_counts,
        "avg_confidence": avg_conf,
    }
