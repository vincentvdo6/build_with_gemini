import os
from fastapi import HTTPException, Request

DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"

DEV_USER = {"uid": "dev-user", "email": "dev@localhost"}


def get_current_user(request: Request) -> dict:
    """Extract and verify the Firebase ID token from the Authorization header.

    In dev mode, skips verification and returns a stub user.
    """
    if DEV_MODE:
        return DEV_USER

    from firebase_admin import auth

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
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
