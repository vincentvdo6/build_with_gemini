import os
import time
import requests
from google.genai import types
from services.gemini_client import client, rate_limiter
from config import MODEL_VEO, GEMINI_API_KEY

MAX_POLL_ATTEMPTS = 24  # 24 * 10s = 4 minute timeout
POLL_API_BASE = "https://generativelanguage.googleapis.com"


VIDEO_STRUCTURE = """
MANDATORY 3-ACT STRUCTURE for this 8-second video ad:

SECONDS 0-2 — THE HOOK (scroll-stopper):
Dramatic, visually arresting opening. Fast camera movement, unexpected angle, or striking visual. NO product yet, NO logo yet. Just something that makes someone stop scrolling — a whip pan across the environment, a close-up of texture with rack focus, light catching particles in the air, or a dramatic reveal building anticipation.

SECONDS 3-5 — THE HERO (product reveal):
Product appears front and center. Brand label clearly visible, facing camera. The environment from the art direction surrounds the product as context. Smooth camera movement — slow push-in, gentle orbit, or steady tracking shot. This is the "oh, it's an ad for THIS" moment. Hold long enough for the viewer to register the brand.

SECONDS 6-8 — THE SETTLE (locked-off beauty shot):
Camera arrives at its final position and HOLDS COMPLETELY STILL on the product. No movement in the last 2 seconds. The frame should feel like a print ad — a locked-off beauty shot that could be a poster. All motion stops. The product is perfectly composed, branding visible, environment as backdrop.

Optional: use a subtle light shift in the final moments — the ambient light slowly warms and the background softly dims, drawing focus to the product. This creates a natural visual resolution without camera movement.

NEVER end with a zoom, whip pan, orbit, or ANY camera motion still in progress. The video must feel complete, not cut off. A static final frame always feels intentional.

PACING: The energy and movement happens in seconds 0-5. The last 3 seconds are the landing — steady, composed, intentional. Transitions between acts should feel like natural camera movement that decelerates into stillness.
"""


