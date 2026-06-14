"""Targeted smoke for the on-contact flare + tip-offset fix (Momo / brush).

Verifies: (a) when the brush's CONTACT POINT (cursor + TOOL_TIP_DY) is over a
plaque tooth, the .zd-flare ring appears immediately; (b) brushing there
actually reduces plaque (step eventually advances past the brush step).
"""
import os
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), '..', '.smoke')
os.makedirs(OUT, exist_ok=True)

VB_W, VB_H, TRAY_Y = 360, 560, 500
TOOL_TIP_DY = -56  # must match Treatment.tsx
SLOTS = (72, 48, 108, 114, 144, 180, 216, 246, 252, 288, 312)
errors = []


def svg_to_px(box, x, y):
    scale = min(box['width'] / VB_W, box['height'] / VB_H)
    ox = (box['width'] - VB_W * scale) / 2
    oy = (box['height'] - VB_H * scale) / 2
    return box['x'] + ox + x * scale, box['y'] + oy + y * scale


def sweep_mouth(page, box, passes=2):
    for _ in range(passes):
        for gy in range(170, 360, 40):
            for gx in range(60, 320, 45):
                px, py = svg_to_px(box, gx, gy)
                page.mouse.move(px, py, steps=3)
                page.wait_for_timeout(110)


def do_step_with_slots(page, svg, label, before):
    """Run the active step by sweeping with each tray slot until the label changes."""
    box = svg.bounding_box()
    for slot_x in SLOTS:
        sx, sy = svg_to_px(box, slot_x, TRAY_Y)
        page.mouse.move(sx, sy)
        page.mouse.down()
        sweep_mouth(page, box)
        page.mouse.up()
        page.wait_for_timeout(900)
        if label.count() == 0 or label.inner_text() != before:
            return True
    return False


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 360, 'height': 720})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto('http://localhost:4181')
    page.wait_for_load_state('networkidle')
    page.evaluate(
        "localStorage.setItem('zoosmiles_save_v1', "
        "'{\"treated\":{\"bunny\":1,\"monkey\":1,\"hippo\":1,\"croc\":1,\"lion\":1,\"elephant\":1},"
        "\"totalVisits\":6,\"muted\":true}')"
    )
    page.reload()
    page.wait_for_load_state('networkidle')

    page.click('text=PLAY', force=True)
    page.wait_for_timeout(400)

    # pick Momo (monkey) — plaque + brush
    momo = page.locator('.zd-card:has-text("Momo")')
    print('Momo card count:', momo.count())
    momo.first.click(force=True)
    page.wait_for_timeout(500)

    svg = page.locator('svg.zd-scene')
    label = page.locator('.zd-steplabel')
    print('step 1 label:', label.inner_text())

    # advance steps until we land ON the brush step ("Brush, brush, brush!").
    # Monkey order: Look inside! -> Rinse the teeth! -> Brush -> Swish and rinse!
    for _ in range(5):
        cur = label.inner_text()
        if 'brush' in cur.lower():
            break
        do_step_with_slots(page, svg, label, cur)
        page.wait_for_timeout(300)
        print('advanced to:', label.inner_text())

    page.wait_for_timeout(400)
    print('targeting on step:', label.inner_text())
    page.screenshot(path=f'{OUT}/flare-before.png')

    # find a highlighted target tooth (the brush step highlights plaque teeth)
    targets = page.locator('svg.zd-scene .zd-target')
    print('zd-target count:', targets.count())

    flare_seen = False
    plaque_before = None
    plaque_after = None

    if targets.count() > 0:
        tb = targets.first.bounding_box()
        # tooth center in client px
        tcx = tb['x'] + tb['width'] / 2
        tcy = tb['y'] + tb['height'] / 2
        box = svg.bounding_box()
        scale = min(box['width'] / VB_W, box['height'] / VB_H)
        # we want the CONTACT POINT (cursor + TOOL_TIP_DY*scale) on the tooth,
        # so move the CURSOR up by TOOL_TIP_DY scene units
        cursor_y = tcy - TOOL_TIP_DY * scale

        # grab the brush tool from its active tray slot
        # active slot is the one with the bounce/glow; just probe slots and pick
        # the one that starts a tool drag (label has a tool). Use slot nearest
        # center first.
        active_x = None
        # the active tool sits centered-ish; try the center slot then neighbors
        for sx_scene in (180, 144, 216, 108, 252, 72, 288):
            spx, spy = svg_to_px(box, sx_scene, TRAY_Y)
            page.mouse.move(spx, spy)
            page.mouse.down()
            page.wait_for_timeout(60)
            # if a drag sprite is now visible (dragGRef display:block) we grabbed it
            grabbed = page.evaluate(
                "() => { const g = document.querySelector('svg.zd-scene > g[style*=\"display: block\"]');"
                " return !!g; }"
            )
            if grabbed:
                active_x = sx_scene
                break
            page.mouse.up()
            page.wait_for_timeout(60)

        print('grabbed tool at slot scene-x:', active_x)

        # measure plaque overlay opacity on the target tooth before brushing
        def plaque_opacity():
            return page.evaluate(
                "() => { const imgs=[...document.querySelectorAll('svg.zd-scene image')];"
                " const pl=imgs.filter(i=> (i.getAttribute('href')||'').includes('item_3'));"
                " return pl.length ? pl.map(i=>+(i.getAttribute('opacity')||1)) : []; }"
            )

        plaque_before = plaque_opacity()

        if active_x is not None:
            # move the CONTACT POINT onto the tooth and HOLD — flare must appear
            page.mouse.move(tcx, cursor_y, steps=6)
            page.wait_for_timeout(160)  # > one dwell tick
            flare_seen = page.locator('svg.zd-scene .zd-flare').count() > 0
            print('FLARE present while tip on tooth:', flare_seen)
            page.screenshot(path=f'{OUT}/flare-on-tooth.png')

            # now scrub locally to reduce plaque
            for k in range(40):
                ox = ((k % 5) - 2) * 9
                oy = ((k // 5 % 3) - 1) * 9
                page.mouse.move(tcx + ox, cursor_y + oy, steps=2)
                page.wait_for_timeout(45)
            page.wait_for_timeout(200)
            plaque_after = plaque_opacity()
            page.mouse.up()
            page.screenshot(path=f'{OUT}/flare-after-scrub.png')

    print('plaque opacity before:', plaque_before)
    print('plaque opacity after :', plaque_after)
    browser.close()

print('---')
print('FLARE SEEN ON CONTACT:', flare_seen)
if plaque_before and plaque_after:
    db = sum(plaque_before)
    da = sum(plaque_after)
    print(f'plaque sum before={db:.3f} after={da:.3f} -> {"DECREASED" if da < db - 0.01 else "NO CHANGE"}')
print('console errors:', errors if errors else 'none')
