from google.genai import types
from services.gemini_client import client, rate_limiter
from config import MODEL_LYRIA


def generate_jingle(prompt: str) -> dict:
    """Generate a 30-second jingle with Lyria 3 Clip.

    Args:
        prompt: Music style description, e.g. "Dark Synthwave, 100 BPM, heavy bass".

    Returns:
        {"audio_data": bytes, "duration_seconds": 30, "format": "wav",
         "text_parts": list[str]}
    """
    try:
        rate_limiter.check(MODEL_LYRIA)
        response = client.models.generate_content(
            model=MODEL_LYRIA,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO", "TEXT"],
            ),
        )

        audio_data = None
        text_parts = []

        for part in response.candidates[0].content.parts:
            if part.inline_data:
                audio_data = part.inline_data.data
            elif part.text:
                text_parts.append(part.text)

        if not audio_data:
            raise RuntimeError("Lyria returned no audio data")

        return {
            "audio_data": audio_data,
            "duration_seconds": 30,
            "format": "wav",
            "text_parts": text_parts,
        }
    except Exception as e:
        raise RuntimeError(f"Jingle generation failed: {e}") from e


if __name__ == "__main__":
    import os
    import sys
    from pathlib import Path

    if len(sys.argv) < 2:
        print('Usage: python -m services.jingle_service "Dark Synthwave, 100 BPM, heavy bass"')
        sys.exit(1)

    prompt = sys.argv[1]
    print(f"Generating jingle: {prompt}\n")

    result = generate_jingle(prompt)

    os.makedirs("outputs/test", exist_ok=True)
    out_path = "outputs/test/test_jingle.wav"
    Path(out_path).write_bytes(result["audio_data"])

    size_mb = len(result["audio_data"]) / (1024 * 1024)
    print(f"Duration:  {result['duration_seconds']}s")
    print(f"Format:    {result['format']}")
    print(f"File size: {size_mb:.1f} MB")
    print(f"Saved to:  {out_path}")

    if result["text_parts"]:
        print(f"\nText from Lyria:")
        for t in result["text_parts"]:
            print(f"  {t}")
