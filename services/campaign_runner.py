import os
import sys
from pathlib import Path

from services.analyze_service import analyze_product
from services.image_service import apply_art_direction, _print_art_direction
from services.video_service import generate_video
from services.jingle_service import generate_jingle
from services.composer_service import merge_audio_video
from services.gemini_client import rate_limiter


def run_campaign(
    product_photos: list[bytes],
    brand_name: str = "test_campaign",
    logo: bytes | None = None,
) -> dict:
    """Run the full AI ad campaign pipeline.

    Args:
        product_photos: 1-4 product images (different angles).
        brand_name: Brand name for folder naming.
        logo: Optional brand logo bytes.

    Returns:
        Dict with paths to all generated assets.
    """
    # Setup output directory
    safe_name = brand_name.lower().replace(" ", "_")
    out_dir = os.path.join("outputs", safe_name)
    os.makedirs(out_dir, exist_ok=True)

    print(f"{'='*60}")
    print(f"  AI Ad Studio — Campaign Runner")
    print(f"  Brand: {brand_name}")
    print(f"  Photos: {len(product_photos)}")
    print(f"  Output: {out_dir}/")
    print(f"{'='*60}\n")

    assets = {}

    # Step 1: Analyze product → get art directions
    print("Step 1/5: Analyzing product...")
    analysis = analyze_product(product_photos, logo)

    vp = analysis["visual_properties"]
    print(f"\n  Colors:    {', '.join(vp['dominant_colors'])}")
    print(f"  Style:     {', '.join(vp['style_tags'])}")
    print(f"  Packaging: {vp['packaging_type']}")

    directions = analysis["art_directions"]
    for idx, ad in enumerate(directions, 1):
        _print_art_direction(idx, ad)

    chosen = directions[0]
    print(f"\n  → Using art direction: '{chosen.get('name', 'Direction 1')}'")
    print(f"  {rate_limiter.status()}\n")

    # Step 2: Generate 5 campaign images for the chosen art direction
    print(f"Step 2/5: Generating 5 images for '{chosen.get('name', 'Direction 1')}'...")
    assets["images"] = []

    for img_num in range(1, 6):
        print(f"  Generating image {img_num}/5...")
        img_bytes = apply_art_direction(
            isolated_product=product_photos[0],
            art_direction=chosen,
            reference_images=product_photos,
            logo=logo,
        )
        img_path = os.path.join(out_dir, f"image_{img_num}.png")
        Path(img_path).write_bytes(img_bytes)
        print(f"    Saved: {img_path} ({len(img_bytes) / 1024:.0f} KB)")
        print(f"    {rate_limiter.status()}")
        assets["images"].append(img_path)

    # Step 3: Generate video
    print("Step 3/5: Generating video (this takes ~60s)...")
    veo_prompt = chosen.get("prompt_fragments", {}).get("veo", "")
    if not veo_prompt:
        print("  WARNING: No veo prompt fragment, using visual treatment as fallback")
        veo_prompt = chosen.get("visual_treatment", "Product advertisement, cinematic, 8 seconds")

    # Send up to 3 reference photos so Veo maintains product consistency
    veo_refs = product_photos[:3]
    print(f"  Sending {len(veo_refs)} reference photo(s) to Veo")
    print(f"  Veo prompt: {veo_prompt[:150]}...")

    video_result = generate_video(veo_prompt, reference_images=veo_refs)
    video_path = os.path.join(out_dir, "video.mp4")
    Path(video_path).write_bytes(video_result["video_data"])
    print(f"  Saved: {video_path} ({len(video_result['video_data']) / (1024*1024):.1f} MB)")
    print(f"  {rate_limiter.status()}\n")
    assets["video"] = video_path

    # Step 4: Generate jingle
    print("Step 4/5: Generating jingle...")
    lyria_prompt = chosen.get("prompt_fragments", {}).get("lyria", "")
    if not lyria_prompt:
        print("  WARNING: No lyria prompt fragment, using default")
        lyria_prompt = "Upbeat advertising jingle, 100 BPM, modern and energetic"

    jingle_result = generate_jingle(lyria_prompt)
    jingle_path = os.path.join(out_dir, "jingle.wav")
    Path(jingle_path).write_bytes(jingle_result["audio_data"])
    print(f"  Saved: {jingle_path} ({len(jingle_result['audio_data']) / (1024*1024):.1f} MB)")
    if jingle_result["text_parts"]:
        print(f"  Lyria notes: {jingle_result['text_parts'][0][:100]}...")
    print(f"  {rate_limiter.status()}\n")
    assets["jingle"] = jingle_path

    # Step 5: Merge video + jingle
    print("Step 5/5: Merging video + jingle with ffmpeg...")
    final_path = os.path.join(out_dir, "final_ad.mp4")
    merge_audio_video(video_path, jingle_path, final_path)
    final_size = os.path.getsize(final_path) / (1024 * 1024)
    print(f"  Saved: {final_path} ({final_size:.1f} MB)\n")
    assets["final_ad"] = final_path

    # Summary
    print(f"{'='*60}")
    print(f"  CAMPAIGN COMPLETE")
    print(f"  {rate_limiter.status()}")
    print(f"{'='*60}")
    print(f"\n  Output directory: {out_dir}/")
    for name, value in assets.items():
        if isinstance(value, list):
            print(f"    {name}: {len(value)} files")
            for p in value:
                size = os.path.getsize(p)
                print(f"      {p} ({size / 1024:.0f} KB)")
        else:
            size = os.path.getsize(value)
            if size > 1024 * 1024:
                print(f"    {name}: {value} ({size / (1024*1024):.1f} MB)")
            else:
                print(f"    {name}: {value} ({size / 1024:.0f} KB)")

    return assets


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m services.campaign_runner <photo1> [photo2] [photo3] [--logo logo.png] [--brand 'Brand Name']")
        sys.exit(1)

    photo_paths = []
    logo_path = None
    brand_name = "test_campaign"
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--logo" and i + 1 < len(args):
            logo_path = Path(args[i + 1])
            i += 2
        elif args[i] == "--brand" and i + 1 < len(args):
            brand_name = args[i + 1]
            i += 2
        else:
            photo_paths.append(Path(args[i]))
            i += 1

    photos = []
    for p in photo_paths:
        if p.exists():
            photos.append(p.read_bytes())
        else:
            print(f"Warning: skipping {p}")

    if not photos:
        print("Error: no valid photos")
        sys.exit(1)

    logo_bytes = None
    if logo_path and logo_path.exists():
        logo_bytes = logo_path.read_bytes()

    run_campaign(photos, brand_name, logo_bytes)
