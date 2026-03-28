from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from server.auth import get_current_user
from server.firestore_client import (
    create_campaign,
    get_campaign,
    list_campaigns,
    update_campaign,
)

router = APIRouter()


class CreateCampaignBody(BaseModel):
    businessName: str
    productName: str
    settings: dict = {}


class UpdateCampaignBody(BaseModel):
    businessName: str | None = None
    productName: str | None = None
    selectedDirection: int | None = None
    settings: dict | None = None


@router.post("")
def create(body: CreateCampaignBody, user: dict = Depends(get_current_user)):
    campaign_id = create_campaign(user["uid"], body.model_dump())
    campaign = get_campaign(campaign_id)
    return campaign


@router.get("")
def list_all(user: dict = Depends(get_current_user)):
    return list_campaigns(user["uid"])


@router.get("/{campaign_id}")
def get_one(campaign_id: str, user: dict = Depends(get_current_user)):
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign["userId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not your campaign")
    return campaign


@router.patch("/{campaign_id}")
def update(
    campaign_id: str,
    body: UpdateCampaignBody,
    user: dict = Depends(get_current_user),
):
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign["userId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not your campaign")

    updates = body.model_dump(exclude_none=True)
    if updates:
        update_campaign(campaign_id, updates)

    return get_campaign(campaign_id)


@router.delete("/{campaign_id}")
def delete(campaign_id: str, user: dict = Depends(get_current_user)):
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign["userId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not your campaign")

    update_campaign(campaign_id, {"status": "deleted"})
    return {"ok": True}
