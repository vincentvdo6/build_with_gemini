import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
# Uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
_app = None
_db = None


def _init():
    global _app, _db
    if _app is not None:
        return

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        _app = firebase_admin.initialize_app(cred)
    else:
        _app = firebase_admin.initialize_app()

    _db = firestore.client()


def get_db() -> firestore.firestore.Client:
    _init()
    return _db


# ---------- Campaign helpers ----------

def create_campaign(user_id: str, data: dict) -> str:
    """Create a campaign document. Returns the document ID."""
    db = get_db()
    doc_ref = db.collection("campaigns").document()
    doc_data = {
        "userId": user_id,
        "businessName": data.get("businessName", ""),
        "productName": data.get("productName", ""),
        "status": "draft",
        "artDirections": [],
        "selectedDirection": None,
        "assets": {"images": [], "video": None, "jingle": None, "composedVideo": None},
        "settings": data.get("settings", {}),
        "errorMessage": None,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(doc_data)
    return doc_ref.id


def get_campaign(campaign_id: str) -> dict | None:
    """Get a campaign by ID. Returns None if not found."""
    db = get_db()
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data


def list_campaigns(user_id: str) -> list[dict]:
    """List all campaigns for a user, newest first."""
    db = get_db()
    docs = (
        db.collection("campaigns")
        .where("userId", "==", user_id)
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results


def update_campaign(campaign_id: str, updates: dict) -> None:
    """Update specific fields on a campaign."""
    db = get_db()
    updates["updatedAt"] = firestore.SERVER_TIMESTAMP
    db.collection("campaigns").document(campaign_id).update(updates)
