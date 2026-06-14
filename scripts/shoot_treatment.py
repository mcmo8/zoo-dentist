"""Capture each patient's treatment screen at 360x720 for mouth-alignment review.

Fresh browser per patient (headless Chromium is unstable across many heavy
sessions), free-play seed so every animal opens directly. Writes
.smoke/treat_<name>.png (gitignored).
"""
import os
from playwright.sync_api import sync_playwright

NAMES = ['Pip', 'Momo', 'Hugo', 'Ella', 'Snappy', 'Leo']
SEED = ('{"treated":{"bunny":1,"monkey":1,"hippo":1,"croc":1,"lion":1,'
        '"elephant":1},"totalVisits":6,"muted":true}')
OUT = '.smoke'
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as pw:
    for name in NAMES:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 360, 'height': 720})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script(f"localStorage.setItem('zoosmiles_save_v1', '{SEED}')")
        pg.goto('http://localhost:4173')
        pg.wait_for_load_state('networkidle')
        pg.click('text=PLAY', force=True)
        pg.wait_for_timeout(400)
        pg.click(f'.zd-card:has-text("{name}")', force=True)
        pg.wait_for_timeout(900)  # let the treatment scene settle
        pg.screenshot(path=f'{OUT}/treat_{name}.png')
        print(f'{name:7s}: shot  errors={errs if errs else "none"}', flush=True)
        b.close()
print('done', flush=True)
