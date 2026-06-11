import type { AnimalSpec, ToothShape, ToothState } from '../game/types';
import { Tooth, type ToothPlacement } from './Tooth';

/* The mouth is the play board. Scene coords: the open mouth is centered at
   (180, 262) inside the 360x430 face area of the treatment SVG. */

export const MOUTH_CX = 180;
export const MOUTH_CY = 262;
export const MOUTH_RX = 148;
export const MOUTH_RY = 112;

const H_FACTOR: Record<ToothShape, number> = {
  square: 1.0,
  buck: 1.35,
  molar: 0.95,
  fang: 1.22,
  tusk: 1.42,
};

export function computeToothLayout(spec: AnimalSpec): ToothPlacement[] {
  const placements: ToothPlacement[] = [];
  let index = 0;
  (['top', 'bottom'] as const).forEach((row) => {
    const shapes = spec.mouth[row];
    const n = shapes.length;
    const w = Math.max(30, Math.min(56, 264 / n - 6));
    const gap = Math.min(10, (264 - w * n) / Math.max(1, n - 1));
    shapes.forEach((shape, i) => {
      const h = w * H_FACTOR[shape];
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1..1 across the row
      const arch = 12 * (1 - t * t); // center of the row bulges toward middle
      const cx = MOUTH_CX + (i - (n - 1) / 2) * (w + gap);
      const cy =
        row === 'top'
          ? MOUTH_CY - 86 + arch * 0.45 + h / 2 - 10
          : MOUTH_CY + 86 - arch * 0.45 - h / 2 + 10;
      placements.push({
        index,
        cx,
        cy,
        w,
        h,
        dir: row === 'top' ? 'down' : 'up',
        shape,
      });
      index++;
    });
  });
  return placements;
}

export function Mouth({
  spec,
  teeth,
  layout,
  revealed,
  wigglingTooth,
  targetTeeth,
  stinkOpacity,
}: {
  spec: AnimalSpec;
  teeth: ToothState[];
  layout: ToothPlacement[];
  revealed: Set<number>;
  wigglingTooth: number | null;
  targetTeeth: Set<number>;
  stinkOpacity: number;
}) {
  return (
    <g>
      {/* open mouth interior */}
      <ellipse
        cx={MOUTH_CX}
        cy={MOUTH_CY}
        rx={MOUTH_RX}
        ry={MOUTH_RY}
        fill="#8c2438"
        stroke="#1d3557"
        strokeWidth="4"
      />
      <ellipse cx={MOUTH_CX} cy={MOUTH_CY + 14} rx={MOUTH_RX * 0.78} ry={MOUTH_RY * 0.72} fill="#6d1a2b" />

      {/* tongue */}
      <ellipse cx={MOUTH_CX} cy={MOUTH_CY + 78} rx={92} ry={42} fill="#f08aa2" stroke="#c4566b" strokeWidth="3" />
      <path
        d={`M${MOUTH_CX},${MOUTH_CY + 48} v 40`}
        stroke="#c4566b"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* gum bands */}
      <path
        d={`M${MOUTH_CX - 132},${MOUTH_CY - 64} Q${MOUTH_CX},${MOUTH_CY - 122} ${MOUTH_CX + 132},${MOUTH_CY - 64}`}
        fill="none"
        stroke="#d9697f"
        strokeWidth="42"
        strokeLinecap="round"
      />
      <path
        d={`M${MOUTH_CX - 124},${MOUTH_CY + 70} Q${MOUTH_CX},${MOUTH_CY + 120} ${MOUTH_CX + 124},${MOUTH_CY + 70}`}
        fill="none"
        stroke="#d9697f"
        strokeWidth="36"
        strokeLinecap="round"
      />

      {/* teeth */}
      {layout.map((p) => (
        <Tooth
          key={p.index}
          p={p}
          t={teeth[p.index]}
          revealed={revealed.has(p.index)}
          wiggling={wigglingTooth === p.index}
          highlight={targetTeeth.has(p.index)}
        />
      ))}

      {/* stink cloud drifting out of the mouth */}
      {stinkOpacity > 0.02 && (
        <g opacity={stinkOpacity} className="zd-stink">
          <g transform={`translate(${MOUTH_CX + 108},${MOUTH_CY - 64})`}>
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
