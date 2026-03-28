import os
import subprocess


def merge_audio_video(
    video_path: str,
    audio_path: str,
    output_path: str,
    audio_offset: int = 4,
) -> str:
    """Replace Veo video's audio track with Lyria audio.

    Veo handles visuals only (ambient SFX are now in Lyria's output).
    Lyria handles ALL audio — underscore music, ambient feel, and
    brand voiceover in the final seconds. No mixing needed.

    Args:
        video_path: Path to Veo MP4 (8 seconds).
        audio_path: Path to Lyria WAV (30 seconds — music + voiceover).
        output_path: Where to save the final MP4.
        audio_offset: Seconds to skip into the Lyria track (default 4, skips intro).

    Returns:
        output_path on success.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio not found: {audio_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Video from Veo, audio ONLY from Lyria — no mixing
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ss", str(audio_offset),
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")

    return output_path


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        print("Usage: python -m services.composer_service <video.mp4> <audio.wav> <output.mp4>")
        print("Example: python -m services.composer_service outputs/test/test_video.mp4 outputs/test/test_jingle.wav outputs/test/final_ad.mp4")
        sys.exit(1)

    video = sys.argv[1]
    audio = sys.argv[2]
    output = sys.argv[3]

    print(f"Merging:\n  Video: {video}\n  Audio: {audio}\n  Output: {output}\n")

    result_path = merge_audio_video(video, audio, output)

    size_mb = os.path.getsize(result_path) / (1024 * 1024)
    print(f"Done! {size_mb:.1f} MB saved to {result_path}")
