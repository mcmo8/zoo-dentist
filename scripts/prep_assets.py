"""Asset prep for the connector-art integration (one-time, re-runnable).

The ChatGPT->Adobe pipeline baked an OPAQUE white background into the cut art,
which cannot composite over the room backgrounds. This script makes every art
asset transparent and tightly framed, reading from a pristine `_raw/` backup so
it is idempotent:

  - animals/*.svg, tools/*.svg : drop the first <path> (the full-canvas white
    background rect) and tighten the viewBox to the art's bbox (headless getBBox).
  - effects/item_*.webp        : flood-fill near-white from the borders to alpha
    (interior whites stay, enclosed by dark outlines), crop to content + pad.
  - teeth/item_*.webp          : already transparent -> left untouched.

Originals are preserved under each folder's `_raw/`. Run:  python scripts/prep_assets.py
Requires: pillow, playwright (both already used by this repo's tooling).
"""
import pathlib, re, shutil
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'

ANIMALS = ['bunny', 'lion', 'elephant', 'hippo', 'monkey', 'croc', 'tiger', 'giraffe']
TOOLS = ['drill', 'brush', 'toothpaste', 'mirror', 'scaler', 'pick',
         'electric-drill', 'floss', 'polisher', 'forceps', 'cup', 'applicator']
EFFECTS = list(range(1, 13))            # 1..12 (white bg on most, sparkle=12 already clear)
WHITE_FIRST = re.compile(r'<path\s+fill="(?:#fefefe|#fff|#ffffff)"[^>]*?/>', re.I)


def backup(folder: str, name: str) -> pathlib.Path:
    """Copy the live file into _raw/ once; return the pristine source path."""
    raw_dir = ASSETS / folder / '_raw'
    raw_dir.mkdir(exist_ok=True)
    live = ASSETS / folder / name
    raw = raw_dir / name
    if not raw.exists():
        shutil.copy2(live, raw)
    return raw


def strip_white_bg(svg: str) -> str:
    """Remove the first pure-white path (the baked background rectangle)."""
    return WHITE_FIRST.sub('', svg, count=1)


# ---------- effects: raster white-bg removal ----------

def remove_white_bg_webp(src: pathlib.Path, dst: pathlib.Path, thresh=238, pad=8):
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    px = im.load()

    def near_white(p):
        r, g, b, a = p
        return a > 0 and r >= thresh and g >= thresh and b >= thresh

    # BFS flood-fill from the border. The fill PASSES THROUGH already-transparent
    # pixels (so an art with a transparent margin + an inner white frame still
    # gets cleared) and ZEROES any near-white opaque pixel it reaches. Pixels
    # that are neither transparent nor near-white are real art and block it.
    stack = []
    for x in range(w):
        stack.append((x, 0)); stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y)); stack.append((w - 1, y))
    seen = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        transparent = a <= 20
        white = near_white((r, g, b, a))
        if not (transparent or white):
            continue                       # real art edge -> stop here
        if white:
            px[x, y] = (0, 0, 0, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    bbox = im.getchannel('A').getbbox()
    if bbox:
        l, t, r, b = bbox
        l, t = max(0, l - pad), max(0, t - pad)
        r, b = min(w, r + pad), min(h, b + pad)
        im = im.crop((l, t, r, b))
    im.save(dst, 'WEBP', quality=90, method=6)


def prep_effects():
    # Flood-fill is a no-op where the border isn't near-white, so it is safe to
    # run on every effect (incl. the sparkle, whose bg turned out NOT to be clear).
    for i in EFFECTS:
        name = f'item_{i}.webp'
        raw = backup('effects', name)
        live = ASSETS / 'effects' / name
        remove_white_bg_webp(raw, live)
        print(f'  effects/{name}: white bg removed + cropped')


# ---------- animals + tools: SVG strip + tight viewBox ----------

def prep_svgs(page):
    for folder, names in [('animals', ANIMALS), ('tools', TOOLS)]:
        for n in names:
            name = f'{n}.svg'
            raw = backup(folder, name)
            stripped = strip_white_bg(raw.read_text(encoding='utf-8'))
            page.set_content(stripped)
            page.wait_for_timeout(40)
            bb = page.evaluate(
                "() => { const b = document.querySelector('svg').getBBox();"
                "return {x:b.x, y:b.y, w:b.width, h:b.height}; }"
            )
            x = max(0, bb['x'] - 1); y = max(0, bb['y'] - 1)
            vw = bb['w'] + 2; vh = bb['h'] + 2
            # rewrite the opening <svg ...> with a tight viewBox + intrinsic size
            out = re.sub(
                r'<svg\b[^>]*>',
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'viewBox="{x:.1f} {y:.1f} {vw:.1f} {vh:.1f}" '
                f'width="{vw:.0f}" height="{vh:.0f}">',
                stripped, count=1,
            )
            (ASSETS / folder / name).write_text(out, encoding='utf-8')
            print(f'  {folder}/{name}: bg stripped, viewBox -> '
                  f'{x:.0f} {y:.0f} {vw:.0f} {vh:.0f}')


def main():
    print('Effects (raster white-bg removal):')
    prep_effects()
    print('Teeth: transparent already, left untouched.')
    print('Animals + tools (SVG strip + tight viewBox):')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        prep_svgs(pg)
        b.close()
    print('Done.')


if __name__ == '__main__':
    main()
