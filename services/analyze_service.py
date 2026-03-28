import json
import re
from google.genai import types
from services.gemini_client import client, rate_limiter
from config import MODEL_FLASH


ANALYSIS_PROMPT = """You are a creative director at a top advertising agency. Analyze this product image and any reference photos to produce art directions for an ad campaign.

Return a JSON object with this exact structure:
{
  "visual_properties": {
    "dominant_colors": ["#hex1", "#hex2", "#hex3"],
    "style_tags": ["tag1", "tag2", "tag3"],
    "packaging_type": "bottle|can|box|bag|tube|jar|pouch|other"
  },
  "art_directions": [
    {
      "name": "Short evocative direction name — a scene or concept, not an adjective",
      "color_palette": {
        "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
        "reasoning": "Name the color theory relationship (complementary, split-complementary, triadic, analogous). Explain WHY each new color works against the product's existing colors — not just 'it matches.'"
      },
      "visual_treatment": "Photographer-executable description: lighting type and direction, composition and framing, depth of field, specific props, camera angle, setting. Must tell a story — where is the product, what just happened or is about to happen, what is the emotional moment?",
      "target_audience": "Psychographic motivation — WHY this person buys the product, not just age/gender demographics. What need does it fulfill in their life?",
      "campaign_tone": "3-4 words",
      "prompt_fragments": {
        "nano_banana": "Detailed image generation prompt for this direction — include lighting, composition, setting, props, mood, and the product in context",
        "veo": "Video scene description — camera movement, pacing, setting, action, mood. 8 seconds of story. MUST include an exact visual description of the product (color, shape, packaging type, brand name, label details) so the video model renders the correct product without reference images.",
        "lyria": "Music genre, BPM, specific instruments, mood, energy level"
      }
    }
  ]
}

## The Three Rules — follow these strictly:

RULE 1 — Complementary, not matching.
Each palette MUST introduce at least 2 colors NOT already on the product. The reasoning MUST name the specific color theory relationship (complementary, split-complementary, triadic) and explain why the new colors create tension or harmony against the product's existing colors. "It matches the red" is not reasoning. "The slate blue (#2c3e50) sits opposite the can's warm red on the color wheel, creating visual tension that draws the eye" IS reasoning.

RULE 2 — Audience contrast through purchase motivation.
The directions must target audiences with different REASONS for buying — not just different demographics. Example: "buys this to power through a late-night coding session" vs. "buys this to recover after a morning workout." The visual direction, props, setting, and lighting must reflect that motivation difference. Putting the same can in two different pretty locations is NOT audience contrast.

RULE 3 — One safe, one unexpected.
Direction 1 is the obvious play — the direction the brand would probably do themselves. The expected context, the predictable audience.
Direction 2 is the "wait, that actually works?" angle — a context or visual treatment that REFRAMES the product entirely. Same product, completely different brand story. It should feel surprising but make total sense when you see it.
If generating a 3rd direction: it must be as specific and story-driven as the first two. A white/minimal studio backdrop is NEVER acceptable — it tells no story. Every direction must place the product in a real moment with real context.

RULE 4 — Veo and Lyria pacing must match.
The veo prompt fragment and lyria prompt fragment must have MATCHING PACING:
- If the video is slow/cinematic (slow pans, smooth tracking), the music must be low BPM (70-95), ambient, atmospheric
- If the video is medium energy (steady movement, reveal shots), the music must be mid BPM (95-115), rhythmic but not aggressive
- If the video is high energy (quick cuts, fast motion, dynamic camera), the music must be high BPM (115-140), driving and intense
State the pacing category explicitly in both the veo and lyria prompts so they align. A slow cinematic pan with 140 BPM punk rock is a failure. A fast-cut montage with 70 BPM ambient is a failure.

## Additional rules:
- Extract dominant colors from the actual product image, not guessed
- Generate exactly 3 art directions — no more, no less
- Visual treatments must be specific enough for a photographer to execute on the spot
- Prompt fragments must reference the actual product and place it in the scene described by the visual treatment
- Every direction must tell a story — who is using this product, when, why, and what does the moment feel like?"""


