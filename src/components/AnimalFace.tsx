import type { AnimalId, AnimalSpec } from '../game/types';
import { animalArt } from '../game/assets';
import { MOUTH_CX, MOUTH_CY } from './Mouth';

export type Expression = 'sad' | 'open' | 'wince' | 'happy';

/* The animal head is finished art (transparent SVG from the manifest) rendered as a
   single <image>, fitted into a face box in the shared scene coordinate system. In
   treatment the universal open-mouth (Mouth.tsx) is composited on top at a FIXED
   position; each animal's printed mouth, however, sits at a slightly different spot.
   HEAD_CALIB nudges/scales each head so the universal mouth fully covers that animal's
   own drawn mouth — no second mouth, no face peeking above the gum line. The transform
   scales about the mouth anchor (MOUTH_CX, MOUTH_CY) so changing `scale` zooms the head
   without sliding its mouth off the board. `dx`/`dy` then fine-position it.

   The art itself is never redesigned; this is pure placement. `expr` is kept for API
   compatibility (the Treatment screen conveys wince with a CSS nudge on the face). */

const FACE = { x: 18, y: 4, w: 324, h: 372 };

interface HeadCalib {
  dx: number;
  dy: number;
  scale: number;
}

/* Per-patient alignment of the printed mouth to the universal mouth board.
   Tuned individually on the 360x720 treatment screen (croc snout + elephant trunk
   are the awkward ones). 0 / 0 / 1 = the art's own fitted position. */
const HEAD_CALIB: Record<AnimalId, HeadCalib> = {
  bunny: { dx: 0, dy: 11, scale: 1.36 },
  monkey: { dx: 0, dy: 26, scale: 1.35 },
  hippo: { dx: 0, dy: 34, scale: 1.17 },
  elephant: { dx: 0, dy: 30, scale: 1.21 },
  croc: { dx: 12, dy: 58, scale: 1.16 },
  lion: { dx: 0, dy: 6, scale: 1.21 },
};

export function AnimalFace({
  spec,
}: {
  spec: AnimalSpec;
  expr?: Expression;
  mouthOpen?: boolean;
}) {
  const c = HEAD_CALIB[spec.id] ?? { dx: 0, dy: 0, scale: 1 };
  const transform =
    `translate(${c.dx},${c.dy}) ` +
    `translate(${MOUTH_CX},${MOUTH_CY}) scale(${c.scale}) translate(${-MOUTH_CX},${-MOUTH_CY})`;
  return (
    <g transform={transform}>
      <image
        href={animalArt(spec.id)}
        x={FACE.x}
        y={FACE.y}
        width={FACE.w}
        height={FACE.h}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}
