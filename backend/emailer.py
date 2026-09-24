"""Transactional email through Brevo's SMTP API. Zero extra dependencies (stdlib only)."""
import json
import os
import urllib.error
import urllib.request

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class BrevoError(RuntimeError):
    """Raised when Brevo rejects the request — carries Brevo's own error message."""
    pass


def send_email(to_email, subject, html, text=None):
    """Send one email via Brevo"""
    # Move this line out of the docstring comment above ⬇️
    api_key = os.getenv("BREVO_API_KEY")
    sender = os.getenv("BREVO_SENDER_EMAIL")
    
    if not api_key or not sender:
        raise RuntimeError("BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in the backend environment")
        
    payload = {
        "sender": {"email": sender, "name": os.getenv("BREVO_SENDER_NAME", "MarineVision")},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
        "textContent": text or "",
    }
    request = urllib.request.Request(
        BREVO_API_URL,
        data=json.dumps(payload).encode(),
        headers={"api-key": api_key, "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")
        raise BrevoError(f"Brevo rejected the request (HTTP {exc.code}): {body}") from exc

def send_password_reset(to_email, full_name, reset_link):
    """Branded password-reset email. Link expires 30 minutes after it is issued."""
    subject = "Reset your MarineVision password"
    html = f"""\
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#04121c;color:#e2e8f0;border-radius:16px;overflow:hidden">
  <div style="padding:32px 32px 8px">
    <p style="font-size:11px;letter-spacing:3px;color:#22d3ee;margin:0 0 12px">MARINEVISION</p>
    <h1 style="font-size:22px;margin:0 0 12px;color:#f8fafc">Reset your password</h1>
    <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 8px">Hi {full_name},</p>
    <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 24px">
      Someone asked to reset the password for your MarineVision account. If that was you,
      tap the button below. The link expires in <b style="color:#e2e8f0">30 minutes</b>.
    </p>
    <a href="{reset_link}" style="display:inline-block;background:linear-gradient(90deg,#2dd4bf,#22d3ee);color:#03202b;font-weight:bold;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:12px">
      Reset password
    </a>
    <p style="font-size:12px;line-height:1.7;color:#64748b;margin:24px 0 0">
      Didn't ask for this? Ignore the email — your password stays exactly as it is.
    </p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.08)">
    <p style="font-size:11px;color:#475569;margin:0">MarineVision · Ocean intelligence</p>
  </div>
</div>"""
    text = (
        f"Hi {full_name},\n\nReset your MarineVision password with this link "
        f"(expires in 30 minutes):\n{reset_link}\n\n"
        "Didn't ask for this? Ignore this email.\n"
    )
    return send_email(to_email, subject, html, text)
