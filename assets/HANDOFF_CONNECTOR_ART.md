# Zoo Smiles — Connector-Art + Feel Integration: single handoff

Paste the block below into a Claude Code session at the `kid_games` repo. This is the
ONE source (supersedes R2/R3/SLOT_TEMPLATE). Branch `feature/connector-art`. Run
autonomously; do everything that doesn't need Mike's taste; stop only at the GATES;
run a code-integrity + dependency-cohesion audit at each milestone.

---

You are in `zoo-dental/`. Replace the flat procedural art with the connector assets
in `assets/`, add richer color (already baked), and make tool actions progressive
with haptics + particles. Keep core game logic (step rail/`buildSteps`, state) intact.

## Assets (already produced — do NOT regenerate or recolor)
- `assets/animals/*.svg` — 8 patients, ALREADY recolored vivid (roster stays 6; tiger/giraffe unused). Originals in `assets/_orig/animals/`.
- `assets/backgrounds/{clinic-exterior,waiting-room,treatment-room}.webp` — ALREADY vibrance-boosted. Originals in `assets/_orig/backgrounds/`.
- `assets/tools/*.svg` — 12 tools. `assets/teeth/item_*.webp` — states: clean=1,sparkle=2,cavity=3,decay=4,hole=7,chipped=9,cracked=10,shaking=11,rotten=12,filling=13 (delete junk 5,6,8). `assets/effects/item_1..12.webp` (delete junk 13-16).
- `images/layered_no_teeth_mouth_asset.svg` — the mouth (groups: mouth-interior-backdrop, layer-01-mouth-lumps-lips, tooth-sprite-placement-zone, layer-02-gums [upper/lower ridge], layer-03-tongue-matter).
- `assets/mouth-layout.json` — LOCKED tooth geometry.
- Reference feel demos (match these): `assets/scrub-demo.html` (brush), `assets/drill-demo.html` (drill).

## Step 0 — cleanup
Delete `assets/effects/item_13..16.webp`, `assets/teeth/item_5,6,8.webp`.

## Step 1 — typed manifest `src/game/assets.ts`
Map every animal/tool/tooth-state/effect/background/mouth to its file.
### AUDIT A: tsc clean; every key resolves; every art file referenced once (report orphans); no circular imports. PASS/FAIL.

## Step 2 — mouth + teeth (layered SVG)
Paint order so gums hide roots: `mouth-interior+lips < teeth < gums < tongue`.
Teeth from `mouth-layout.json` exactly: 5/row, `cy = rowY + rowCurve*(1-((x-cx)/half)^2)`,
UPPER rowY=311 curve=-12 (flipped vertically), LOWER rowY=402 curve=+26, toothSize=60,
span=0.62, mouthWidth=331, mouthY=195 (360-wide stage; expose as constants). Problem
effects are OVERLAYS on a tooth, never replacing it. Must match the locked mockup
(roots tucked, no dark gap above uppers).
### AUDIT B: build green; no leftover inline tooth/gum primitives; remove dead helpers. PASS/FAIL.

## Step 3 — per-animal mouth alignment (REQUIRED, no offset)
Per-animal `{ headOffsetY, headScale }` map so the universal mouth fully covers each
patient's own printed mouth — no second mouth, no peek. Tune all 6 (croc snout,
elephant trunk are hardest). Don't edit animal art.
### GATE 1: post 360x720 screenshots of ALL 6 patients so Mike confirms zero offset.

## Step 4 — progressive tool actions + haptics + particles (NEW)
Tools must NOT clear a problem instantly. Each problem has a work meter (0..1); the
active tool fills it only while the gesture is held/scrubbed over the target, and the
problem sprite fades as the meter fills. Clear fires at 100%, then the tooth advances
its state (e.g. cavity -> filling). Per-tool feel (mirror the demo HTMLs):
- BRUSH/scrub: ~600-900ms to clear; spawn rising CSS bubble particles at the tooth;
  light `navigator.vibrate(15)` per ~90ms tick.
- DRILL: ~900-1100ms; spark + brown-debris particles flying, tooth judder (shake
  class), stutter `navigator.vibrate([12,8])` per tick; `vibrate(40)` on complete;
  cavity fades then filling drops in.
- PICK/scrape, forceps/pull, etc.: same meter pattern, tuned duration + particle type.
Particles are CSS-animated, pooled, capped (~15 on screen) for old-Android. All
`navigator.vibrate` calls guarded by feature-check (no-op where unsupported). Expose
per-tool duration / particle-rate / vibrate-pattern constants.
### AUDIT C: build green; particle count capped; confirm no per-frame React re-render from the meter (drive via refs/rAF); `npm ls --depth=0` clean (flag any new dep); print gzip JS + assets size vs ~58.6 KB baseline.

## Step 5 — backgrounds, rounds, offline
treatment-room behind gameplay, waiting-room lobby, clinic-exterior title. Drive
problems from a ROUNDS data table (slot -> state + overlay + tool; unlisted = clean;
author 8-10 rounds). Add `assets/**/*.{svg,webp}` to Workbox precache; keep portrait
lock + safe-area.

### Step 5b — lobby = pick characters from the waiting-room seats (replaces the tile grid)
Replace the character TILE grid with the animals SEATED in the waiting-room. Render
each patient as a tappable sprite using its sad-sitting pose `assets/animals-sit/<name>.webp`
(all 8 exist: bunny, monkey, hippo, lion, croc, tiger, giraffe, elephant), positioned
from `assets/lobby-seats.json` (center-anchored coords in a 360-wide stage, sprite
width = 120*s). Tapping a seated animal starts that patient's treatment.
ROTATION: the waiting-room art has ~4 chairs, so show ~4 seated at a time and rotate
which patients occupy the fixed seat slots each new round/visit (do not pile all 8 on
at once). Keep the sitting sprites at their current (already-rich) colors.
NOTE: the 6-mechanic roster is bunny/monkey/hippo/elephant/croc/lion; tiger + giraffe
have lobby poses but no treatment mechanics yet — only seat patients that have a
treatment, or treat tiger/giraffe as future content.

## Step 6 — back-test
tsc clean; build green; `scripts/smoke_full.py` 6 visits zero console errors; re-shoot
title + lobby + 6 treatment screens at 360x720.
### GATE 2: post final audit tables + screenshots. Leave on `feature/connector-art`, do not merge.

Everything else: proceed without asking.
