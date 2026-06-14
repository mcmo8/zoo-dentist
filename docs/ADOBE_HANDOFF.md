# Zoo Smiles, Adobe Art Production Handoff (June 10, 2026)

Paste-ready context for a new Cowork thread. Goal: produce the Zoo Smiles
raster art using the Adobe for creativity connector, with Claude doing
generation, cleanup, and verification directly instead of relying on a
third-party agent's self-reporting.

## Project context (read first)

- Game: Zoo Smiles, Animal Dentist. Working React/TS/Vite PWA at
  `kid_games/zoo-dental/`. Game logic, screens, gestures all function with
  placeholder SVG art. We are skinning a finished game, not building one.
- Master spec: `zoo-dental/docs/REPLIT_BRIEF.md`. Parts C (coordinate
  contracts), D (animation timings), and B-3 (layer separation rules) are
  ENGINE TRUTH and apply to Adobe production unchanged. Read that file
  before generating anything.
- `zoo-dental/docs/ART_BRIEF.md` is the older SVG-only spec. Reference
  only, do not follow its format rules.
- Hardware target: 4 to 6 year old budget Androids, 360px CSS width.
  Deliver big layers at 2x (full stage canvas 720x1120), small sprites at
  3x of their normalized box (teeth 300x420, tools/FX 168x168).

## What happened before this thread

1. A Replit agent produced a Phase 1 style guide. Several pieces were
   approved and are LOCKED (see palette below).
2. Two deliverables failed twice: the eye system (four different
   characters instead of one character in four expression states) and the
   tooth overlays (it generated whole new tooth paintings instead of
   transparent overlays registered to the locked base, and faked a
   "registration proof" by AI-painting an image with caption text in it).
3. Lesson learned: image generators cannot produce registered layer
   overlays by prompting alone. Overlays must be edits on a transparent
   canvas sized to the locked base, and composite proofs must be stacked
   BY CODE. Verification must run on the real files (alpha channel check,
   dimension check, registration stack) via Python/PIL in the sandbox,
   never trusted from a model's summary.
4. Decision: move generation to Adobe so Claude controls generate, edit,
   background removal, crop, and verification directly. Replit project
   (replit.com/@mike2140/Zoo-Admin-Hub) still exists; it may be used later
   for animated scene compositor previews only.

## LOCKED style decisions (from approved Phase 1, do not reinvent)

- Clinic base (in-game backdrops): Mint #c4eed0, Sky #bfe3fa, Cream #fff8e7
- Dark #123c47 and Surface #1b4d5a are style-guide chrome ONLY, never
  in-game backgrounds
- Ink (all outlines): Charcoal #362828. Weights at 360-wide scale: 5px
  hero, 3px midsize, 2px detail (double at 2x assets, triple at 3x)
- Problem colors (exclusive to plaque/cavity/rot/germs/stink):
  Plaque #c89f53, Cavity #5c4033, Rot #7d8f4e
- Reward colors (exclusive to sparkles/stars/confetti): Star #ffd700,
  Sparkle #ff6b6b (warm coral), Confetti #9b5de5 (warm lavender)
- Identity hues: 6 per-animal hues exist in the Replit project's
  palette.json (public/art/style/). Only Elephant Periwinkle #c3cde6 was
  captured in review. Pull the rest from the Replit project (Mike can
  copy palette.json out) or regenerate a 6-hue set for approval.
- Logo: chunky rounded "ZOO SMILES" in yellow with charcoal outline was
  approved in spirit; recreate or export later.
- Shading model: soft painted volume, light source top-left, base color +
  soft core shadow bottom-right + one light glint. Toddler-soft, not
  realism.
- Style references for tone: the approved Replit tooth-clean.png (chunky
  cartoon tooth, cream fill, thick warm outline, glint) and the shading
  blob. The eye-neutral.png eyeball geometry (big dark pupil, white
  glint, ink ring) was the right direction; its textured brows were not.

## Adobe connector notes

- Call `adobe_mandatory_init` before any other Adobe tool.
- Useful tools observed: image generation via Firefly board/asset tools,
  `image_remove_background`, `image_crop_to_bounds`, `image_crop_and_resize`,
  `image_select_by_prompt` (for masked edits), `image_fill_area`,
  `image_generative_expand`, asset folder management.
- Workflow per asset: generate, remove background if needed, crop,
  download to the workspace, then VERIFY with PIL in the sandbox:
  real alpha channel, corner pixels alpha 0, expected dimensions, and for
  overlay sets a programmatic stack composite saved as proof.
- Output destination: `kid_games/zoo-dental/art/` mirroring the folder
  structure in REPLIT_BRIEF.md Part B-1 (style/, screens/, animals/,
  teeth/, tools/, problems/, ui/). Keep PNG masters; WebP conversion
  happens at integration.

## First task for the new thread

Redo the two failed Phase 1 items, then continue to the vertical slice:

1. Eye system: ONE character's eyes in 4 states (neutral-open, wince,
   happy, sad). Identical canvas, position, eyeball geometry, and line
   weight across all 4 files; only the expression changes. Eyes + brows
   only (no mouth, no lashes, no skin). Brows are clean solid charcoal
   ink strokes. Generate neutral first, approve with Mike, then derive
   the other three states from it (masked edits, not fresh generations).
2. Tooth states: lock one clean cartoon tooth base (transparent),
   then create plaque and cavity overlays as transparent canvases at the
   base's exact dimensions containing only stain/decay pixels. Build the
   registration proof composite WITH CODE (PIL stack), never generated.
3. After both pass verification and Mike approves: proceed to the bunny
   vertical slice per REPLIT_BRIEF.md (animal-01 layer set, B-3 list,
   tiny-easy board class), one layer at a time, approval gates between.

## Working agreements with Mike

- No em dashes anywhere, in chat or files.
- Punchlines first, concise, stress-test before agreeing.
- He is a visual learner: show generated assets and comparisons, use
  SVG diagrams for plans and structures.
- Approval gates are real: style anchor first, then derivatives, never
  batch before sign-off.
- Verify on real files programmatically; never accept self-reported
  compliance (the Replit lesson).
