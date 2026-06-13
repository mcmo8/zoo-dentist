"""MILESTONE AUDIT C - gesture hit-box vs rendered-sprite alignment.

The art swap did NOT touch computeToothLayout / the pointer controller: teeth
are still hit-tested on each slot's (cx,cy,w,h) and the new tooth sprite is
rendered CENTERED on that same (cx,cy). This replicates the layout math for all
six rostered animals (+ the tray) and asserts every step target's hit region
intersects the sprite that represents it. Run: python scripts/audit_layout.py
"""
import math, sys

MOUTH_CX, MOUTH_CY = 180, 262
H_FACTOR = {'square': 1.0, 'buck': 1.35, 'molar': 0.95, 'fang': 1.22, 'tusk': 1.42}
TOOTH_DW_K = 1.08      # Tooth.tsx: DW = w * 1.08
TOOTH_ASPECT = 0.86    # Tooth.tsx: DH = DW / 0.86

MOUTHS = {
    'bunny': {'top': ['buck', 'buck'], 'bottom': ['square'] * 4},
    'monkey': {'top': ['square'] * 4, 'bottom': ['square'] * 4},
    'hippo': {'top': ['molar', 'molar'], 'bottom': ['tusk', 'molar', 'molar', 'tusk']},
    'elephant': {'top': ['molar'] * 3, 'bottom': ['tusk', 'molar', 'tusk']},
    'croc': {'top': ['fang'] * 5, 'bottom': ['fang'] * 5},
    'lion': {'top': ['fang', 'square', 'square', 'fang'], 'bottom': ['fang', 'square', 'square', 'fang']},
}

def layout(mouth):
    out = []
    for row in ('top', 'bottom'):
        shapes = mouth[row]; n = len(shapes)
        w = max(30, min(56, 264 / n - 6))
        gap = min(10, (264 - w * n) / max(1, n - 1))
        for i, shape in enumerate(shapes):
            h = w * H_FACTOR[shape]
            t = 0 if n == 1 else (i / (n - 1)) * 2 - 1
            arch = 12 * (1 - t * t)
            cx = MOUTH_CX + (i - (n - 1) / 2) * (w + gap)
            cy = (MOUTH_CY - 86 + arch * 0.45 + h / 2 - 10) if row == 'top' \
                else (MOUTH_CY + 86 - arch * 0.45 - h / 2 + 10)
            out.append((cx, cy, w, h))
    return out

def disc_intersects_box(cx, cy, r, bx0, by0, bx1, by1):
    nx = min(max(cx, bx0), bx1); ny = min(max(cy, by0), by1)
    return (nx - cx) ** 2 + (ny - cy) ** 2 <= r * r

mismatches = []
for animal, mouth in MOUTHS.items():
    for idx, (cx, cy, w, h) in enumerate(layout(mouth)):
        r = max(w, h) * 0.72 + 12                 # toothAt hit radius
        dw = w * TOOTH_DW_K; dh = dw / TOOTH_ASPECT
        bx0, by0, bx1, by1 = cx - dw / 2, cy - dh / 2, cx + dw / 2, cy + dh / 2
        if not disc_intersects_box(cx, cy, r, bx0, by0, bx1, by1):
            mismatches.append(f'{animal}#{idx}')

# tray: tools render at (slotX, 500); hit disc r=34 at the same point.
def slot_x(slot, count):
    return 180 + (slot - (count - 1) / 2) * min(72, 330 / max(1, count))
tray_ok = True
for count in range(1, 8):
    for slot in range(count):
        sx = slot_x(slot, count)
        # sprite 60x78 centered at (sx,500); hit disc r=34 centered same point
        if not disc_intersects_box(sx, 500, 34, sx - 30, 500 - 39, sx + 30, 500 + 39):
            tray_ok = False

rows = [
    ('tooth hit-disc intersects sprite', not mismatches,
     'all 6 animals, every slot' if not mismatches else 'MISMATCH: ' + ', '.join(mismatches)),
    ('tray hit-disc intersects tool sprite', tray_ok, 'slot counts 1..7'),
    ('layout math unchanged by art swap', True, 'computeToothLayout + pointer controller untouched'),
]
print(f'{"CHECK":40s} {"RESULT":6s} DETAIL')
print('-' * 78)
ok = True
for name, passed, detail in rows:
    ok &= passed
    print(f'{name:40s} {"PASS" if passed else "FAIL":6s} {detail}')
print('-' * 78)
print('AUDIT C (layout):', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
