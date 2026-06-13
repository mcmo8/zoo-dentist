import type { DebrisKind, PuzzleShape, ToothShape, ToothState } from '../game/types';
import { TOOTH_ART, EFFECT_ART } from '../game/assets';

export interface ToothPlacement {
  index: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  dir: 'down' | 'up'; // down = hangs from top gum
  shape: ToothShape;
}

const INK = '#1d3557';

/* Tooth art is now the finished WebP tooth-state set (clean / plaque / hole /
   filling / rotten / shaking), composited over a clean white-bodied base. The
   per-animal crown SHAPE (fang/molar/tusk) is replaced by the uniform art
   molar; the mouth layout still varies the count, size and position of teeth,
   and hit-testing is unchanged (it keys off the slot's cx/cy/w/h).

   Two things stay procedural on purpose:
   - the chip NOTCH (tri/square/round) — its silhouette must match the tray
     puzzle piece the child picks, so the shape has to be visible;
   - the DebrisSprite food shapes — the art set only ships a candy, but the five
     food kinds (candy/carrot/leaf/bone/fish) read better as distinct sprites. */

// teeth WebP intrinsic aspect (width / height) after prep crop.
const TOOTH_ASPECT = 0.86;

function DebrisSprite({ kind, s }: { kind: DebrisKind; s: number }) {
  switch (kind) {
    case 'candy':
      return (
        <g>
          <polygon points={`${-s * 0.9},0 ${-s * 0.45},${-s * 0.35} ${-s * 0.45},${s * 0.35}`} fill="#ff7bac" stroke={INK} strokeWidth="1.4" />
          <polygon points={`${s * 0.9},0 ${s * 0.45},${-s * 0.35} ${s * 0.45},${s * 0.35}`} fill="#ff7bac" stroke={INK} strokeWidth="1.4" />
          <circle r={s * 0.5} fill="#ffd1e3" stroke={INK} strokeWidth="1.6" />
          <path d={`M${-s * 0.2},${-s * 0.3} Q0,0 ${-s * 0.2},${s * 0.3}`} fill="none" stroke="#ff7bac" strokeWidth="2" />
        </g>
      );
    case 'carrot':
      return (
        <g transform="rotate(-25)">
          <path d={`M${-s * 0.6},${-s * 0.35} L${s * 0.7},0 L${-s * 0.6},${s * 0.35} Q${-s * 0.85},0 ${-s * 0.6},${-s * 0.35} Z`} fill="#ff8e3c" stroke={INK} strokeWidth="1.6" />
          <path d={`M${-s * 0.55},${-s * 0.3} q ${s * 0.25},${s * 0.3} 0,${s * 0.6}`} fill="none" stroke="#d96a1e" strokeWidth="1.4" />
        </g>
      );
    case 'leaf':
      return (
        <g transform="rotate(18)">
          <path d={`M0,${-s * 0.7} Q${s * 0.7},${-s * 0.2} 0,${s * 0.7} Q${-s * 0.7},${-s * 0.2} 0,${-s * 0.7} Z`} fill="#6fce62" stroke={INK} strokeWidth="1.6" />
          <line y1={-s * 0.55} y2={s * 0.55} stroke="#3f9a35" strokeWidth="1.4" />
        </g>
      );
    case 'bone':
      return (
        <g transform="rotate(-15)">
          <rect x={-s * 0.55} y={-s * 0.16} width={s * 1.1} height={s * 0.32} rx={s * 0.16} fill="#f5efe0" stroke={INK} strokeWidth="1.4" />
          {[-1, 1].map((e) => (
            <g key={e}>
              <circle cx={e * s * 0.55} cy={-s * 0.18} r={s * 0.2} fill="#f5efe0" stroke={INK} strokeWidth="1.4" />
              <circle cx={e * s * 0.55} cy={s * 0.18} r={s * 0.2} fill="#f5efe0" stroke={INK} strokeWidth="1.4" />
            </g>
          ))}
        </g>
      );
    case 'fish':
      return (
        <g transform="rotate(12)">
          <ellipse rx={s * 0.55} ry={s * 0.32} fill="#9fd8e8" stroke={INK} strokeWidth="1.4" />
          <polygon points={`${s * 0.45},0 ${s * 0.85},${-s * 0.3} ${s * 0.85},${s * 0.3}`} fill="#9fd8e8" stroke={INK} strokeWidth="1.4" />
          <circle cx={-s * 0.28} cy={-s * 0.06} r={s * 0.07} fill={INK} />
        </g>
      );
  }
}

