"""Generate the Tabuline app mark, favicon and Apple touch icon.

The mark is the product's identity tile: a deep-cobalt rounded square with a
vertical tide gradient, a white monogram, a single accent dot and three
concentric tide rings behind the letter. It is drawn at 4x and downsampled so
the glyph edges and hairlines stay crisp at 512 px and 180 px.

Usage:
    python website/scripts/make-mark.py [--out DIR]

Outputs (default: project root):
    .rebrand/generated/website/public/mark.png        512x512
    .rebrand/generated/website/public/icon.png        512x512
    .rebrand/generated/website/public/apple-icon.png  180x180
"""

from __future__ import annotations

import argparse
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCALE = 4  # supersampling factor
BASE = 512  # logical size of the master tile

TOP = (43, 137, 249)  # #2b89f9
BOTTOM = (8, 78, 160)  # #084ea0
LETTER = (255, 255, 255)
RING = (255, 255, 255, 150)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\segoeuisl.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES:
        if pathlib.Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def build_master() -> Image.Image:
    size = BASE * SCALE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # Vertical gradient, full bleed.
    gradient = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(gradient)
    for y in range(size):
        draw.line([(0, y), (size, y)], fill=lerp(TOP, BOTTOM, y / (size - 1)))
    gradient = gradient.convert("RGBA")

    # Rounded-square mask (radius 21.3% of the tile, as in the previous mark).
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=round(size * 0.213), fill=255
    )

    # Tide rings behind the letter, clipped to the tile.
    rings = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(rings)
    cx, cy = size / 2, size * 1.0
    stroke = max(2, round(size * 0.0042))
    for ratio in (0.30, 0.345, 0.39):
        r = size * ratio
        ring_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r], outline=RING, width=stroke
        )
    rings.putalpha(Image.composite(rings.getchannel("A"), Image.new("L", (size, size), 0), mask))

    tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tile.paste(gradient, (0, 0), mask)
    tile = Image.alpha_composite(tile, rings)

    # Monogram: cap height ~38% of the tile, baseline at 65.4%.
    font = load_font(round(size * 0.536))  # cap height ~0.375 of the tile
    draw = ImageDraw.Draw(tile)
    draw.text(
        (size / 2, size * 0.652),
        "T",
        font=font,
        fill=LETTER,
        anchor="ms",
    )

    # Accent dot, upper right, clear of the monogram.
    dot_r = size * 0.0342
    dot_cx, dot_cy = size * 0.7635, size * 0.2344
    draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=LETTER
    )
    return tile


def save(master: Image.Image, target: pathlib.Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    resized = master.resize((size, size), Image.LANCZOS)
    resized.save(target, "PNG", optimize=True)
    print(f"  {target.relative_to(ROOT)}  {size}x{size}  {target.stat().st_size / 1024:.1f} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(ROOT / ".rebrand" / "generated" / "website" / "public"))
    args = parser.parse_args()
    out = pathlib.Path(args.out).resolve()

    master = build_master()
    for name, size in (("mark.png", 512), ("icon.png", 512), ("apple-icon.png", 180)):
        save(master, out / name, size)


if __name__ == "__main__":
    main()

