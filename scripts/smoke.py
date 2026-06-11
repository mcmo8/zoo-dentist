"""Smoke test: title -> lobby -> bunny visit (3 steps) -> celebrate -> lobby.
Drives the SVG scene with mouse drags; tray slots are tried left-to-right
(wrong tools are inert by design, so extra attempts are harmless)."""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), '..', '.smoke')
os.makedirs(OUT, exist_ok=True)

VB_W, VB_H, TRAY_Y = 360, 560, 500
errors = []


def svg_to_px(box, x, y):
    scale = min(box['width'] / VB_W, box['height'] / VB_H)
    ox = (box['width'] - VB_W * scale) / 2
    oy = (box['height'] - VB_H * scale) / 2
    return box['x'] + ox + x * scale, box['y'] + oy + y * scale


def sweep_mouth(page, box):
    """Grid sweep across the mouth area with pauses so dwell ticks count."""
    for gy in range(170, 360, 45):
        for gx in range(60, 320, 50):
            px, py = svg_to_px(box, gx, gy)
            page.mouse.move(px, py, steps=4)
            page.wait_for_timeout(140)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 380, 'height': 760})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto('http://localhost:4173')
    page.wait_for_load_state('networkidle')
    page.screenshot(path=f'{OUT}/01-title.png')

    # force: the buttons run infinite "breathe" animations by design
    page.click('text=PLAY', force=True)
    page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/02-lobby.png')

    # bunny is the only awake patient on a fresh save
    page.click('.zd-card:not(.zd-card-locked)', force=True)
    page.wait_for_timeout(500)
    page.screenshot(path=f'{OUT}/03-treat-start.png')

    svg = page.locator('svg.zd-scene')
    label = page.locator('.zd-steplabel')

    for round_no in range(8):
        if label.count() == 0:
            break  # left the treatment screen
        before = label.inner_text()
        box = svg.bounding_box()
        for slot_x in (108, 144, 180, 216, 252):
            sx, sy = svg_to_px(box, slot_x, TRAY_Y)
            page.mouse.move(sx, sy)
            page.mouse.down()
            sweep_mouth(page, box)
            page.mouse.up()
            page.wait_for_timeout(900)  # step-advance transition
            if label.count() == 0 or label.inner_text() != before:
                break
        page.screenshot(path=f'{OUT}/04-treat-round{round_no}.png')
        if label.count() == 0:
            break
        if label.inner_text() == before:
            print(f'STUCK on step: {before}')
            break

    page.wait_for_timeout(1200)
    page.screenshot(path=f'{OUT}/05-after-treat.png')
    if page.locator('text=NEXT PATIENT').count():
        print('CELEBRATION 1 REACHED')
        page.click('text=NEXT PATIENT', force=True)
        page.wait_for_timeout(400)
        page.screenshot(path=f'{OUT}/06-lobby-after.png')
    else:
        print('CELEBRATION 1 NOT REACHED')

    # second visit: monkey (plaque scrub + stinky breath -> mouthwash)
    if page.locator('.zd-card:not(.zd-card-locked)').count():
        page.click('.zd-card-next', force=True)
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT}/07-treat2-start.png')
        for round_no in range(10):
            if label.count() == 0:
                break
            before = label.inner_text()
            box = svg.bounding_box()
            for slot_x in (48, 72, 108, 114, 144, 180, 216, 246, 252, 288, 312):
                sx, sy = svg_to_px(box, slot_x, TRAY_Y)
                page.mouse.move(sx, sy)
                page.mouse.down()
                sweep_mouth(page, box)
                sweep_mouth(page, box)  # extra pass for scrub distance
                page.mouse.up()
                page.wait_for_timeout(900)
                if label.count() == 0 or label.inner_text() != before:
                    break
            page.screenshot(path=f'{OUT}/08-treat2-round{round_no}.png')
            if label.count() == 0:
                break
            if label.inner_text() == before:
                print(f'VISIT2 STUCK on step: {before}')
                break
        page.wait_for_timeout(1200)
        if page.locator('text=NEXT PATIENT').count():
            print('CELEBRATION 2 REACHED')
            page.screenshot(path=f'{OUT}/09-celebrate2.png')
        else:
            print('CELEBRATION 2 NOT REACHED')
            page.screenshot(path=f'{OUT}/09-treat2-end.png')

    browser.close()

print('console errors:', errors if errors else 'none')