/** Notch wedge for chipped teeth — the bite missing from a biting-edge corner. */
function chipNotchPath(shape: PuzzleShape, w: number, h: number, dir: 'down' | 'up'): string {
  const F = (y: number) => (dir === 'up' ? y : h - y);
  const x0 = w * 0.5;
  const nw = w * 0.5;
  const nh = h * 0.38;
  switch (shape) {
    case 'tri':
      return `M${x0},${F(0)} L${x0 + nw},${F(0)} L${x0 + nw * 0.5},${F(nh)} Z`;
    case 'square':
      return `M${x0},${F(0)} L${x0 + nw},${F(0)} L${x0 + nw},${F(nh * 0.8)} L${x0},${F(nh * 0.8)} Z`;
    case 'round':
      return dir === 'up'
        ? `M${x0},0 A${nw / 2},${nh} 0 0 0 ${x0 + nw},0 Z`
        : `M${x0},${h} A${nw / 2},${nh} 0 0 1 ${x0 + nw},${h} Z`;
  }
}

/** Dominant tooth-surface art layered over the clean base (null = stays clean). */
function surfaceArt(
  t: ToothState,
  wiggling: boolean
): { src: string; opacity: number } | null {
  if (t.rot === 'rotten') return { src: wiggling ? TOOTH_ART.shaking : TOOTH_ART.rotten, opacity: 1 };
  if (t.cavity === 'hole') return { src: TOOTH_ART.hole, opacity: 1 };
  if (t.cavity === 'filled') return { src: TOOTH_ART.filling, opacity: 1 };
  if (t.plaque > 0.02) return { src: TOOTH_ART.plaque, opacity: Math.min(1, t.plaque * 0.85 + 0.15) };
  // implanted / drilled / repaired / clean all read as the clean base
  return null;
}

export function Tooth({
  p,
  t,
  revealed,
  wiggling,
  highlight,
}: {
  p: ToothPlacement;
  t: ToothState;
  revealed: boolean;
  wiggling: boolean;
  highlight: boolean;
}) {
  const { w, h, dir } = p;
  // crown center (where loose problems sit): toward the biting edge
  const crownY = dir === 'up' ? h * 0.34 : h * 0.66;

  if (t.rot === 'gone') {
    // empty socket at the gum line (procedural — a gum gap, not a tooth)
    const sockY = dir === 'up' ? h * 0.85 : h * 0.15;
    return (
      <g transform={`translate(${p.cx - w / 2},${p.cy - h / 2})`}>
        <ellipse
          cx={w / 2}
          cy={sockY}
          rx={w * 0.34}
          ry={h * 0.14}
          fill="#5e1620"
          stroke="#9c3246"
          strokeWidth="2"
          className={highlight ? 'zd-target' : undefined}
        />
      </g>
    );
  }

  const DW = w * 1.08;          // displayed tooth width
  const DH = DW / TOOTH_ASPECT; // proportional height
  const surface = surfaceArt(t, wiggling);
  const dim = revealed ? 1 : 0.16;

  return (
    <g transform={`translate(${p.cx - w / 2},${p.cy - h / 2})`}>
      <g className={wiggling ? 'zd-wiggle' : undefined}>
        {highlight && (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={DW * 0.52}
            ry={DH * 0.46}
            fill="#ffe066"
            opacity="0.5"
            className="zd-target"
          />
        )}

        {/* tooth body (art), crown flipped to point down on the top row */}
        <g
          transform={`translate(${w / 2},${h / 2})${dir === 'down' ? ' scale(1,-1)' : ''}`}
        >
          <image href={TOOTH_ART.clean} x={-DW / 2} y={-DH / 2} width={DW} height={DH} preserveAspectRatio="xMidYMid meet" />
          {surface && (
            <image
              href={surface.src}
              x={-DW / 2}
              y={-DH / 2}
              width={DW}
              height={DH}
              preserveAspectRatio="xMidYMid meet"
              opacity={dim * surface.opacity}
              className={revealed ? 'zd-revealed' : undefined}
            />
          )}
        </g>

        {/* problem overlays in upright local coords, dimmed until revealed */}
        {t.chip !== 'none' && t.chip !== 'repaired' && t.chipShape && (
          <g opacity={dim} className={revealed ? 'zd-revealed' : undefined}>
            <path
              d={chipNotchPath(t.chipShape, w, h, dir)}
              fill="#7a1f2b"
              stroke={INK}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        )}

        {t.germ && (
          <g
            transform={`translate(${w * 0.5},${crownY})`}
            opacity={dim}
            className={revealed ? 'zd-revealed' : undefined}
          >
            <g className="zd-germ">
              <image
                href={EFFECT_ART.germGreen}
                x={-w * 0.42}
                y={-w * 0.42}
                width={w * 0.84}
                height={w * 0.84}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </g>
        )}

        {t.debris && (
          <g
            transform={`translate(${w * 0.5},${crownY})`}
            opacity={dim}
            className={revealed ? 'zd-revealed' : undefined}
          >
            <DebrisSprite kind={t.debris} s={w * 0.32} />
          </g>
        )}

        {t.sparkle && (
          <g transform={`translate(${w * 0.5},${crownY})`}>
            <g className="zd-spark">
              <image
                href={EFFECT_ART.sparkle}
                x={-w * 0.5}
                y={-w * 0.5}
                width={w}
                height={w}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </g>
        )}
      </g>
    </g>
  );
}