def generate_video(
    prompt: str,
    reference_images: list[bytes] | None = None,
) -> dict:
    """Generate an 8-second video with Veo 3.1 Fast.

    This is async — submits the job, polls until done, then downloads the video.
    Blocks for 30-60 seconds typically.

    Args:
        prompt: Video scene description from art direction's veo_prompt_fragment.
        reference_images: Optional product photos (up to 3) for consistency.

    Returns:
        {"video_data": bytes, "duration_seconds": 8, "format": "mp4"}
    """
    # Wrap the art direction's veo prompt with the 3-act structure
    full_prompt = f"""{VIDEO_STRUCTURE}

SCENE DIRECTION (from art direction): {prompt}

DURATION: Exactly 8 seconds. The video MUST use all 8 seconds — do not end early. The final frame should feel like a deliberate ending, not an abrupt cutoff.

AUDIO: Veo generates synchronized audio natively. Generate ambient environmental sounds ONLY — match the scene (e.g. wind, waves, city hum, clinking glasses, footsteps). NO voiceover, NO dialogue, NO spoken words, NO music. All voiceover and music are handled by Lyria separately.

ANTI-AI REALISM: Shot on anamorphic widescreen. Subtle film grain, minor lens breathing on focus pulls, micro handheld jitter. Materials have real texture — wet surfaces reflect, metal glints, fabric has weave. Never hyper-realistic, never 8K, never perfect.

Avoid: motion blur, face distortion, warping, morphing, duplicate objects, floating objects, plastic skin, oversaturation, over-sharpening"""

    try:
        rate_limiter.check(MODEL_VEO)

        # Phase 1: Submit
        ref_imgs = None
        if reference_images:
            ref_imgs = [
                types.VideoGenerationReferenceImage(
                    image=types.Image(image_bytes=img, mime_type="image/png"),
                    reference_type="ASSET",
                )
                for img in reference_images[:3]
            ]

        config = types.GenerateVideosConfig(
            reference_images=ref_imgs,
            aspect_ratio="16:9",
        )

        operation = client.models.generate_videos(
            model=MODEL_VEO,
            prompt=full_prompt,
            config=config,
        )
        print(f"[Veo] Job submitted. Polling...")

        # Phase 2: Poll via direct HTTP (SDK operations.get() hangs)
        op_name = operation.name
        print(f"[Veo] Operation: {op_name}")
        poll_url = f"{POLL_API_BASE}/v1beta/{op_name}"

        video_uri = None
        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            time.sleep(10)
            print(f"[Veo] Polling {attempt}/{MAX_POLL_ATTEMPTS}...")
            try:
                poll_resp = requests.get(
                    poll_url,
                    params={"key": GEMINI_API_KEY},
                    timeout=15,
                )
                poll_resp.raise_for_status()
                poll_data = poll_resp.json()

                if poll_data.get("done"):
                    print(f"[Veo] Generation complete!")
                    videos = (poll_data.get("response", {})
                              .get("generateVideoResponse", {})
                              .get("generatedSamples", []))
                    if not videos:
                        # Try alternate response shape
                        videos = (poll_data.get("response", {})
                                  .get("generatedVideos", []))
                    if not videos:
                        raise RuntimeError(
                            f"Veo completed but returned no videos. "
                            f"Response keys: {list(poll_data.get('response', {}).keys())}"
                        )
                    video_uri = (videos[0].get("video", {}).get("uri")
                                 or videos[0].get("uri"))
                    if not video_uri:
                        raise RuntimeError(
                            f"Veo video has no URI. Video object: {videos[0]}"
                        )
                    break

                if poll_data.get("error"):
                    raise RuntimeError(
                        f"Veo error: {poll_data['error']}"
                    )

            except requests.exceptions.Timeout:
                print(f"[Veo] Poll {attempt} timed out — retrying...")
                continue
            except requests.exceptions.RequestException as req_err:
                print(f"[Veo] Poll {attempt} HTTP error: {req_err} — retrying...")
                continue

        if not video_uri:
            raise RuntimeError(
                f"Veo timed out after {MAX_POLL_ATTEMPTS * 10}s. "
                "Video generation did not complete."
            )

        # Phase 3: Download (streaming to handle large files)
        print(f"[Veo] Downloading from: {video_uri[:100]}...")

        dl_response = requests.get(
            video_uri,
            headers={"x-goog-api-key": GEMINI_API_KEY},
            timeout=(15, 120),  # 15s connect, 120s read
            stream=True,
        )
        dl_response.raise_for_status()

        chunks = []
        downloaded = 0
        for chunk in dl_response.iter_content(chunk_size=256 * 1024):
            if chunk:
                chunks.append(chunk)
                downloaded += len(chunk)
                if downloaded % (1024 * 1024) < 256 * 1024:  # log ~every 1MB
                    print(f"[Veo] Downloaded {downloaded / (1024*1024):.1f} MB...")
        video_data = b"".join(chunks)
        print(f"[Veo] Download complete: {len(video_data) / (1024*1024):.1f} MB")

        if len(video_data) < 1000:
            raise RuntimeError(
                f"Downloaded video is suspiciously small ({len(video_data)} bytes). "
                "Likely an error response instead of video data."
            )

        return {
            "video_data": video_data,
            "duration_seconds": 8,
            "format": "mp4",
        }
    except Exception as e:
        raise RuntimeError(f"Video generation failed: {e}") from e


if __name__ == "__main__":
    import sys
    from pathlib import Path

    if len(sys.argv) < 2:
        print('Usage: python -m services.video_service "Camera pans around a can on a boat deck, golden hour. 8 seconds."')
        sys.exit(1)

    prompt = sys.argv[1]
    print(f"Generating video: {prompt}\n")

    result = generate_video(prompt)

    os.makedirs("outputs/test", exist_ok=True)
    out_path = "outputs/test/test_video.mp4"
    Path(out_path).write_bytes(result["video_data"])

    size_mb = len(result["video_data"]) / (1024 * 1024)
    print(f"\nDuration:  {result['duration_seconds']}s")
    print(f"Format:    {result['format']}")
    print(f"File size: {size_mb:.1f} MB")
    print(f"Saved to:  {out_path}")
