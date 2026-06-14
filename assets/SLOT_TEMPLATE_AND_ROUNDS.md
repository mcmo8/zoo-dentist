# Zoo Smiles — Tooth slot template + round data (stops the loose placement)

The in-game teeth look "out of whack" because positions are computed loosely.
Fix: a FIXED 10-slot template defined as data, validated in a static mockup.
Teeth stay individual sprites (needed for cavity/fill/chip/pull). Problems are
OVERLAYS on top of a tooth — never replace the tooth sprite.

## Slot template (resolution-independent — fractions of the mouth image box)
Mouth box = where `open-mouth.webp` is drawn. (x,y) are fractions of mouth
width/height; (0,0)=mouth top-left. Tooth heights are fractions of mouth height.

```
SLOTS_X        = [0.150, 0.325, 0.500, 0.675, 0.850]   // 5 columns, evenly spaced
GUM_CURVE(xf)  = 0.051 * (1 - ((xf - 0.5) / 0.35)^2)   // center dips ~5% lower

UPPER row (teeth flipped vertically, crown down, roots into top gum)
  y = 0.215 + GUM_CURVE(xf)      tooth height = 0.192 * mouthH
LOWER row (upright, roots into bottom gum)
  y = 0.805 + GUM_CURVE(xf)      tooth height = 0.199 * mouthH

10 slots total: upper U0..U4, lower L0..L4 (left→right).
```
These are the locked numbers from `_slot_template_demo.png`. Expose them as
constants; do not recompute spacing per render.

## Tooth state sprites (already in assets/teeth/)
clean=item_1 · sparkle-clean=item_2 · cavity=item_3 · decay-spots=item_4 ·
hole=item_7 · chipped=item_9 · cracked=item_10 · shaking=item_11 · rotten=item_12 ·
filling=item_13. Effect overlays in assets/effects/ (germ=1..3, food=4-7, etc.).

## Round data (the "packaged combinations")
A round is just which slot shows which state + optional overlay. Data, not art:

```ts
type SlotId = 'U0'|'U1'|'U2'|'U3'|'U4'|'L0'|'L1'|'L2'|'L3'|'L4';
interface ProblemInstance { slot: SlotId; state: ToothState; overlay?: EffectId; tool: ToolId; }
interface Round { id: string; problems: ProblemInstance[]; }  // unlisted slots = clean

const ROUNDS: Round[] = [
  { id:'r1', problems:[
      { slot:'U1', state:'cavity', overlay:'germ',  tool:'drill' },
      { slot:'L2', state:'hole',   overlay:'food',  tool:'pick'  },
      { slot:'U3', state:'rotten',                  tool:'forceps' },
  ]},
  // …author 8-10 rounds by varying slots/states. No new art needed.
];
```

## Claude Code instruction (paste on feature/connector-art)
> Replace the current loose tooth placement with the FIXED slot template above.
> Render 10 teeth at the 10 slot coordinates (constants), every patient, every
> round. Each slot renders its state sprite from assets/teeth/. A problem OVERLAY
> (germ/food/etc.) draws ON TOP of the tooth at the same slot — it must never
> replace the tooth (current bug: the germ is shown instead of a tooth).
> Drive content from a ROUNDS data table (shape above); unlisted slots are clean.
> Keep gesture/hit-test logic but point each slot's hit-box at its fixed coordinate.
> Re-capture clean + mid-treatment 360x720 screenshots; they should match
> `_slot_template_demo.png`.
```
```
