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

    # Step 2-4: Generate images + video + jingle IN PARALLEL
    import concurrent.futures

    veo_prompt = chosen.get("prompt_fragments", {}).get("veo", "")
    if not veo_prompt:
        veo_prompt = chosen.get("visual_treatment", "Product advertisement, cinematic, 8 seconds")

    lyria_prompt = chosen.get("prompt_fragments", {}).get("lyria", "")
    if not lyria_prompt:
        lyria_prompt = "Upbeat advertising jingle, 100 BPM, modern and energetic"

    print(f"\nStep 2/3: Generating 3 images + video + jingle in parallel...")
    print(f"  Veo prompt: {veo_prompt[:120]}...")
    print(f"  Lyria prompt: {lyria_prompt[:120]}...")

    image_count = 3

    def _gen_image(img_num: int) -> str:
        print(f"  [Image {img_num}/{image_count}] Generating...")
        img_bytes = apply_art_direction(
            isolated_product=product_photos[0],
            art_direction=chosen,
            reference_images=product_photos,
            logo=logo,
            series_index=img_num,
            series_total=image_count,
        )
        img_path = os.path.join(out_dir, f"image_{img_num}.png")
        Path(img_path).write_bytes(img_bytes)
        print(f"  [Image {img_num}/{image_count}] Done ({len(img_bytes) / 1024:.0f} KB) {rate_limiter.status()}")
        return img_path

    def _gen_video() -> str:
        print(f"  [Video] Generating...")
        result = generate_video(veo_prompt, reference_images=product_photos[:3])
        path = os.path.join(out_dir, "video.mp4")
        Path(path).write_bytes(result["video_data"])
        print(f"  [Video] Done ({len(result['video_data']) / (1024*1024):.1f} MB)")
        return path

    def _gen_jingle() -> str:
        print(f"  [Jingle] Generating...")
        result = generate_jingle(lyria_prompt)
        path = os.path.join(out_dir, "jingle.wav")
        Path(path).write_bytes(result["audio_data"])
        print(f"  [Jingle] Done ({len(result['audio_data']) / (1024*1024):.1f} MB)")
        return path

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        img_futures = [pool.submit(_gen_image, i) for i in range(1, image_count + 1)]
        video_future = pool.submit(_gen_video)
        jingle_future = pool.submit(_gen_jingle)

        assets["images"] = [f.result() for f in img_futures]
        assets["video"] = video_future.result()
        assets["jingle"] = jingle_future.result()

    print(f"  {rate_limiter.status()}\n")

    # Step 3: Merge video + jingle (must wait for both)
    print("Step 3/3: Merging video + jingle with ffmpeg...")
    final_path = os.path.join(out_dir, "final_ad.mp4")
    merge_audio_video(assets["video"], assets["jingle"], final_path)
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
