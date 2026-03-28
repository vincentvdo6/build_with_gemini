import os
import time
import requests
from google.genai import types
from services.gemini_client import client, rate_limiter
from config import MODEL_VEO, GEMINI_API_KEY

MAX_POLL_ATTEMPTS = 18  # 18 * 10s = 3 minute timeout


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
            prompt=prompt,
            config=config,
        )
        print(f"[Veo] Job submitted. Polling...")

        # Phase 2: Poll
        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            if operation.done:
                break
            print(f"[Veo] Polling {attempt}/{MAX_POLL_ATTEMPTS}...")
            time.sleep(10)
            operation = client.operations.get(operation)
        else:
            if not operation.done:
                raise RuntimeError(
                    f"Veo timed out after {MAX_POLL_ATTEMPTS * 10}s. "
                    "Video generation did not complete."
                )

        # Phase 3: Download
        video_uri = operation.response.generated_videos[0].video.uri
        print(f"[Veo] Video ready. Downloading...")

        dl_response = requests.get(
            video_uri,
            headers={"x-goog-api-key": GEMINI_API_KEY},
            timeout=60,
        )
        dl_response.raise_for_status()
        video_data = dl_response.content

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
