import os
import sys
from google.genai import types
from services.gemini_client import client, rate_limiter
from config import MODEL_NANO_BANANA

# Appended to EVERY Nano Banana prompt — fixes back-of-can / nutrition-facts rendering
FRONT_LABEL_INSTRUCTION = (
    "MANDATORY: The product's main logo, brand name, and front label must be "
    "clearly visible and facing the camera. Never show the back, nutrition facts, "
    "or side panel as the primary visible face of the product."
)

# Set to True when running from CLI for debug output
_verbose = False


def _log(msg: str) -> None:
    if _verbose:
        print(msg)


def apply_art_direction(
    isolated_product: bytes,
    art_direction: dict,
    reference_images: list[bytes],
    logo: bytes | None = None,
    series_index: int = 0,
    series_total: int = 0,
) -> bytes:
    """Generate a preview image of the product placed into an art direction's scene.

    Sends the isolated cutout + reference photos so Nano Banana renders the REAL
    product, not a hallucination. The art direction's prompt fragment and color
    palette guide the scene.

    Args:
        isolated_product: Background-removed product cutout (PNG bytes).
        art_direction: One art direction dict from analyze_service (has
            color_palette, visual_treatment, prompt_fragments.nano_banana).
        reference_images: Original multi-angle product photos so the model
            knows what the product looks like from every angle.
        logo: Optional brand logo bytes.
        series_index: If generating a series, which image this is (1-based).
        series_total: Total images in the series (0 = standalone).

    Returns:
        PNG image bytes of the product placed in the scene.
    """
    palette = art_direction["color_palette"]
    nano_prompt = art_direction["prompt_fragments"]["nano_banana"]
    treatment = _get_treatment(art_direction)

    contents = []

    # Send isolated product cutout
    contents.append(types.Part(text="[ISOLATED PRODUCT CUTOUT — this is the exact product to place in the scene]:"))
    contents.append(types.Part.from_bytes(data=isolated_product, mime_type="image/png"))

    # Send reference photos for multi-angle accuracy
    for i, ref in enumerate(reference_images):
        contents.append(types.Part(text=f"[REFERENCE PHOTO {i + 1} — another angle of the same product]:"))
        contents.append(types.Part.from_bytes(data=ref, mime_type="image/png"))

    # Send logo if provided
    if logo:
        contents.append(types.Part(text="[BRAND LOGO — incorporate naturally if appropriate]:"))
        contents.append(types.Part.from_bytes(data=logo, mime_type="image/png"))

    # Build thematic continuity instruction for series
    series_instruction = ""
    if series_total > 1 and series_index > 0:
        # Each image tells a different chapter of the same story
        story_beats = [
            {
                "role": "The Hero Shot",
                "desc": "Product front and center, perfectly lit, label fully visible. The definitive product portrait — this is the one that goes on the website.",
                "camera": "straight-on or slight 3/4 angle, shallow depth of field, product fills 60% of frame",
            },
            {
                "role": "The Environment Shot",
                "desc": "Product placed naturally in its world — on a surface, in a setting, surrounded by contextual props. Shows WHERE this product lives and WHO it's for.",
                "camera": "wider framing, product at 30-40% of frame, rich environmental detail, leading lines draw eye to product",
            },
            {
                "role": "The Detail Shot",
                "desc": "Intimate close-up of one compelling detail — the texture of the packaging, condensation drops, a pour, steam rising, the cap, the label typography. Tactile and sensory.",
                "camera": "macro or tight crop, extreme shallow DOF, dramatic side lighting to emphasize texture",
            },
            {
                "role": "The Lifestyle Shot",
                "desc": "The product in a moment of use or desire — on a table at golden hour, mid-pour into a glass, beside a plate of food, in someone's hand (no face). Aspirational and emotional.",
                "camera": "candid editorial feel, slightly imperfect framing, warm natural light, bokeh background",
            },
            {
                "role": "The Dramatic Shot",
                "desc": "Unexpected angle or bold composition — bird's eye, extreme low angle, silhouette against light, reflection in a surface, or surrounded by ingredients/materials. The scroll-stopper.",
                "camera": "unusual perspective, strong geometric composition, high contrast lighting, negative space",
            },
        ]
        beat = story_beats[(series_index - 1) % len(story_beats)]
        series_instruction = f"""
CAMPAIGN SERIES — Image {series_index} of {series_total}: "{beat['role']}"
{beat['desc']}
Camera direction: {beat['camera']}

CRITICAL: This image must look like it belongs to the SAME campaign as the others (same color palette, same lighting temperature, same visual world) but must be a COMPLETELY DIFFERENT composition and moment. Do NOT just re-angle the same shot — tell a different part of the product's story."""

    # Build the generation prompt
    prompt = f"""Generate a single advertising photograph using the EXACT product shown in the reference photos above. Do NOT invent or hallucinate a different product — use the real one.

Scene direction: {treatment}

Color palette: {', '.join(palette['colors'])}
Color reasoning: {palette['reasoning']}

Specific image prompt: {nano_prompt}
{series_instruction}

{FRONT_LABEL_INSTRUCTION}

CRITICAL: The product in the generated image must be visually identical to the product in the reference photos — same shape, same label, same colors, same branding. Place it naturally into the described scene with proper lighting and shadows.

Shot on 35mm f/1.4 lens. Slight natural film grain, subtle lens vignetting. Colors feel real and slightly warm — not oversaturated. The image should feel like a professional product photograph, not a digital render.

AVOID: hyper-realistic, 8K, ultra HD, CGI, 3D render, oversaturated, HDR look, stock photo aesthetic."""

    _log("\n=== PROMPT SENT TO NANO BANANA ===")
    _log(prompt)
    _log("=================================\n")

    contents.append(types.Part(text=prompt))

    try:
        rate_limiter.check(MODEL_NANO_BANANA)
        response = client.models.generate_content(
            model=MODEL_NANO_BANANA,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data
        raise RuntimeError("Nano Banana returned no image data")
    except Exception as e:
        raise RuntimeError(f"Art direction preview failed: {e}") from e


def generate_scene_preview(
    art_direction: dict,
    reference_images: list[bytes],
    logo: bytes | None = None,
) -> bytes:
    """Generate a scene-only image for the art direction card.

    Sends the product photos as reference so the model understands the product's
    world — but the output image contains NO product. Just the environment,
    lighting, and vibe where the product would live.

    Args:
        art_direction: One art direction dict from analyze_service.
        reference_images: Product photos so the model knows the context.
        logo: Optional brand logo bytes.

    Returns:
        PNG image bytes of the scene.
    """
    palette = art_direction["color_palette"]
    treatment = _get_treatment(art_direction)
    nano_prompt = art_direction.get("prompt_fragments", {}).get("nano_banana", "")
    tone = art_direction.get("campaign_tone", "")
    colors = palette.get("colors", [])
    reasoning = palette.get("reasoning", "")

    contents = []

    # Send product photos as context — model needs to understand what product
    # this scene is being built around, even though it won't render it
    for i, ref in enumerate(reference_images):
        contents.append(types.Part(text=f"[PRODUCT REFERENCE {i + 1} — study this product's style, brand, and audience. Do NOT render this product in the output image]:"))
        contents.append(types.Part.from_bytes(data=ref, mime_type="image/png"))

    if logo:
        contents.append(types.Part(text="[BRAND LOGO — for brand context only. Do NOT render the logo in the output]:"))
        contents.append(types.Part.from_bytes(data=logo, mime_type="image/png"))

    prompt = f"""CRITICAL INSTRUCTION: Generate ONLY the background environment. ZERO products in the frame. No cans, no bottles, no boxes, no packaging, no branded items, no food, no drinks — NOTHING that is a product. The reference photos above are ONLY for understanding the brand's world. Do NOT reproduce or place any version of that product in this image.

Generate a cinematic establishing shot of the ENVIRONMENT ONLY for this advertising concept.

Scene direction: {treatment}

Detailed scene concept: {nano_prompt}

Campaign tone: {tone}

Color palette: {', '.join(colors)}
Color reasoning: {reasoning}

The composition should leave a natural focal point — an empty surface, a clear space, a table edge, a ledge — where a product COULD be placed later, but nothing is there now. Just atmosphere, setting, and mood.

Shot on a Canon EOS R5, 35mm f/1.4 lens. Slight film grain, subtle chromatic aberration on edges, natural lens vignetting. Minor dust particles visible in light shafts. Colors are slightly desaturated and muted — not oversaturated. White balance leans slightly warm. The image should feel like a professional photograph, not a 3D render.

AVOID: hyper-realistic, 8K, ultra HD, ultra-detailed, perfect lighting, CGI, 3D render, digital art, overly sharp, oversaturated, HDR look, stock photo aesthetic.

FINAL CHECK: If there is ANY product, bottle, can, package, or branded item visible in this image, you have FAILED. The frame must contain ONLY the environment."""

    contents.append(types.Part(text=prompt))

    try:
        rate_limiter.check(MODEL_NANO_BANANA)
        response = client.models.generate_content(
            model=MODEL_NANO_BANANA,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data
        raise RuntimeError("Nano Banana returned no image data for scene preview")
    except Exception as e:
        raise RuntimeError(f"Scene preview generation failed: {e}") from e


AD_FORMAT_LABELS = {
    "1:1": "Instagram square",
    "9:16": "Instagram Stories / Reels",
    "16:9": "YouTube / Banner",
}


def generate_images(
    prompt: str,
    reference_images: list[bytes],
    logo: bytes | None = None,
    formats: list[str] | None = None,
) -> list[dict]:
    """Generate multi-format ad images for the final campaign.

    Each format is a separate Nano Banana call with aspect ratio instructions
    in the prompt. ~10 seconds per call.

    Args:
        prompt: Full generation prompt from prompt_engine.py.
        reference_images: User's product photos for accuracy.
        logo: Optional brand logo bytes.
        formats: List of aspect ratios, e.g. ["1:1", "9:16", "16:9"].

    Returns:
        List of dicts: [{"format": "1:1", "label": "Instagram square", "data": bytes}, ...]
    """
    if formats is None:
        formats = ["1:1", "9:16", "16:9"]

    results = []

    for fmt in formats:
        label = AD_FORMAT_LABELS.get(fmt, fmt)

        contents = []

        for i, ref in enumerate(reference_images):
            contents.append(types.Part(text=f"[REFERENCE PHOTO {i + 1}]:"))
            contents.append(types.Part.from_bytes(data=ref, mime_type="image/png"))

        if logo:
            contents.append(types.Part(text="[BRAND LOGO]:"))
            contents.append(types.Part.from_bytes(data=logo, mime_type="image/png"))

        format_prompt = f"""{prompt}

Generate this as a {fmt} aspect ratio image suitable for {label}. The composition and framing must work naturally for this format.

{FRONT_LABEL_INSTRUCTION}

CRITICAL: The product must be visually identical to the reference photos — same shape, same label, same branding."""

        _log(f"\n=== PROMPT FOR {fmt} ({label}) ===")
        _log(format_prompt)
        _log("=================================\n")

        contents.append(types.Part(text=format_prompt))

        try:
            rate_limiter.check(MODEL_NANO_BANANA)
            response = client.models.generate_content(
                model=MODEL_NANO_BANANA,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    results.append({
                        "format": fmt,
                        "label": label,
                        "data": part.inline_data.data,
                    })
                    break
            else:
                print(f"Warning: no image returned for format {fmt}")
        except Exception as e:
            print(f"Warning: generation failed for format {fmt}: {e}")

    return results


def tweak_image(
    current_image: bytes,
    tweak_type: str,
    tweak_params: dict,
) -> bytes:
    """Apply a tweak to the current canvas image via Nano Banana.

    Args:
        current_image: Current canvas image bytes.
        tweak_type: One of "quick_tweak", "background", "position", "text_overlay".
        tweak_params: Dict with tweak details, e.g. {"action": "brighter"}.

    Returns:
        Modified image bytes.
    """
    tweak_prompts = {
        "quick_tweak": "Modify this image: {action}. Keep the product identical, only adjust the specified quality.",
        "background": "Replace the background of this image with: {action}. Keep the product exactly as-is in the foreground.",
        "position": "Reposition the product in this image: {action}. Keep the product and background the same.",
        "text_overlay": "Add text overlay to this image: {action}. Place it naturally without covering the product.",
    }

    template = tweak_prompts.get(tweak_type, "Modify this image: {action}")
    action = tweak_params.get("action", tweak_type)
    prompt = template.format(action=action)

    prompt = f"{prompt}\n\n{FRONT_LABEL_INSTRUCTION}"

    contents = [
        types.Part(text="[CURRENT IMAGE — modify this]:"),
        types.Part.from_bytes(data=current_image, mime_type="image/png"),
        types.Part(text=prompt),
    ]

    try:
        rate_limiter.check(MODEL_NANO_BANANA)
        response = client.models.generate_content(
            model=MODEL_NANO_BANANA,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            ),
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return part.inline_data.data
        raise RuntimeError("Nano Banana returned no image data for tweak")
    except Exception as e:
        raise RuntimeError(f"Image tweak failed: {e}") from e


def _get_treatment(ad: dict) -> str:
    """Extract visual treatment from art direction, handling inconsistent key names."""
    return (ad.get("visual_treatment")
            or ad.get("treatment")
            or ad.get("visual_direction")
            or "MISSING")


def _print_art_direction(index: int, ad: dict) -> None:
    """Print full art direction details for debugging."""
    print(f"\n--- Art Direction {index}: {ad.get('name', 'UNNAMED')} ---")
    print(f"  Palette:     {', '.join(ad.get('color_palette', {}).get('colors', []))}")
    print(f"  Reasoning:   {ad.get('color_palette', {}).get('reasoning', 'MISSING')}")
    print(f"  Treatment:   {_get_treatment(ad)}")
    print(f"  Audience:    {ad.get('target_audience', 'MISSING')}")
    print(f"  Tone:        {ad.get('campaign_tone', 'MISSING')}")
    frags = ad.get("prompt_fragments", {})
    print(f"  Nano prompt: {frags.get('nano_banana', 'MISSING')}")
    print(f"  Veo prompt:  {frags.get('veo', 'MISSING')}")
    print(f"  Lyria prompt: {frags.get('lyria', 'MISSING')}")
    if "MISSING" in str(ad):
        print(f"  [DEBUG] Raw keys: {list(ad.keys())}")


if __name__ == "__main__":
    from pathlib import Path
    from services.analyze_service import analyze_product

    _verbose = True  # Enable debug logging for CLI runs

    if len(sys.argv) < 2:
        print("Usage: python -m services.image_service <product_photo> [photo2] [--logo logo.png]")
        print("\nRuns the full pipeline: analyze → pick first art direction → generate preview")
        sys.exit(1)

    # Parse args
    photo_paths = []
    logo_path = None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--logo" and i + 1 < len(args):
            logo_path = Path(args[i + 1])
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

    # Step 1: Analyze
    print("Step 1: Analyzing product...\n")
    analysis = analyze_product(photos, logo_bytes)

    vp = analysis["visual_properties"]
    print("=== Visual Properties ===")
    print(f"  Colors:    {', '.join(vp['dominant_colors'])}")
    print(f"  Style:     {', '.join(vp['style_tags'])}")
    print(f"  Packaging: {vp['packaging_type']}")

    directions = analysis["art_directions"]
    for idx, ad in enumerate(directions, 1):
        _print_art_direction(idx, ad)

    # Step 2: Apply first art direction
    print(f"\n\nStep 2: Generating preview for '{directions[0]['name']}'...")
    preview = apply_art_direction(
        isolated_product=photos[0],
        art_direction=directions[0],
        reference_images=photos,
        logo=logo_bytes,
    )

    # Save output
    os.makedirs("outputs/test", exist_ok=True)
    out_path = "outputs/test/preview.png"
    Path(out_path).write_bytes(preview)
    print(f"\nPreview saved to {out_path}")
