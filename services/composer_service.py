import os
import subprocess


def merge_audio_video(
    video_path: str,
    audio_path: str,
    output_path: str,
    audio_offset: int = 4,
    music_volume: float = 0.3,
) -> str:
    """Merge Lyria audio onto Veo video with ffmpeg.

    Layers the jingle under the video's existing audio (if any).
    Skips into the jingle to avoid the quiet intro. Trims to video length.

    Args:
        video_path: Path to Veo MP4 (8 seconds).
        audio_path: Path to Lyria WAV (30 seconds).
        output_path: Where to save the merged MP4.
        audio_offset: Seconds to skip into the jingle (default 4, skips intro).
        music_volume: Jingle volume relative to video audio (default 0.3).

    Returns:
        output_path on success.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio not found: {audio_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ss", str(audio_offset),
        "-i", audio_path,
        "-filter_complex",
        f"[1:a]volume={music_volume}[music];[0:a]volume=1.0[veo];[veo][music]amix=inputs=2:duration=shortest",
        "-c:v", "copy",
        "-movflags", "+faststart",
        output_path,
    ]

    # Fallback if video has no audio track — simpler merge
    cmd_no_video_audio = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ss", str(audio_offset),
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

    if result.returncode != 0:
        # Likely failed because video has no audio stream — retry with simple merge
        if "does not contain any stream" in result.stderr or "Stream map" in result.stderr:
            print("[Composer] Video has no audio track, using simple merge...")
            result = subprocess.run(cmd_no_video_audio, capture_output=True, text=True, timeout=60)

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
