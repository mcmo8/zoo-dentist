"""Per-patient playability smoke (connector-art back-test).

smoke_full.py drives all six visits in ONE page session; headless Chromium OOMs
on that long cumulative WebGL/image session around visit 3 (environmental, not a
game bug). This variant reloads between patients (resetting renderer memory) and
seeds a free-play save so every animal can be opened directly, then plays each to
its celebration. Reports COMPLETE/INCOMPLETE per patient + any console/page error.
"""
import sys
from playwright.sync_api import sync_playwright

VB_W, VB_H, TRAY_Y = 360, 560, 500
SLOTS = (108, 180, 252, 144, 216, 72, 288, 48, 312, 24, 336)
NAMES = ['Pip', 'Momo', 'Hugo', 'Ella', 'Snappy', 'Leo']
SEED = ('{"treated":{"bunny":1,"monkey":1,"hippo":1,"croc":1,"lion":1,'
        '"elephant":1},"totalVisits":6,"muted":true}')
errors = []
def p_(m): print(m, flush=True)

def svg_to_px(box, x, y):
    s = min(box['width'] / VB_W, box['height'] / VB_H)
    return (box['x'] + (box['width'] - VB_W * s) / 2 + x * s,
            box['y'] + (box['height'] - VB_H * s) / 2 + y * s)

# Tools act at the bristle/tip, ~56px ABOVE the cursor (TOOL_TIP_DY in Treatment.tsx),
# so to land a tool on a tooth the cursor must sit that far below the contact point.
TIP_DY = 56

def sweep(page, box):
    # sweep the CONTACT point across the teeth + mouth band (scene y ~150-320)
    for cy in range(150, 320, 26):
        for cx in range(60, 305, 40):
            px, py = svg_to_px(box, cx, cy + TIP_DY)
            page.mouse.move(px, py, steps=2); page.wait_for_timeout(55)

def play_visit(page):
    svg = page.locator('svg.zd-scene'); label = page.locator('.zd-steplabel')
    last, stuck = '', 0
    for _ in range(20):
        if label.count() == 0:
            break
        cur = label.inner_text(); box = svg.bounding_box()
        for sx in SLOTS:
            mx, my = svg_to_px(box, sx, TRAY_Y)
            page.mouse.move(mx, my); page.mouse.down(); sweep(page, box)
            page.mouse.up(); page.wait_for_timeout(820)
            if label.count() == 0 or label.inner_text() != cur:
                break
        if label.count() == 0:
            break
        if label.inner_text() == cur:
            stuck += 1
            if stuck >= 3:
                return False
        else:
            stuck = 0
    page.wait_for_timeout(1200)
    return page.locator('text=NEXT PATIENT').count() > 0

with sync_playwright() as pw:
    all_ok = True
    for name in NAMES:
        # fresh browser per patient: headless Chromium gets unstable across many
        # heavy treatment sessions in one process (the cumulative-crash above).
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 380, 'height': 760})
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script(f"localStorage.setItem('zoosmiles_save_v1', '{SEED}')")
        pg.goto('http://localhost:4173'); pg.wait_for_load_state('networkidle')
        pg.click('text=PLAY', force=True); pg.wait_for_timeout(400)
        pg.click(f'.zd-card:has-text("{name}")', force=True); pg.wait_for_timeout(500)
        ok = play_visit(pg)
        p_(f'{name:7s}: {"COMPLETE" if ok else "INCOMPLETE"}')
        all_ok &= ok
        b.close()

p_('ALL SIX PATIENTS COMPLETE' if all_ok else 'SOME PATIENTS INCOMPLETE')
p_(f'console/page errors: {errors if errors else "none"}')
sys.exit(0 if all_ok and not errors else 1)
