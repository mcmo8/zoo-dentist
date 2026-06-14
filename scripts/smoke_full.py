"""Full playthrough: all 6 scripted visits in ONE session (every mechanic:
magnifier, spray, tweezers, brush, germ spray, drill, filler, shape puzzle, forceps,
implant, mouthwash).

NOTE: headless Chromium can OOM across six heavy treatment sessions in a single
process (environmental, not a game bug). scripts/smoke_each.py reloads a fresh browser
per patient and is the RELIABLE per-patient proxy + the authoritative check; prefer it.

Step 4 made tools PROGRESSIVE (a per-tooth work meter fills only while the tool tip,
~56px above the cursor, is held on a target). So this HOLDS/wiggles the tool on each
highlighted target ([data-tooth]:has(.zd-target)) until it clears, sweeps the mouth for
whole-mouth steps, and tries each tray piece for the chip puzzle — same driver as
smoke_each.py.
"""
import os
import time
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), '..', '.smoke')
os.makedirs(OUT, exist_ok=True)

VB_W, VB_H, TRAY_Y = 360, 560, 500
TIP_DY = 56  # cursor sits this far below the contact point (tool acts at cursor - 56)
errors = []


def svg_to_px(box, x, y):
    s = min(box['width'] / VB_W, box['height'] / VB_H)
    return (box['x'] + (box['width'] - VB_W * s) / 2 + x * s,
            box['y'] + (box['height'] - VB_H * s) / 2 + y * s)


def slot_x(slot, count):
    return VB_W / 2 + (slot - (count - 1) / 2) * min(72, 330 / max(1, count))


def label_text(label):
    try:
        if label.count() == 0:
            return ''
        return label.inner_text(timeout=500)
    except Exception:
        return ''


def work_targets(pg, label, cur, box):
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
            for k in range(26):
                pg.mouse.move(cx + ((k % 3) - 1) * 3, cy + TIP_DY)
                pg.wait_for_timeout(80)
                if label_text(label) != cur:
                    break
                if pg.locator('[data-tooth]:has(.zd-target)').count() < n:
                    break
        else:
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
                break
    pg.mouse.up()


def work_puzzle(pg, label, cur, box):
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
            for k in range(5):
                pg.mouse.move(tx + ((k % 3) - 1) * 4, ty + ((k % 2) * 4 - 2))
                pg.wait_for_timeout(70)
                if label_text(label) != cur:
                    pg.mouse.up()
                    return
            pg.mouse.up()
            pg.wait_for_timeout(260)
            if label_text(label) != cur:
                return


def run_visit(pg, svg, label, visit_no):
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
        if label_text(label) == cur:
            stuck += 1
            if stuck >= 3:
                pg.screenshot(path=f'{OUT}/v{visit_no}-stuck.png')
                print(f'VISIT {visit_no} STUCK on: {cur}')
                return False
        else:
            stuck = 0
    pg.wait_for_timeout(1200)
    ok = pg.locator('text=NEXT PATIENT').count() > 0
    print(f'VISIT {visit_no}: {"COMPLETE" if ok else "NO CELEBRATION"}')
    if ok:
        pg.click('text=NEXT PATIENT', force=True)
        pg.wait_for_timeout(450)
    return ok


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 360, 'height': 720})
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
        # the scripted-next patient is the only awake seat (aria-label "... needs help")
        target = page.locator('.zd-seat[aria-label*="needs help"]')
        if target.count() == 0:
            print('NO AWAKE PATIENT')
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
