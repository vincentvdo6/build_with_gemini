import asyncio
import base64
import os
import traceback
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from server.auth import get_current_user
from server.firestore_client import get_campaign, update_campaign
from server.sse import sse_manager

from services.analyze_service import analyze_product
from services.image_service import apply_art_direction, generate_images, tweak_image
from services.video_service import generate_video
from services.jingle_service import generate_jingle
from services.composer_service import merge_audio_video

router = APIRouter()


def _require_campaign(campaign_id: str, user: dict) -> dict:
    campaign = get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign["userId"] != user["uid"]:
        raise HTTPException(status_code=403, detail="Not your campaign")
    return campaign


def _save_asset(campaign_id: str, filename: str, data: bytes) -> str:
    """Save generated asset to disk and return its path."""
    out_dir = os.path.join("outputs", campaign_id)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, filename)
    Path(path).write_bytes(data)
    return path


# ---------- Analyze ----------

@router.post("/{campaign_id}/analyze")
async def analyze(
    campaign_id: str,
    product_photos: list[UploadFile] = File(...),
    logo: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """Run product analysis → returns 3 art directions."""
    _require_campaign(campaign_id, user)
    update_campaign(campaign_id, {"status": "analyzing"})

    try:
        photo_bytes = [await f.read() for f in product_photos]
        logo_bytes = await logo.read() if logo else None

        result = await asyncio.to_thread(analyze_product, photo_bytes, logo_bytes)

        update_campaign(campaign_id, {
            "status": "draft",
            "artDirections": result["art_directions"],
        })

        return result

    except Exception as e:
        update_campaign(campaign_id, {"status": "error", "errorMessage": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Preview (art direction → single image) ----------

class PreviewBody(BaseModel):
    directionIndex: int = 0


@router.post("/{campaign_id}/preview")
async def preview(
    campaign_id: str,
    product_photos: list[UploadFile] = File(...),
    logo: UploadFile | None = File(None),
    direction_index: int = Form(0),
    user: dict = Depends(get_current_user),
):
    """Generate a preview image for a selected art direction."""
    campaign = _require_campaign(campaign_id, user)

    directions = campaign.get("artDirections", [])
    if not directions or direction_index >= len(directions):
        raise HTTPException(status_code=400, detail="Invalid direction index")

    update_campaign(campaign_id, {"status": "previewing"})

    try:
        photo_bytes = [await f.read() for f in product_photos]
        logo_bytes = await logo.read() if logo else None
        chosen = directions[direction_index]

        img_data = await asyncio.to_thread(
            apply_art_direction,
            photo_bytes[0],
            chosen,
            photo_bytes,
            logo_bytes,
        )

        path = _save_asset(campaign_id, "preview.png", img_data)
        img_b64 = base64.b64encode(img_data).decode()

        update_campaign(campaign_id, {
            "status": "draft",
            "selectedDirection": direction_index,
        })

        return {"image": img_b64, "path": path}

    except Exception as e:
        update_campaign(campaign_id, {"status": "error", "errorMessage": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Tweak ----------

class TweakBody(BaseModel):
    tweakType: str
    tweakParams: dict


@router.post("/{campaign_id}/tweak")
async def tweak(
    campaign_id: str,
    current_image: UploadFile = File(...),
    tweak_type: str = Form(...),
    tweak_action: str = Form(...),
    user: dict = Depends(get_current_user),
):
    """Apply a tweak to the current canvas image."""
    _require_campaign(campaign_id, user)

    try:
        img_bytes = await current_image.read()
        result = await asyncio.to_thread(
            tweak_image,
            img_bytes,
            tweak_type,
            {"action": tweak_action},
        )

        img_b64 = base64.b64encode(result).decode()
        return {"image": img_b64}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Full campaign generation ----------

@router.post("/{campaign_id}/generate")
async def generate_campaign(
    campaign_id: str,
    product_photos: list[UploadFile] = File(...),
    logo: UploadFile | None = File(None),
    direction_index: int = Form(0),
    user: dict = Depends(get_current_user),
):
    """Run the full generation pipeline: images + video + jingle + compose.

    Streams progress via SSE on /{campaign_id}/stream.
    """
    campaign = _require_campaign(campaign_id, user)

    directions = campaign.get("artDirections", [])
    if not directions or direction_index >= len(directions):
        raise HTTPException(status_code=400, detail="No art directions — run /analyze first")

    chosen = directions[direction_index]
    photo_bytes = [await f.read() for f in product_photos]
    logo_bytes = await logo.read() if logo else None

    update_campaign(campaign_id, {
        "status": "generating",
        "selectedDirection": direction_index,
    })

    # Run generation in background thread so we can return immediately
    asyncio.get_event_loop().run_in_executor(
        None,
        _run_pipeline,
        campaign_id,
        chosen,
        photo_bytes,
        logo_bytes,
    )

    return {"status": "generating", "message": "Pipeline started. Listen on /stream for progress."}


def _run_pipeline(
    campaign_id: str,
    art_direction: dict,
    product_photos: list[bytes],
    logo: bytes | None,
) -> None:
    """Synchronous pipeline — runs in a thread, sends SSE updates."""
    assets: dict = {"images": [], "video": None, "jingle": None, "composedVideo": None}

    try:
        # Step 1: Generate 5 campaign images
        sse_manager.send(campaign_id, "status", "Generating images (1/4)...")
        nano_prompt = art_direction["prompt_fragments"]["nano_banana"]

        for i in range(5):
            sse_manager.send(campaign_id, "progress", f"Image {i + 1}/5")
            img_data = apply_art_direction(
                isolated_product=product_photos[0],
                art_direction=art_direction,
                reference_images=product_photos,
                logo=logo,
            )
            path = _save_asset(campaign_id, f"image_{i + 1}.png", img_data)
            img_b64 = base64.b64encode(img_data).decode()
            assets["images"].append({"path": path, "base64": img_b64, "format": "1:1"})

        update_campaign(campaign_id, {"assets.images": assets["images"]})

        # Step 2: Generate video
        sse_manager.send(campaign_id, "status", "Generating video (2/4)...")
        veo_prompt = art_direction.get("prompt_fragments", {}).get("veo", "")
        if not veo_prompt:
            veo_prompt = art_direction.get("visual_treatment", "Product ad, cinematic, 8 seconds")

        video_result = generate_video(veo_prompt, reference_images=product_photos[:3])
        video_path = _save_asset(campaign_id, "video.mp4", video_result["video_data"])
        assets["video"] = {"path": video_path, "duration": 8}

        update_campaign(campaign_id, {"assets.video": assets["video"]})

        # Step 3: Generate jingle
        sse_manager.send(campaign_id, "status", "Generating jingle (3/4)...")
        lyria_prompt = art_direction.get("prompt_fragments", {}).get("lyria", "")
        if not lyria_prompt:
            lyria_prompt = "Upbeat advertising jingle, 100 BPM, modern and energetic"

        jingle_result = generate_jingle(lyria_prompt)
        jingle_path = _save_asset(campaign_id, "jingle.wav", jingle_result["audio_data"])
        assets["jingle"] = {"path": jingle_path, "duration": 30}

        update_campaign(campaign_id, {"assets.jingle": assets["jingle"]})

        # Step 4: Merge video + jingle
        sse_manager.send(campaign_id, "status", "Composing final video (4/4)...")
        final_path = os.path.join("outputs", campaign_id, "final_ad.mp4")
        merge_audio_video(video_path, jingle_path, final_path)
        assets["composedVideo"] = {"path": final_path, "duration": 8}

        update_campaign(campaign_id, {
            "status": "complete",
            "assets": assets,
        })

        sse_manager.send(campaign_id, "complete", "Campaign generation finished!")

    except Exception as e:
        error_msg = f"{e}\n{traceback.format_exc()}"
        update_campaign(campaign_id, {"status": "error", "errorMessage": str(e)})
        sse_manager.send(campaign_id, "error", str(e))
