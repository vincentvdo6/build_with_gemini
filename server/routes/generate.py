import asyncio
import base64
import os
import time
import traceback
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from server.auth import get_current_user
from server.firestore_client import get_campaign, update_campaign
from server.sse import sse_manager

from services.analyze_service import analyze_product
from services.image_service import apply_art_direction, generate_images, tweak_image, generate_scene_preview
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
    """Save generated asset to disk and return the filename only (not full path)."""
    out_dir = os.path.join("outputs", campaign_id)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, filename)
    Path(path).write_bytes(data)
    return filename


def _asset_disk_path(campaign_id: str, filename: str) -> str:
    """Get the full disk path for a saved asset."""
    return os.path.join("outputs", campaign_id, filename)


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


# ---------- Vibe images (environment-only, no product) ----------

@router.post("/{campaign_id}/vibes")
async def vibes(
    campaign_id: str,
    product_photos: list[UploadFile] = File(...),
    logo: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """Generate 3 scene-only images — one per art direction. Sees the product for context but doesn't render it."""
    campaign = _require_campaign(campaign_id, user)

    directions = campaign.get("artDirections", [])
    if len(directions) < 3:
        raise HTTPException(status_code=400, detail="Run /analyze first — need 3 art directions")

    photo_bytes = [await f.read() for f in product_photos]
    logo_bytes = await logo.read() if logo else None

    try:
        # Generate all 3 in parallel threads
        loop = asyncio.get_event_loop()
        futures = [
            loop.run_in_executor(None, generate_scene_preview, d, photo_bytes, logo_bytes)
            for d in directions[:3]
        ]
        results = await asyncio.gather(*futures)

        vibe_images = []
        for i, img_data in enumerate(results):
            path = _save_asset(campaign_id, f"vibe_{i + 1}.png", img_data)
            vibe_images.append({
                "index": i,
                "image": base64.b64encode(img_data).decode(),
                "path": path,
            })

        return {"vibes": vibe_images}

    except Exception as e:
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
    image_count: int = Form(3),
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

    # Clamp image_count to 2-5
    image_count = max(2, min(5, image_count))

    # Run generation in background thread so we can return immediately
    asyncio.get_event_loop().run_in_executor(
        None,
        _run_pipeline,
        campaign_id,
        chosen,
        photo_bytes,
        logo_bytes,
        image_count,
    )

    return {"status": "generating", "message": "Pipeline started. Listen on /stream for progress."}


def _run_pipeline(
    campaign_id: str,
    art_direction: dict,
    product_photos: list[bytes],
    logo: bytes | None,
    image_count: int = 3,
) -> None:
    """Parallel pipeline — images, video, and jingle all run concurrently."""
    import concurrent.futures

    assets: dict = {"images": [], "video": None, "jingle": None, "composedVideo": None}

    try:
        # Give SSE clients time to connect before sending events
        time.sleep(2.0)
        sse_manager.send(campaign_id, "status", "Generating campaign assets...")

        # Prepare prompts
        veo_prompt = art_direction.get("prompt_fragments", {}).get("veo", "")
        if not veo_prompt:
            veo_prompt = art_direction.get("visual_treatment", "Product ad, cinematic, 8 seconds")

        lyria_prompt = art_direction.get("prompt_fragments", {}).get("lyria", "")
        if not lyria_prompt:
            lyria_prompt = "Upbeat advertising jingle, 100 BPM, modern and energetic"

        # --- Run everything in parallel ---
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:

            # Submit image jobs (dynamic count with thematic continuity)
            def _gen_image(index: int) -> dict:
                sse_manager.send(campaign_id, "progress", f"Image {index}/{image_count}")
                img_data = apply_art_direction(
                    isolated_product=product_photos[0],
                    art_direction=art_direction,
                    reference_images=product_photos,
                    logo=logo,
                    series_index=index,
                    series_total=image_count,
                )
                path = _save_asset(campaign_id, f"image_{index}.png", img_data)
                return {"path": path, "format": "1:1"}

            img_futures = [pool.submit(_gen_image, i) for i in range(1, image_count + 1)]

            # Submit video job
            def _gen_video() -> dict:
                sse_manager.send(campaign_id, "progress", "Video generating...")
                result = generate_video(veo_prompt, reference_images=product_photos[:3])
                path = _save_asset(campaign_id, "video.mp4", result["video_data"])
                return {"path": path, "duration": 8}

            video_future = pool.submit(_gen_video)

            # Submit jingle job
            def _gen_jingle() -> dict:
                sse_manager.send(campaign_id, "progress", "Jingle generating...")
                result = generate_jingle(lyria_prompt)
                path = _save_asset(campaign_id, "jingle.wav", result["audio_data"])
                return {"path": path, "duration": 30}

            jingle_future = pool.submit(_gen_jingle)

            # Collect images as they complete
            for f in concurrent.futures.as_completed(img_futures):
                assets["images"].append(f.result())
            sse_manager.send(campaign_id, "status", "Images done. Waiting for video & audio...")
            update_campaign(campaign_id, {"assets.images": assets["images"]})

            # Wait for video and jingle
            assets["video"] = video_future.result()
            update_campaign(campaign_id, {"assets.video": assets["video"]})

            assets["jingle"] = jingle_future.result()
            update_campaign(campaign_id, {"assets.jingle": assets["jingle"]})

        # --- Merge (needs both video + jingle done) ---
        sse_manager.send(campaign_id, "status", "Composing final video...")
        final_disk_path = _asset_disk_path(campaign_id, "final_ad.mp4")
        video_disk_path = _asset_disk_path(campaign_id, assets["video"]["path"])
        jingle_disk_path = _asset_disk_path(campaign_id, assets["jingle"]["path"])
        merge_audio_video(video_disk_path, jingle_disk_path, final_disk_path)
        assets["composedVideo"] = {"path": "final_ad.mp4", "duration": 8}

        update_campaign(campaign_id, {
            "status": "complete",
            "assets": assets,
        })

        sse_manager.send(campaign_id, "complete", "Campaign generation finished!")

    except Exception as e:
        error_msg = f"{e}\n{traceback.format_exc()}"
        update_campaign(campaign_id, {"status": "error", "errorMessage": str(e)})
        sse_manager.send(campaign_id, "error", str(e))
