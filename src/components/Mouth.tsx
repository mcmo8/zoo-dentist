import type { AnimalSpec, ToothState } from '../game/types';
import { Tooth, type ToothPlacement } from './Tooth';

/* ONE fixed generic open-mouth board for every patient (R2 redesign). The animal
   head sits behind it; this is a consistent UI smile, not each animal's real
   mouth. A full upper + lower arch of snug teeth sits on the pink gums, with a
   dark throat between and the tongue at the bottom. Scene coords (360x560 SVG),
   mouth centered at (180, 262). */

export const MOUTH_CX = 180;
export const MOUTH_CY = 262;
export const MOUTH_RX = 150; // used by inMouth() for the whole-mouth rinse steps
export const MOUTH_RY = 124;

// ---- teeth arch geometry ----
const TOOTH_W = 52; // square sprite size (snug: content ~= SPACING)
const SPACING = 42; // tooth center-to-center
const UPPER_CY = 216; // upper row center y (crowns hang down)
const LOWER_CY = 312; // lower row center y (crowns rise up)
const ROW_CURVE = 9; // gentle smile arch (center teeth a touch lower)

function rowPlacements(
  n: number,
  baseCy: number,
  dir: 'down' | 'up',
  startIndex: number
): ToothPlacement[] {
  const out: ToothPlacement[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : (i - (n - 1) / 2) / ((n - 1) / 2); // -1..1
    const cx = MOUTH_CX + (i - (n - 1) / 2) * SPACING;
    const cy = baseCy + ROW_CURVE * (1 - t * t); // center sits slightly lower
    out.push({ index: startIndex + i, cx, cy, w: TOOTH_W, h: TOOTH_W, dir, shape: 'square' });
  }
  return out;
}

export function computeToothLayout(spec: AnimalSpec): ToothPlacement[] {
  // The mouth is uniform (animals.ts SMILE), so this arch is identical for all
  // patients; we still read the counts to stay in lockstep with the engine.
  const nTop = spec.mouth.top.length;
  const nBot = spec.mouth.bottom.length;
  return [
    ...rowPlacements(nTop, UPPER_CY, 'down', 0),
    ...rowPlacements(nBot, LOWER_CY, 'up', nTop),
  ];
}

// gum-line y where each row's roots tuck in (matches the tooth root edge)
const UPPER_GUM = UPPER_CY - TOOTH_W / 2 + ROW_CURVE + 6; // ~ just over upper roots
const LOWER_GUM = LOWER_CY + TOOTH_W / 2 - ROW_CURVE - 6; // ~ just under lower roots
const GUM = '#e07d92';
const GUM_DARK = '#c4566b';

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
  void spec;
  const L = MOUTH_CX - MOUTH_RX;
  const R = MOUTH_CX + MOUTH_RX;
  const TOP = MOUTH_CY - MOUTH_RY;
  const BOT = MOUTH_CY + MOUTH_RY;
  const clipId = 'zd-mouth-clip';

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={MOUTH_CX} cy={MOUTH_CY} rx={MOUTH_RX} ry={MOUTH_RY} />
        </clipPath>
      </defs>

      {/* lip rim */}
      <ellipse
        cx={MOUTH_CX}
        cy={MOUTH_CY}
        rx={MOUTH_RX}
        ry={MOUTH_RY}
        fill="#8c2438"
        stroke="#5e1620"
        strokeWidth="5"
      />

      <g clipPath={`url(#${clipId})`}>
        {/* dark throat */}
        <rect x={L} y={TOP} width={MOUTH_RX * 2} height={MOUTH_RY * 2} fill="#6d1a2b" />

        {/* upper gum (pink), bottom edge curves along the upper gum line */}
        <path
          d={`M${L},${TOP} L${R},${TOP} L${R},${UPPER_GUM} Q${MOUTH_CX},${UPPER_GUM + 14} ${L},${UPPER_GUM} Z`}
          fill={GUM}
        />
        {/* lower gum (pink), top edge curves along the lower gum line */}
        <path
          d={`M${L},${LOWER_GUM} Q${MOUTH_CX},${LOWER_GUM - 14} ${R},${LOWER_GUM} L${R},${BOT} L${L},${BOT} Z`}
          fill={GUM}
        />

        {/* tongue, behind the lower teeth */}
        <ellipse cx={MOUTH_CX} cy={BOT - 28} rx={96} ry={48} fill="#f08aa2" stroke={GUM_DARK} strokeWidth="3" />
        <path d={`M${MOUTH_CX},${BOT - 64} v 42`} stroke={GUM_DARK} strokeWidth="3" strokeLinecap="round" />

        {/* teeth — snug arch, roots seated on the gums */}
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

        {/* gum-line ridges drawn over the root ends so teeth tuck into the gum */}
        <path
          d={`M${L},${UPPER_GUM} Q${MOUTH_CX},${UPPER_GUM + 14} ${R},${UPPER_GUM}`}
          fill="none"
          stroke={GUM}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d={`M${L},${LOWER_GUM} Q${MOUTH_CX},${LOWER_GUM - 14} ${R},${LOWER_GUM}`}
          fill="none"
          stroke={GUM}
          strokeWidth="16"
          strokeLinecap="round"
        />
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
