"""Generate icon-192.png and icon-512.png for Zoo Smiles (original art).
Supersampled drawing of the favicon motif: smiling tooth + sparkle + paw
on a sky-blue rounded square. Run from zoo-dental/: python scripts/gen_icons.py
"""
from PIL import Image, ImageDraw

SS = 4  # supersample factor


def draw_icon(size: int) -> Image.Image:
    s = size * SS
    u = s / 64.0  # favicon viewBox units -> pixels
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # rounded square background
    d.rounded_rectangle([2 * u, 2 * u, 62 * u, 62 * u], radius=14 * u,
                        fill=(55, 181, 232, 255))

    ink = (29, 53, 87, 255)
    white = (255, 255, 255, 255)

    # tooth crown: wide rounded body, two short root lobes
    d.rounded_rectangle([17 * u, 10 * u, 47 * u, 36 * u], radius=12 * u,
                        fill=white, outline=ink, width=int(2.5 * u))
    # roots (two stubby rounded prongs)
    d.rounded_rectangle([21 * u, 30 * u, 31.5 * u, 46 * u], radius=5 * u,
                        fill=white, outline=ink, width=int(2.5 * u))
    d.rounded_rectangle([32.5 * u, 30 * u, 43 * u, 46 * u], radius=5 * u,
                        fill=white, outline=ink, width=int(2.5 * u))
    # patch the joint between crown and roots
    d.rectangle([21 * u + 2.5 * u, 28 * u, 43 * u - 2.5 * u, 34 * u], fill=white)

    # face
    r = 2.1 * u
    d.ellipse([26.5 * u - r, 20 * u - r, 26.5 * u + r, 20 * u + r], fill=ink)
    d.ellipse([37.5 * u - r, 20 * u - r, 37.5 * u + r, 20 * u + r], fill=ink)
    d.arc([26.5 * u, 20 * u, 37.5 * u, 29 * u], start=20, end=160,
          fill=ink, width=int(2 * u))

    # sparkle (4-point star)
    cx, cy, sr = 50 * u, 15 * u, 5 * u
    d.polygon([(cx, cy - sr), (cx + sr * 0.3, cy - sr * 0.3), (cx + sr, cy),
               (cx + sr * 0.3, cy + sr * 0.3), (cx, cy + sr),
               (cx - sr * 0.3, cy + sr * 0.3), (cx - sr, cy),
               (cx - sr * 0.3, cy - sr * 0.3)], fill=(255, 224, 102, 255))

    # paw print
    d.ellipse([10.6 * u, 49.2 * u, 17.4 * u, 54.8 * u], fill=ink)
    for px in (10, 14, 18):
        d.ellipse([(px - 1.5) * u, (46 if px != 14 else 44.6) * u,
                   (px + 1.5) * u, (49 if px != 14 else 47.6) * u], fill=ink)

    return img.resize((size, size), Image.LANCZOS)


for sz in (192, 512):
    draw_icon(sz).save(f"public/icon-{sz}.png")
    print(f"wrote public/icon-{sz}.png")
