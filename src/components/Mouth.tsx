import type { AnimalSpec, ToothState } from '../game/types';
import { Tooth, type ToothPlacement } from './Tooth';
import { MouthBack, MouthGums, MOUTH_ART_VB } from './mouthArt';

/* ONE fixed universal open-mouth for every patient (R3 redesign). The animal head
   sits behind it; this is a consistent UI mouth, not each animal's real mouth.

   The mouth is the artist's layered vector (see mouthArt.tsx), drawn in TWO passes
   so the teeth sandwich between the mouth interior and the gum ridges:
       MouthBack (interior+lips+throat+tongue)  <  teeth  <  MouthGums (ridges)
   Because the gums paint last, a tooth root can never poke above the gum line.

   Geometry is the LOCKED layout from assets/mouth-layout.json, tuned in
   assets/mouth-tuner.html on a 360-wide stage (mouth box 331 wide, centered, top at
   y=195 -> box center y≈360.5). The game scene is 360x560 with the tray at y=500, so
   that locked geometry is mapped into the scene via two knobs only — MOUTH_W (scene
   mouth width) and MOUTH_CY (scene mouth center y) — which preserves the locked SHAPE
   and just places/scales it. Everything else flows from the JSON. */

// ---- LOCKED layout (assets/mouth-layout.json — do not edit without re-tuning) ----
const TUNER_MW = 331; // mouth box width on the tuner stage
const TUNER_CX = 180; // stage center x (teeth centered on the stage)
const TUNER_CY_MID = 195 + TUNER_MW / 2; // mouthY + half -> box center y ≈ 360.5
const UPPER_Y = 311;
const UPPER_CURVE = -12;
const LOWER_Y = 402;
const LOWER_CURVE = 26;
const TOOTH = 60;
const SPAN = 0.62;

// ---- scene placement knobs (the two values to nudge if the fit needs it) ----
export const MOUTH_CX = 180;
export const MOUTH_CY = 256; // scene y of the mouth center
const MOUTH_W = 314; // scene width of the (square) mouth box

// whole-mouth ellipse used by inMouth() for the rinse/wash/look steps
export const MOUTH_RX = MOUTH_W * 0.46;
export const MOUTH_RY = MOUTH_W * 0.42;

// tuner-stage -> scene mapping (single source: k, then translate to the scene center)
const K = MOUTH_W / TUNER_MW;
const mapX = (tx: number) => MOUTH_CX + K * (tx - TUNER_CX);
const mapY = (ty: number) => MOUTH_CY + K * (ty - TUNER_CY_MID);

// transform that drops the 1254-unit source SVG onto the scene mouth box
const BOX_LEFT = MOUTH_CX - MOUTH_W / 2;
const BOX_TOP = MOUTH_CY - MOUTH_W / 2;
const SVG_SCALE = MOUTH_W / MOUTH_ART_VB;
const MOUTH_ART_TRANSFORM = `translate(${BOX_LEFT},${BOX_TOP}) scale(${SVG_SCALE})`;

function rowPlacements(
  n: number,
  baseY: number,
  curve: number,
  dir: 'down' | 'up',
  startIndex: number
): ToothPlacement[] {
  const out: ToothPlacement[] = [];
  const half = (SPAN * TUNER_MW) / 2;
  const w = K * TOOTH;
  for (let i = 0; i < n; i++) {
    const tx = n === 1 ? TUNER_CX : TUNER_CX - half + ((2 * half) / (n - 1)) * i;
    const norm = half === 0 ? 0 : (tx - TUNER_CX) / half;
    const f = 1 - norm * norm; // 1 at center, 0 at the edges
    const ty = baseY + curve * f;
    out.push({
      index: startIndex + i,
      cx: mapX(tx),
      cy: mapY(ty),
      w,
      h: w,
      dir,
      shape: 'square',
    });
  }
  return out;
}

export function computeToothLayout(spec: AnimalSpec): ToothPlacement[] {
  // counts come from the (uniform) spec so we stay in lockstep with the engine;
  // the locked layout is 5 + 5.
  const nTop = spec.mouth.top.length;
  const nBot = spec.mouth.bottom.length;
  return [
    ...rowPlacements(nTop, UPPER_Y, UPPER_CURVE, 'down', 0),
    ...rowPlacements(nBot, LOWER_Y, LOWER_CURVE, 'up', nTop),
  ];
}

export function Mouth({
  spec,
  teeth,
  layout,
  revealed,
  targetTeeth,
  stinkOpacity,
}: {
  spec: AnimalSpec;
  teeth: ToothState[];
  layout: ToothPlacement[];
  revealed: Set<number>;
  targetTeeth: Set<number>;
  stinkOpacity: number;
}) {
  void spec; // mouth art is uniform; identity is the head behind it

  return (
    <g>
      {/* interior + lips + throat + tongue — behind the teeth */}
      <g transform={MOUTH_ART_TRANSFORM}>
        <MouthBack />
      </g>

      {/* teeth arch — each renders its own state sprite + problem overlays */}
      {layout.map((p) => (
        <Tooth
          key={p.index}
          p={p}
          t={teeth[p.index]}
          revealed={revealed.has(p.index)}
          highlight={targetTeeth.has(p.index)}
        />
      ))}

      {/* gum ridges — the only mouth part in front of the teeth, hiding the roots */}
      <g transform={MOUTH_ART_TRANSFORM}>
        <MouthGums />
      </g>

      {/* stink cloud drifting out of the mouth */}
      {stinkOpacity > 0.02 && (
        <g opacity={stinkOpacity} className="zd-stink">
          <g transform={`translate(${MOUTH_CX + 112},${MOUTH_CY - 70})`}>
            <ellipse rx="34" ry="20" fill="#9acb6e" opacity="0.85" />
            <ellipse cx="-24" cy="8" rx="20" ry="13" fill="#b5dc8c" opacity="0.85" />
            <ellipse cx="22" cy="10" rx="18" ry="12" fill="#b5dc8c" opacity="0.85" />
            <path d="M-10,-4 q4,-8 8,0 q4,8 8,0" fill="none" stroke="#5d8f37" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      )}
    </g>
  );
}
