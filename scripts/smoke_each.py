"""Per-patient playability smoke (connector-art back-test, meter-aware).

smoke_full.py drives all six visits in ONE page session; headless Chromium OOMs on
that long cumulative session. This variant reloads between patients (fresh renderer)
and seeds a free-play save so every animal can be opened directly, then plays each to
its celebration.

Step 4 made tools PROGRESSIVE (a per-tooth work meter fills only while the tool tip is
held on a target; the tip sits ~56px above the cursor — TOOL_TIP_DY). So the driver
HOLDS/wiggles the tool on each highlighted target ([data-tooth]:has(.zd-target)) until
it clears, sweeps the mouth for whole-mouth steps (look/rinse), and tries each tray
piece for the chip puzzle. Reports COMPLETE/INCOMPLETE per patient + any console error.
"""
import sys
import time
from playwright.sync_api import sync_playwright

VB_W, VB_H, TRAY_Y = 360, 560, 500
TIP_DY = 56  # cursor sits this far below the contact point (tool acts at cursor - 56)
# The lobby seats 4 of 6 and rotates the dual-candidate chairs by visit parity:
# even -> bunny/monkey/hippo/lion ; odd -> croc/monkey/hippo/elephant. Pick a
# totalVisits parity that seats each target, then tap its seat by aria-label.
ROSTER = [('Pip', 6), ('Momo', 6), ('Hugo', 6), ('Ella', 7), ('Snappy', 7), ('Leo', 6)]
SEED_TMPL = ('{{"treated":{{"bunny":1,"monkey":1,"hippo":1,"croc":1,"lion":1,'
             '"elephant":1}},"totalVisits":{tv},"muted":true}}')
errors = []
def p_(m): print(m, flush=True)

def svg_to_px(box, x, y):
    s = min(box['width'] / VB_W, box['height'] / VB_H)
    return (box['x'] + (box['width'] - VB_W * s) / 2 + x * s,
            box['y'] + (box['height'] - VB_H * s) / 2 + y * s)

def slot_x(slot, count):
    return VB_W / 2 + (slot - (count - 1) / 2) * min(72, 330 / max(1, count))

def label_text(label):
    # short-timeout, never-throw read (the label detaches at the celebration
    # transition; a bare inner_text() would auto-wait the full 30s and time out)
    try:
        if label.count() == 0:
            return ''
        return label.inner_text(timeout=500)
    except Exception:
        return ''

def work_targets(pg, label, cur, box):
    """Tool held down: hold/wiggle on each highlighted target until the step changes."""
    bn = pg.locator('.zd-bounce').first
    if bn.count() == 0:
        return
    bb = bn.bounding_box()
    pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    pg.mouse.down()
    t0 = time.time()
    while label_text(label) == cur and time.time() - t0 < 8:
        tg = pg.locator('[data-tooth]:has(.zd-target)')
        n = tg.count()
        if n > 0:
            tb = tg.first.bounding_box()
            if not tb:
                break
            cx, cy = tb['x'] + tb['width'] / 2, tb['y'] + tb['height'] / 2
            for k in range(26):  # hold ~2s, small wiggle keeps contact on the tooth
                pg.mouse.move(cx + ((k % 3) - 1) * 3, cy + TIP_DY)
                pg.wait_for_timeout(80)
                if label_text(label) != cur:
                    break
                if pg.locator('[data-tooth]:has(.zd-target)').count() < n:
                    break  # this target cleared -> re-pick
        else:
            # whole-mouth (look / rinse): sweep the mouth band, contact offset applied
            swept = False
            for gy in range(160, 300, 26):
                for gx in range(80, 285, 36):
                    px, py = svg_to_px(box, gx, gy + TIP_DY)
                    pg.mouse.move(px, py)
                    pg.wait_for_timeout(50)
                    if label_text(label) != cur:
                        swept = True
                        break
                if swept:
                    break
            if not swept and label_text(label) == cur:
                break  # nothing to do and not advancing
    pg.mouse.up()

def work_puzzle(pg, label, cur, box):
    """Chip puzzle: drag each tray piece onto the highlighted smoothed tooth. The
    matching shape snaps on proximity, so wiggle on the tooth; try each piece twice."""
    tg = pg.locator('[data-tooth]:has(.zd-target)')
    if tg.count() == 0:
        return
    tb = tg.first.bounding_box()
    tx, ty = tb['x'] + tb['width'] / 2, tb['y'] + tb['height'] / 2
    for _ in range(2):
        for slot in range(3):
            sx, sy = svg_to_px(box, slot_x(slot, 3), TRAY_Y)
            pg.mouse.move(sx, sy)
            pg.mouse.down()
            pg.mouse.move(tx, ty, steps=6)
            for k in range(5):  # wiggle on the tooth so the proximity snap fires
                pg.mouse.move(tx + ((k % 3) - 1) * 4, ty + ((k % 2) * 4 - 2))
                pg.wait_for_timeout(70)
                if label_text(label) != cur:
                    pg.mouse.up()
                    return
            pg.mouse.up()
            pg.wait_for_timeout(260)
            if label_text(label) != cur:
                return

def play_visit(pg):
    svg = pg.locator('svg.zd-scene')
    label = pg.locator('.zd-steplabel')
    stuck = 0
    for _ in range(26):
        cur = label_text(label)
        if cur == '':
            break
        box = svg.bounding_box()
        if 'piece' in cur.lower():
            work_puzzle(pg, label, cur, box)
        else:
            work_targets(pg, label, cur, box)
        if label.count() == 0:
            break
        if label_text(label) == cur:
            stuck += 1
            if stuck >= 3:
                p_(f'    (stuck on: {cur})')
                return False
        else:
            stuck = 0
    pg.wait_for_timeout(1200)
    return pg.locator('text=NEXT PATIENT').count() > 0

with sync_playwright() as pw:
    all_ok = True
    for name, tv in ROSTER:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 360, 'height': 720})
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script(f"localStorage.setItem('zoosmiles_save_v1', '{SEED_TMPL.format(tv=tv)}')")
        pg.goto('http://localhost:4173'); pg.wait_for_load_state('networkidle')
        pg.click('text=PLAY', force=True); pg.wait_for_timeout(400)
        pg.click(f'.zd-seat[aria-label^="{name}"]', force=True); pg.wait_for_timeout(600)
        ok = play_visit(pg)
        p_(f'{name:7s}: {"COMPLETE" if ok else "INCOMPLETE"}')
        all_ok &= ok
        b.close()

p_('ALL SIX PATIENTS COMPLETE' if all_ok else 'SOME PATIENTS INCOMPLETE')
p_(f'console/page errors: {errors if errors else "none"}')
sys.exit(0 if all_ok and not errors else 1)
