import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
MODEL_ID = "gemini-3.6-flash"

SYSTEM_PROMPT = """
You are MarineVision AI, an expert marine environment assistant built for Smart India Hackathon.
You analyze marine debris scan data provided to you and answer user questions.

Guidelines:
1. Summarize debris detections clearly (count, types like plastics, nets, metal, etc.).
2. Assess environmental severity (Low, Medium, Critical).
3. Provide actionable suggestions for disposal/cleanup.
4. Keep responses concise, helpful, and professional.
"""

def _ensure_client():
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured. Add it to backend/.env before using the AI assistant.")
    return client


def generate_scan_summary(scan_data: dict) -> str:
    """Generates an initial summary of the current scan results."""
    prompt = f"""
    {SYSTEM_PROMPT}

    Here is the data from the current marine scan:
    - Total Objects Detected: {scan_data.get('total_count', 0)}
    - Breakdown of Objects: {scan_data.get('counts', {})}
    - Detection Details: {scan_data.get('detections', [])}

    Please provide a structured summary containing:
    1. 📊 Executive Summary of detected debris.
    2. ⚠️ Environmental Threat Level.
    3. 🧹 Recommended Remediation Action.
    """
    try:
        response = _ensure_client().models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        return getattr(response, "text", str(response))
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def answer_user_question(scan_data: dict, question: str, chat_history: list | None = None) -> str:
    """Answers user questions based on the current scan data."""
    history = chat_history or []
    prompt = f"""
    {SYSTEM_PROMPT}

    Current Scan Context:
    - Total Objects Detected: {scan_data.get('total_count', 0)}
    - Breakdown: {scan_data.get('counts', {})}
    - Prior Conversation: {history}

    User Question: "{question}"

    Answer the question accurately using the scan context if relevant.
    """
    try:
        response = _ensure_client().models.generate_content(
            model=MODEL_ID,
            contents=prompt
        )
        return getattr(response, "text", str(response))
    except Exception as e:
        return f"Error processing query: {str(e)}"