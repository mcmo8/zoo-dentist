import type { AnimalSpec } from '../game/types';
import { animalArt } from '../game/assets';

export type Expression = 'sad' | 'open' | 'wince' | 'happy';

/* The animal head is now finished art (transparent SVG from the manifest)
   rendered as a single <image>. It is fitted into a face box in the shared
   scene coordinate system so the art's mouth lands near the mouth board at
   (180, 262); in treatment the open-mouth board (Mouth.tsx) is composited on
   top, covering the art's drawn mouth. The art is a fixed expression, so the
   `expr` prop no longer changes the drawing (kept for API compatibility; the
   Treatment screen conveys wince/ reactions with a CSS nudge on the face). */

const FACE = { x: 18, y: 4, w: 324, h: 372 };

export function AnimalFace({
  spec,
}: {
  spec: AnimalSpec;
  expr?: Expression;
  mouthOpen?: boolean;
}) {
  return (
    <image
      href={animalArt(spec.id)}
      x={FACE.x}
      y={FACE.y}
      width={FACE.w}
      height={FACE.h}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
