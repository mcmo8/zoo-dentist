# Zoo Smiles — Background art prompts + Claude Code integration prompt

Two parts: (1) prompt set to generate the scene/background art, (2) a paste-ready
prompt for Claude Code to wire everything in and run the audit.

Style lock (paste at the top of EVERY image prompt for consistency):
> Flat 2D vector illustration for a toddler game. Only 4-6 solid flat colors,
> bold clean dark outlines, NO gradients, NO soft shading, NO photo texture.
> Cheerful, rounded, chunky shapes. Soft palette: mint green, sky blue, warm
> cream, coral pink, soft purple. Isolated on a solid pure white background,
> no text, centered.

---

## 1. BACKGROUND / THEME PROMPT SET

Generate each on its own (or as a labeled sheet, same as the animal/tool sheets),
then slice + export WebP at the target size noted. Use the ChatGPT-sheet path
(free), since Higgsfield credits are low.

**A. Waiting-room / lobby background** (full screen, ~720x1280 portrait)
> [style lock] A cute animal-clinic WAITING ROOM interior, wide flat backdrop:
> pastel wall, a row of small chairs, a fish-tank, a potted plant, a wall clock,
> a framed tooth poster, wood floor. Empty center floor space for characters.
> Soft, clean, no characters, no text.

**B. Treatment-room background with dental chair** (full screen, ~720x1280)
> [style lock] A cute animal-DENTIST TREATMENT ROOM interior: a friendly pastel
> dental chair in the center, a small rolling tool tray beside it, an overhead
> dental lamp, a window with sky, a plant, tiled wall. Clean, no characters, no text.

**C. Reception desk** (prop, ~512px)
> [style lock] A rounded pastel clinic reception desk with a small bell and a
> sign board, front view.

**D. Overhead dental lamp** (prop, ~400px)
> [style lock] A cute rounded dental examination lamp on an arm, side view.

**E. Rolling tool tray / cart** (prop, ~400px)
> [style lock] A small rounded pastel medical rolling cart tray, three shelves,
> side view.

**F. Decor set sheet** (slice into items, ~256px each)
> [style lock] A sheet of clinic decor items, evenly spaced on white: potted
> plant, wall clock, framed tooth poster, fish tank, floor rug, hanging sign,
> first-aid cross icon, sparkle stars.

**G. Title / splash backdrop** (full screen, ~720x1280)
> [style lock] A welcoming animal dental clinic EXTERIOR storefront: rounded
> building, big friendly sign area (leave blank), tooth-shaped logo space, sun,
> clouds, bushes. Warm and inviting, no text.

Export rule: full backgrounds -> WebP ~720px (q80). Props/decor -> WebP 256px or
SVG if simple. Same flat = SVG, busy = WebP split as before.

---

## 2. CLAUDE CODE PROMPT (paste into a Claude Code session in kid_games)

> Work in `zoo-dental/`. Integrate the new art in `assets/` into the game,
> replacing the hand-coded SVG primitives.
>
> 1. Inventory `assets/animals/*.svg`, `assets/tools/*.svg`, `assets/effects/*.webp`,
>    `assets/teeth/*.webp`, plus any new `assets/backgrounds/*`. Build a typed
>    asset manifest (`src/game/assets.ts`) mapping each animal id, tool id,
>    problem/tooth-state id, and effect to its file path.
> 2. Replace the inline JSX art in `src/components/AnimalFace.tsx`, the tool
>    components, `Tooth.tsx`, and effect/particle sprites so they render the
>    imported assets (inline SVG via import, WebP via <img>/CSS). Keep the existing
>    pointer controller, step rail, and gesture logic untouched.
> 3. Add a background layer: render the treatment-room background behind the
>    mouth scene during gameplay and the lobby/title background on those screens.
>    Composite the animal + mouth on top. Keep the 360x560 interaction SVG as the
>    foreground.
> 4. Re-align gesture hit-boxes to the new art bounds (drag-from-tray, scrub,
>    dwell, pluck) so taps still land on the right targets.
> 5. Add `assets/**/*.{svg,webp}` to the vite-plugin-pwa Workbox precache globs so
>    everything works offline. Confirm portrait lock + safe-area still hold.
> 6. Delete the over-segmented junk crops: `assets/effects/item_13..16.webp` and
>    `assets/teeth/item_5,6,8.webp`.
>
> THEN run the back-test + audit:
> - `npx tsc --noEmit` (expect only the known deprecated-file errors) and `npm run build` (must be green).
> - Run the Playwright smoke `scripts/smoke_full.py` end-to-end across all 6
>    visits; zero console errors.
> - Audit bundle + asset payload: print the gzip JS size and total `assets/` size,
>    and flag if cold-load transfer regressed badly vs the prior ~58.6 KB gzip.
> - Screenshot the title, lobby, and one treatment screen at 360x720 (old-Android
>    frame) and visually confirm the new art renders, nothing is clipped, and
>    hit-boxes line up.
> - Report a short diff summary: files changed, size before/after, test results.
>
> Do not commit; leave it on a branch `feature/connector-art` for device testing.