def analyze_product(
    product_photos: list[bytes],
    logo: bytes | None = None,
) -> dict:
    """Analyze product photos with Gemini Flash and generate art directions.

    Args:
        product_photos: 1-4 product images (different angles). First is primary.
        logo: Optional brand logo image bytes (kept separate from product photos).

    Returns:
        Dict with visual_properties and art_directions.
    """
    contents = []

    contents.append(types.Part(text=f"PRODUCT PHOTOS ({len(product_photos)} angle(s)):"))
    for i, photo in enumerate(product_photos):
        contents.append(types.Part(text=f"[Product angle {i + 1}]"))
        contents.append(types.Part.from_bytes(data=photo, mime_type="image/png"))

    if logo:
        contents.append(types.Part(text="[BRAND LOGO — not the product, this is their logo mark]:"))
        contents.append(types.Part.from_bytes(data=logo, mime_type="image/png"))

    contents.append(types.Part(text=ANALYSIS_PROMPT))

    try:
        rate_limiter.check(MODEL_FLASH)
        response = client.models.generate_content(
            model=MODEL_FLASH,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        raw = response.text
        # Strip trailing commas before } or ] (common LLM JSON error)
        raw = re.sub(r',\s*([}\]])', r'\1', raw)
        result = json.loads(raw)
        if isinstance(result, list):
            result = result[0]

        # Normalize art directions — fix inconsistent key names from the model
        def _normalize_key(d: dict, target: str, alts: tuple, default="") -> None:
            """Check alternative key names and normalize to target key."""
            if target not in d or not d[target]:
                for alt in alts:
                    if alt in d and d[alt]:
                        d[target] = d.pop(alt)
                        return
                d.setdefault(target, default)

        for ad in result.get("art_directions", []):
            _normalize_key(ad, "name", ("direction_name", "title", "direction"), "Unnamed Direction")
            _normalize_key(ad, "visual_treatment", ("treatment", "visual_direction", "scene", "setting"))
            _normalize_key(ad, "target_audience", ("audience", "target", "demographic", "demographics"))
            _normalize_key(ad, "campaign_tone", ("tone", "brand_tone", "mood", "voice"))
            _normalize_key(ad, "color_palette", ("palette", "colors", "color"), {"colors": [], "reasoning": ""})

            # Normalize prompt_fragments container
            _normalize_key(ad, "prompt_fragments", ("prompt_fragment", "prompts", "fragments"), {})

            # Normalize prompt fragment sub-keys
            frags = ad["prompt_fragments"]
            _normalize_key(frags, "nano_banana", ("imagen", "image", "image_prompt", "nano"))
            _normalize_key(frags, "veo", ("video", "video_prompt"))
            _normalize_key(frags, "lyria", ("music", "audio", "audio_prompt", "jingle"))

        # Ensure exactly 3 art directions
        directions = result.get("art_directions", [])
        if len(directions) < 3:
            raise RuntimeError(
                f"Model returned {len(directions)} art direction(s), need exactly 3. "
                "Retrying may produce better results."
            )

        return result
    except Exception as e:
        raise RuntimeError(f"Product analysis failed: {e}") from e


if __name__ == "__main__":
    import sys
    from pathlib import Path

    if len(sys.argv) < 2:
        print("Usage: python -m services.analyze_service <photo1> [photo2] [photo3] [--logo logo.png]")
        print("Example: python -m services.analyze_service front.png side.png --logo brand_logo.png")
        sys.exit(1)

    # Parse args: product photos come first, --logo separates the logo
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

    product_photos = []
    for p in photo_paths:
        if p.exists():
            product_photos.append(p.read_bytes())
        else:
            print(f"Warning: skipping missing photo {p}")

    if not product_photos:
        print("Error: no valid product photos provided")
        sys.exit(1)

    logo_bytes = None
    if logo_path:
        if logo_path.exists():
            logo_bytes = logo_path.read_bytes()
        else:
            print(f"Warning: logo not found at {logo_path}, continuing without it")

    print(f"Analyzing {len(product_photos)} product photo(s)" + (f" + logo" if logo_bytes else "") + "...\n")
    result = analyze_product(product_photos, logo_bytes)

    vp = result["visual_properties"]
    print(f"=== Visual Properties ===")
    print(f"  Colors:    {', '.join(vp['dominant_colors'])}")
    print(f"  Style:     {', '.join(vp['style_tags'])}")
    print(f"  Packaging: {vp['packaging_type']}")

    for i, ad in enumerate(result["art_directions"], 1):
        print(f"\n--- Art Direction {i}: {ad['name']} ---")
        print(f"  Palette:    {', '.join(ad['color_palette']['colors'])}")
        print(f"  Reasoning:  {ad['color_palette']['reasoning']}")
        print(f"  Treatment:  {ad['visual_treatment']}")
        print(f"  Audience:   {ad['target_audience']}")
        print(f"  Tone:       {ad['campaign_tone']}")
        print(f"  Nano prompt: {ad['prompt_fragments']['nano_banana']}")
        print(f"  Veo prompt:  {ad['prompt_fragments']['veo']}")
        print(f"  Lyria prompt: {ad['prompt_fragments']['lyria']}")
