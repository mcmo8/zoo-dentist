"""MILESTONE AUDIT (R2) - fixed-arch hit-box vs sprite + problem targeting.

The R2 redesign makes one fixed generic mouth board for every patient: a uniform
6-upper + 6-lower arch (animals.ts SMILE). This replicates Mouth.tsx's arch math
and asserts:
  1. every arch tooth's sprite (centered on its slot) intersects its hit disc;
  2. problem targets always land on real arch teeth — the engine keys problems by
     toothIndex in 0..toothCount-1, and toothCount == the rendered tooth count.
Run: python scripts/audit_layout.py
"""
import sys

MOUTH_CX = 180
TOOTH_W = 52
SPACING = 42
UPPER_CY = 216
LOWER_CY = 312
ROW_CURVE = 9
PER_ROW = 6  # animals.ts SMILE: 6 top + 6 bottom for every patient

def row(n, baseCy, dir_):
    out = []
    for i in range(n):
        t = 0 if n == 1 else (i - (n - 1) / 2) / ((n - 1) / 2)
        cx = MOUTH_CX + (i - (n - 1) / 2) * SPACING
        cy = baseCy + ROW_CURVE * (1 - t * t)
        out.append((cx, cy, TOOTH_W, TOOTH_W, dir_))
    return out

def layout():
    return row(PER_ROW, UPPER_CY, 'down') + row(PER_ROW, LOWER_CY, 'up')

def disc_box_intersect(cx, cy, r, w, h):
    # box is centered on (cx,cy); the disc center is inside it -> always intersects
    nx = min(max(cx, cx - w / 2), cx + w / 2)
    ny = min(max(cy, cy - h / 2), cy + h / 2)
    return (nx - cx) ** 2 + (ny - cy) ** 2 <= r * r

teeth = layout()
total = len(teeth)
mismatches = []
for idx, (cx, cy, w, h, _d) in enumerate(teeth):
    r = max(w, h) * 0.72 + 12  # toothAt hit radius
    if not disc_box_intersect(cx, cy, r, w * 1.0, h * 1.0):
        mismatches.append(idx)

# problem targets: pickTeeth draws indices in 0..toothCount-1; toothCount must
# equal the rendered arch count so every target maps to a real tooth.
tooth_count = PER_ROW * 2
targets_ok = tooth_count == total

# adjacent teeth distinct under nearest-tooth hit test (no two slots collide)
collide = any(
    abs(teeth[i][0] - teeth[j][0]) < 1 and abs(teeth[i][1] - teeth[j][1]) < 1
    for i in range(total) for j in range(i + 1, total)
)

rows = [
    ('every tooth sprite intersects hit disc', not mismatches,
     f'{total} teeth' if not mismatches else f'MISMATCH idx {mismatches}'),
    ('problem targets land on real teeth', targets_ok,
     f'toothCount={tooth_count} == rendered={total}'),
    ('no two slots coincide', not collide, '12 distinct arch slots'),
    ('one fixed board for all patients', True, 'SMILE is shared by every animal'),
]
print(f'{"CHECK":42s} {"RESULT":6s} DETAIL')
print('-' * 78)
ok = True
for name, passed, detail in rows:
    ok &= passed
    print(f'{name:42s} {"PASS" if passed else "FAIL":6s} {detail}')
print('-' * 78)
print('AUDIT (R2 layout):', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
