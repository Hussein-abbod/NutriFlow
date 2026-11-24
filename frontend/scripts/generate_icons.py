"""
Generate the PWA icons in public/icons from the Flutter app logo
(mobile/assets/images/logo.png, 1024 x 1024). Run from frontend/:

    python scripts/generate_icons.py

Needs Pillow (`pip install pillow`). The output is committed, so this only has to run
again when the logo changes.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "mobile" / "assets" / "images" / "logo.png"
OUT = ROOT / "frontend" / "public" / "icons"

ANY_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
MASKABLE_SIZES = [192, 512]
BRAND_GREEN = (0, 109, 54, 255)  # --brand-primary #006D36
APPLE_BACKGROUND = (255, 255, 255, 255)
# Maskable icons may be cropped to a circle of 80 % of their size; the logo's own circle
# (about 92 % of the image) is scaled to stay well inside it.
MASKABLE_LOGO_SCALE = 0.78


def resized(logo: Image.Image, size: int) -> Image.Image:
    return logo.resize((size, size), Image.Resampling.LANCZOS)


def on_background(logo: Image.Image, size: int, background, scale: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background)
    inner = round(size * scale)
    offset = (size - inner) // 2
    canvas.alpha_composite(resized(logo, inner), (offset, offset))
    return canvas


def main() -> None:
    logo = Image.open(SOURCE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    for size in ANY_SIZES:
        resized(logo, size).save(OUT / f"icon-{size}.png", optimize=True)
    for size in MASKABLE_SIZES:
        on_background(logo, size, BRAND_GREEN, MASKABLE_LOGO_SCALE).save(
            OUT / f"icon-maskable-{size}.png", optimize=True
        )
    # iOS ignores transparency (it would turn black): white background, no padding.
    on_background(logo, 180, APPLE_BACKGROUND, 1.0).convert("RGB").save(
        OUT / "apple-touch-icon.png", optimize=True
    )
    resized(logo, 64).save(ROOT / "frontend" / "public" / "favicon.png", optimize=True)


if __name__ == "__main__":
    main()
