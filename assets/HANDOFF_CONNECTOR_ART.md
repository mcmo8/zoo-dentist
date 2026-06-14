# Zoo Smiles — Connector-Art Integration: single handoff

Paste the block below into a Claude Code session opened at the `kid_games` repo.
Supersedes the earlier R2/R3/SLOT_TEMPLATE/REVISIONS notes — this is the one source.
Work on branch `feature/connector-art`. Run autonomously; do everything that does
not need Mike's taste; stop only at the two GATES. Run a code-integrity +
dependency-cohesion audit at each milestone.

---

You are working in `zoo-dental/`. Replace the flat procedural art with the
connector-generated assets in `assets/`. Keep ALL gameplay logic (pointer
controller, step rail / `buildSteps`, gestures, state) unchanged — this is a render
+ layout swap.

## Assets (already produced, do not regenerate)
- `assets/animals/*.svg` — 8 patients (bunny, lion, elephant, hippo, monkey, croc, tiger, giraffe; roster stays 6, tiger/giraffe unused)
- `assets/tools/*.svg` — 12 tools (drill, brush, toothpaste, mirror, scaler, pick, electric-drill, floss, polisher, forceps, cup, applicator)
- `assets/teeth/item_*.webp` — transparent tooth states: clean=1, sparkle=2, cavity=3, decay=4, hole=7, chipped=9, cracked=10, shaking=11, rotten=12, filling=13 (5,6,8 are junk — delete)
- `assets/effects/item_1..12.webp` — transparent germ/plaque/food/sparkle overlays (13-16 junk — delete)
- `assets/backgrounds/{clinic-exterior,waiting-room,treatment-room}.webp` — title / lobby / gameplay
- `assets/mouth/open-mouth.webp` — flat fallback mouth (prefer the layered SVG below)
- `images/layered_no_teeth_mouth_asset.svg` — the REAL mouth: groups `mouth-interior-backdrop`, `layer-01-mouth-lumps-lips`, `tooth-sprite-placement-zone`, `layer-02-gums` (upper-gum-ridge, lower-gum-ridge), `layer-03-tongue-matter`, `alignment-guides`
- `assets/mouth-layout.json` — LOCKED tooth geometry (tuned in `assets/mouth-tuner.html`)

## Step 0 — cleanup
Delete `assets/effects/item_13..16.webp` and `assets/teeth/item_5,6,8.webp`.

## Step 1 — typed manifest (`src/game/assets.ts`)
Map every animal, tool, tooth-state, effect, background, and the mouth to its file.
SVGs imported as components/URLs, WebP as URLs. Single source of truth.
### AUDIT A: tsc clean (known deprecated errors only); every manifest key resolves to a file; every art file referenced once (report orphans/dangling); no circular imports. PASS/FAIL table.

## Step 2 — the mouth + teeth (the critical part)
Render the mouth from the LAYERED SVG with this exact paint order so gums hide the
tooth roots by z-order:
  `mouth-interior-backdrop + lips` (back)  <  `teeth`  <  `layer-02-gums`  <  `tongue`
Then teeth from `assets/mouth-layout.json`, reproducing it exactly:
  - 5 teeth per row; columns evenly spaced across `span * mouthWidth`, centered
  - per tooth: `cy = rowY + rowCurve * (1 - ((x-cx)/half)^2)`
  - UPPER: rowY=311, rowCurve=-12, teeth FLIPPED vertically (roots up into the gum)
  - LOWER: rowY=402, rowCurve=+26
  - toothSize=60, span=0.62, mouthWidth=331, mouthY=195 (values in a 360-wide stage; expose as constants)
Each tooth renders its state sprite; a problem OVERLAY (effect) draws ON TOP of the
tooth — it must NEVER replace the tooth (old bug). Result must match
`assets/mouth-tuner.html` / the locked mockup: teeth tuck behind both gum lines,
roots hidden, even spacing, no dark gap above the uppers.
### AUDIT B: build green; grep for leftover inline tooth/gum SVG primitives (report + remove dead helpers). PASS/FAIL.

## Step 3 — per-animal mouth alignment (REQUIRED — no offset)
The mouth + animal head share one fixed mouth position, but each animal's printed
mouth sits at a different spot. For EACH of the 6 patients, position the head so the
universal mouth fully covers that animal's own printed mouth — no second mouth, no
peek above the gum line. Add a per-animal `{ headOffsetY, headScale }` calibration
map (constants). Tune all 6 individually (croc snout and elephant trunk are the hard
ones). Do not redesign the animal art.
### GATE 1: post 360x720 screenshots of ALL SIX patients on the treatment screen so
Mike confirms zero offset before you continue.

## Step 4 — backgrounds, rounds, offline
- treatment-room behind gameplay, waiting-room on lobby, clinic-exterior on title.
- Drive problems from a ROUNDS data table (slot → state + optional overlay + tool);
  unlisted slots = clean. Author 8-10 rounds; no new art.
- Add `assets/**/*.{svg,webp}` to the Workbox precache globs; keep portrait lock + safe-area.
### AUDIT C: `npm ls --depth=0` clean (no new runtime dep added — flag if so); print gzip JS + total assets size vs the ~58.6 KB baseline and state the delta; confirm precache includes the art.

## Step 5 — back-test
tsc clean; build green; run `scripts/smoke_full.py` across 6 visits (zero console errors);
re-shoot title + lobby + the 6 treatment screens at 360x720.
### GATE 2: post the final audit tables + screenshots. Leave on `feature/connector-art`, do not merge.

Everything else: proceed without asking.
