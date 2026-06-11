"""Full playthrough: all 6 scripted visits (every mechanic: magnifier, spray,
tweezers, brush, germ spray, drill, filler, shape puzzle, forceps, implant,
mouthwash). Slots are tried left-to-right; wrong tools are inert by design."""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), '..', '.smoke')
os.makedirs(OUT, exist_ok=True)

VB_W, VB_H, TRAY_Y = 360, 560, 500
SLOTS = (72, 48, 108, 114, 144, 180, 216, 246, 252, 288, 312)
errors = []


def svg_to_px(box, x, y):
    scale = min(box['width'] / VB_W, box['height'] / VB_H)
    ox = (box['width'] - VB_W * scale) / 2
    oy = (box['height'] - VB_H * scale) / 2
    return box['x'] + ox + x * scale, box['y'] + oy + y * scale


def sweep_mouth(page, box, passes=2):
    for _ in range(passes):
        for gy in range(170, 360, 45):
            for gx in range(60, 320, 50):
                px, py = svg_to_px(box, gx, gy)
                page.mouse.move(px, py, steps=3)
                page.wait_for_timeout(120)


def run_visit(page, svg, label, visit_no):
    page.screenshot(path=f'{OUT}/v{visit_no}-start.png')
    for round_no in range(14):
        if label.count() == 0:
            break
        before = label.inner_text()
        box = svg.bounding_box()
        for slot_x in SLOTS:
            sx, sy = svg_to_px(box, slot_x, TRAY_Y)
            page.mouse.move(sx, sy)
            page.mouse.down()
            sweep_mouth(page, box)
            page.mouse.up()
            page.wait_for_timeout(950)
            if label.count() == 0 or label.inner_text() != before:
                break
        if label.count() == 0:
            break
        if label.inner_text() == before:
            page.screenshot(path=f'{OUT}/v{visit_no}-stuck.png')
            print(f'VISIT {visit_no} STUCK on: {before}')
            return False
    page.wait_for_timeout(1300)
    ok = page.locator('text=NEXT PATIENT').count() > 0
    page.screenshot(path=f'{OUT}/v{visit_no}-end.png')
    print(f'VISIT {visit_no}: {"COMPLETE" if ok else "NO CELEBRATION"}')
    if ok:
        page.click('text=NEXT PATIENT', force=True)
        page.wait_for_timeout(450)
    return ok


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 380, 'height': 760})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto('http://localhost:4173')
    page.wait_for_load_state('networkidle')
    page.click('text=PLAY', force=True)
    page.wait_for_timeout(400)

    svg = page.locator('svg.zd-scene')
    label = page.locator('.zd-steplabel')

    all_ok = True
    for visit_no in range(1, 7):
        target = page.locator('.zd-card-next')
        if target.count() == 0:
            target = page.locator('.zd-card:not(.zd-card-locked)')
        if target.count() == 0:
            print('NO PATIENT AVAILABLE')
            all_ok = False
            break
        target.first.click(force=True)
        page.wait_for_timeout(500)
        if not run_visit(page, svg, label, visit_no):
            all_ok = False
            break

    page.screenshot(path=f'{OUT}/final-lobby.png')
    browser.close()

print('ALL SIX VISITS PASSED' if all_ok else 'PLAYTHROUGH INCOMPLETE')
print('console errors:', errors if errors else 'none')
