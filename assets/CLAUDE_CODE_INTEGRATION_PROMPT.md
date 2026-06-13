# Zoo Smiles — Asset Integration (paste-ready Claude Code prompt)

Paste everything in the block below into a Claude Code session opened at the
`kid_games` repo. It is written to run autonomously: complete every step that
does not require Mike's subjective taste, stop only at the two decision gates
explicitly marked, and run a code-integrity + dependency-cohesion audit at each
milestone (not just at the end).

---

You are working in `zoo-dental/`. Integrate the finished art in `assets/` into the
game, replacing the hand-coded SVG primitives. Work on a new branch
`feature/connector-art`. Do NOT commit to main. Do NOT ask me to confirm routine
implementation choices — make the reasonable call, note it, and keep going. Only
pause at the two GATES marked below.

## Assets already in place (do not regenerate)
- `assets/animals/*.svg` — 8 patients: bunny, lion, elephant, hippo, monkey, croc, tiger, giraffe
- `assets/tools/*.svg` — 12: drill, brush, toothpaste, mirror, scaler, pick, electric-drill, floss, polisher, forceps, cup, applicator
- `assets/effects/item_*.webp` — germ/plaque/debris/stink/sparkle effects (items 1-12 valid)
- `assets/teeth/item_*.webp` — tooth states: clean, sparkle-clean, cavity, decay-spots, hole, chipped, cracked, shaking, rotten, filling (items 1-4,7,9-13 valid)
- `assets/backgrounds/clinic-exterior.webp` — TITLE / splash backdrop
- `assets/backgrounds/waiting-room.webp` — LOBBY backdrop (4 evenly-spaced seats)
- `assets/backgrounds/treatment-room.webp` — GAMEPLAY backdrop (front-facing reclined chair, centered)
- `assets/props/{lamp,tray,reception}.webp` — transparent layer-props
- `assets/decor/_raw/decor_*.png` — optional decor crops, NOT cut out yet (ignore unless needed)

## Step 0 — cleanup
Delete the over-segmented junk crops: `assets/effects/item_13..16.webp` and
`assets/teeth/item_5,6,8.webp`. Map only the valid items.

## Step 1 — typed asset manifest
Create `src/game/assets.ts` exporting a typed map from every animal id, tool id,
tooth-state/problem id, effect id, background, and prop to its imported asset path.
Vite-import SVGs as components/URLs and WebP as URLs. This is the single source of
truth the components import from. No hard-coded paths anywhere else.

### MILESTONE AUDIT A (manifest integrity)
- `npx tsc --noEmit` passes (only the known deprecated-file errors allowed).
- Every key in the manifest resolves to a file that exists on disk; every art
  file on disk is referenced by exactly one key (print any orphans or dangling refs).
- No circular imports introduced (check the import graph for `src/game/assets.ts`).
Print a short PASS/FAIL table before continuing.

## Step 2 — swap the art in components
Replace inline JSX art in `src/components/AnimalFace.tsx`, the tool components,
`Tooth.tsx`, and effect/particle sprites so they render assets from the manifest.
Keep the pointer controller, `buildSteps` rail, dwell/scrub/pluck gesture logic,
and all game state UNCHANGED — this is a render swap only.

### MILESTONE AUDIT B (component cohesion)
- `npm run build` is green.
- Grep for any remaining inline `<path>`/`<svg>` art primitives in swapped
  components; report leftovers.
- Confirm no component still imports the deleted primitive helpers; report any
  now-dead exports and remove them.
Print PASS/FAIL before continuing.

## Step 3 — background + prop layering
Render `treatment-room.webp` as a fixed back layer during gameplay, `waiting-room.webp`
on the lobby, `clinic-exterior.webp` on the title. Composite the active animal +
the 360x560 interaction SVG ON TOP, with the animal positioned so its open mouth
sits where the chair headrest is (upper-center of the treatment background). The
`lamp`/`tray`/`reception` props are optional overlays — only add them if they do
not already read from the baked background; if redundant, skip and note it.

### MILESTONE AUDIT C (layout + interaction integrity)
- Re-align gesture hit-boxes to the new art bounds; assert every step's target
  rect still intersects its rendered sprite (log any mismatch).
- `npm run build` green; portrait lock + `env(safe-area-inset-bottom)` still applied.
Print PASS/FAIL before continuing.

## Step 4 — offline + dependency cohesion
Add `assets/**/*.{svg,webp}` to the vite-plugin-pwa Workbox precache globs.

### MILESTONE AUDIT D (dependencies + bundle)
- Run `npm ls --depth=0` (or equivalent); report any UNMET/extraneous/duplicate deps.
  No new runtime dependency should have been added for this work — flag it if one was.
- Print gzipped JS bundle size and total `assets/` size; compare cold-load transfer
  vs the prior ~58.6 KB gzip baseline and state the delta.
- Confirm precache manifest now includes the art (entry count + total size).

## Step 5 — back-test
- `npx tsc --noEmit` (known deprecated-file errors only).
- `npm run build` green.
- Run the Playwright smoke `scripts/smoke_full.py` across all 6 visits end-to-end;
  zero console/page errors.
- Screenshot title, lobby, and one treatment screen at 360x720 (old-Android frame);
  verify the new art renders, nothing is clipped, hit-boxes line up.

## GATES (the only two places you stop for me)
- GATE 1 (after Audit C): post the 3 device-frame screenshots so I can approve the
  visual look + animal-in-chair placement before you finish wiring.
- GATE 2 (after Step 5): post the final audit summary (files changed, size before/
  after, all audit tables, test results). Leave it on `feature/connector-art` for
  device testing. Do not merge.

Everything else: proceed without asking.
