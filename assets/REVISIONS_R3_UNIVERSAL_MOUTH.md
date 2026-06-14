# Zoo Smiles — Revision R3: universal mouth base (kills the pink-over-teeth line)

Root cause of the pink line: the mouth is built from procedural shapes and a gum
strip is drawn IN FRONT of the teeth. Fix = make the mouth a single art image with
NO teeth, and layer the transparent teeth strictly on top. Gums can never cover a
tooth again.

## PART 1 — ChatGPT prompt: generate the universal mouth base
Generate ONE image (portrait, ~720 wide). Same flat style as the rest of the game.

> Flat 2D vector illustration for a toddler game, bold dark outlines, solid flat
> colors, no gradients, no texture. A cartoon WIDE-OPEN MOUTH interior, front view,
> with NO TEETH AT ALL. A soft red-pink outer lip ring framing the mouth; a smooth
> pale-pink UPPER gum ridge across the top and a smooth pale-pink LOWER gum ridge
> across the bottom (both empty and clean, ready for separate teeth to be placed on
> them); a dark maroon throat opening in the center; a rounded pink tongue resting
> along the bottom. Symmetrical, centered, friendly, isolated on a solid pure white
> background. NO teeth, no text, no characters.

Notes:
- It MUST have no teeth (teeth are separate sprites that change state in-game).
- The two gum ridges should be clean horizontal bands where teeth will attach.
- After generating, it will be background-cut to transparent (same flood-fill as the
  teeth) so it overlays the animal head + room.

Save the processed result to `assets/mouth/open-mouth.webp` (transparent).

## PART 2 — Claude Code instruction (paste on feature/connector-art)
> Replace the procedural mouth shapes with the new image asset. Do NOT draw any gum,
> tongue, lip, or throat shapes in code anymore — `assets/mouth/open-mouth.webp` IS
> the mouth.
>
> Render order (bottom to top), all sharing one fixed position for every patient:
> 1. treatment-room background
> 2. animal head (behind the mouth)
> 3. `assets/mouth/open-mouth.webp`  (gums + tongue + throat, no teeth)
> 4. teeth arch — transparent `teeth/item_1.webp` repeated. LOCKED placement
>    (validated in a static mockup at 360x720; reproduce these exactly, then expose
>    as constants for fine-tuning):
>      - mouth width MW; mouth height MH from the image aspect (~0.886*MW)
>      - 5 teeth per row (N=5); horizontal span = 0.70*MW, centered
>      - UPPER row baseline Y = mouthTop + 0.215*MH, teeth FLIPPED vertically
>        (crown points down, roots tuck into the top gum)
>      - LOWER row baseline Y = mouthTop + 0.805*MH, teeth upright
>      - both rows curve to hug the gum: per tooth, yOffset = 15 * (1 - ((x-cx)/half)^2)
>        i.e. center tooth sits ~15px lower than the edge teeth (follows the gum dip)
>      - tooth height ~56px upper / ~58px lower at MW=330 (scale proportionally to MW)
>    Result: upper teeth tuck snug under the top gum band, lower teeth sit on the
>    bottom gum, evenly spaced like the reference. No dark gap above the upper row.

> 4a. Per-animal cover check: this mouth position was validated on the bunny. Verify
>     it fully covers each of the other 5 animals' own printed mouths (croc snout,
>     elephant trunk are the risky ones). Where a face peeks above the mouth, add a
>     small per-animal mouth Y offset; do not redesign the animal art.
> 5. problem overlays (`effects/*` and problem-state teeth) ON specific teeth
> 6. tools + UI
>
> Because gums are layer 3 and teeth are layer 4, NOTHING pink may render in front
> of a tooth. Remove the old gum-in-front strip entirely.
>
> Keep all gesture/state/step logic unchanged. Assert each arch tooth's hit-box maps
> to its sprite. Re-capture a clean and a mid-treatment 360x720 screenshot and stop
> for approval.
