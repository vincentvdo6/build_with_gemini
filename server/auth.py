from fastapi import Depends, HTTPException, Request
from firebase_admin import auth


def get_current_user(request: Request) -> dict:
    """Extract and verify the Firebase ID token from the Authorization header.

    Returns a dict with uid, email, etc.
    """
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        # Also check query param (used by SSE EventSource which can't set headers)
        token = request.query_params.get("token")
        if not token:
            raise HTTPException(status_code=401, detail="Missing auth token")
    else:
        token = header[7:]

    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
