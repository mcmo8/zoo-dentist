# Zoo Smiles — Revision R2: transparent teeth + mouth-board redesign

Paste the block below into the Claude Code session on `feature/connector-art`.
Autonomous like before; stop only at the screenshot gate.

## What changed in assets (already done, just re-import)
- `assets/teeth/item_*.webp` and `assets/effects/item_1..12.webp` are now
  TRANSPARENT (the white boxes are removed; tooth interior white is preserved).
  Re-import them. Remove any white tooth-slot/tile the component currently draws
  behind each tooth — the sprites are clean now and need no card.

## Mouth-board redesign (match the source-game look)
Current board shows ~6 floating teeth in white boxes that don't sit on the gums.
Rebuild the mouth board to read like a real open mouth, keeping all gesture/state
logic unchanged (render + geometry only):

1. **One fixed mouth board for every patient.** Do NOT align teeth to each animal's
   actual mouth. The animal head sits BEHIND a single generic open-mouth element
   (same position/size for all 6 patients), exactly like the source game. The
   patient's identity is the head/ears above; the mouth is a consistent UI board.
2. **Full arch, both rows.** Render an UPPER row and a LOWER row of teeth (about
   5-7 per row) following the curve of the gum line, teeth touching/snug like a
   real smile, not spaced-out singles. Reuse the clean tooth sprite
   (`teeth/item_1.webp`) repeated across the arch.
3. **Teeth seated ON the gums.** Position both rows so their roots tuck into the
   pink gum shape (upper teeth hang from the top gum, lower teeth rise from the
   bottom gum). No floating gap between tooth and gum.
4. **Problems overlay on specific teeth.** Keep the discrete-problem mechanic:
   a problem sprite (plaque/food/cavity/etc. from `effects/` and the problem-state
   teeth in `teeth/`) is placed ON a target tooth in the arch. Tools apply to that
   tooth. Clean state = the plain `item_1` tooth.
5. Keep the gum/tongue shape, but make the teeth visually belong to it. Match the
   reference: a friendly full white smile inside an open mouth.

## Audit + gate
- `npx tsc --noEmit` clean (known deprecated errors only); `npm run build` green.
- Assert each arch tooth's hit-box still maps to its sprite and that problem
  targets land on real teeth.
- Re-capture 360x720 screenshots of one treatment screen (clean) and one mid-
  treatment (problems visible) and post them. Stop there for approval.
