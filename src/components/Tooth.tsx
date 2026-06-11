import type { DebrisKind, PuzzleShape, ToothShape, ToothState } from '../game/types';

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

/** Crown silhouette in local coords (0,0..w,h). Biting edge faces
    y=h when dir='down' (top row) and y=0 when dir='up' (bottom row). */
export function toothPath(
  shape: ToothShape,
  w: number,
  h: number,
  dir: 'down' | 'up'
): string {
  const r = w * 0.24;
  // helper to flip y for dir 'down'
  const F = (y: number) => (dir === 'up' ? y : h - y);
  switch (shape) {
    case 'molar': {
      // two cusps at the biting edge, flat at the gum edge
      return [
        `M0,${F(h)}`,
        `L0,${F(h * 0.3)}`,
        `Q0,${F(0)} ${w * 0.27},${F(h * 0.04)}`,
        `Q${w * 0.5},${F(h * 0.24)} ${w * 0.73},${F(h * 0.04)}`,
        `Q${w},${F(0)} ${w},${F(h * 0.3)}`,
        `L${w},${F(h)}`,
        'Z',
      ].join(' ');
    }
    case 'fang': {
      return [
        `M${w * 0.1},${F(h)}`,
        `Q${w * 0.02},${F(h * 0.42)} ${w * 0.4},${F(h * 0.08)}`,
        `Q${w * 0.5},${F(0)} ${w * 0.6},${F(h * 0.08)}`,
        `Q${w * 0.98},${F(h * 0.42)} ${w * 0.9},${F(h)}`,
        'Z',
      ].join(' ');
    }
    case 'tusk': {
      return [
        `M${w * 0.18},${F(h)}`,
        `Q${w * 0.04},${F(h * 0.38)} ${w * 0.34},${F(h * 0.1)}`,
        `Q${w * 0.46},${F(0)} ${w * 0.62},${F(h * 0.12)}`,
        `Q${w * 0.96},${F(h * 0.5)} ${w * 0.84},${F(h)}`,
        'Z',
      ].join(' ');
    }
    case 'buck':
    case 'square':
    default: {
      // rounded rect; slightly rounder corners on the biting edge
      return [
        `M0,${F(h)}`,
        `L0,${F(r)}`,
        `Q0,${F(0)} ${r},${F(0)}`,
        `L${w - r},${F(0)}`,
        `Q${w},${F(0)} ${w},${F(r)}`,
        `L${w},${F(h)}`,
        'Z',
      ].join(' ');
    }
  }
}

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

function Germ({ s, wiggling }: { s: number; wiggling: boolean }) {
  return (
    <g className={wiggling ? 'zd-germ zd-wiggle' : 'zd-germ'}>
      <circle r={s} fill="#7ed26a" stroke={INK} strokeWidth="1.8" />
      <circle cx={-s * 0.32} cy={-s * 0.15} r={s * 0.18} fill="#fff" />
      <circle cx={s * 0.32} cy={-s * 0.15} r={s * 0.18} fill="#fff" />
      <circle cx={-s * 0.32} cy={-s * 0.15} r={s * 0.09} fill={INK} />
      <circle cx={s * 0.32} cy={-s * 0.15} r={s * 0.09} fill={INK} />
      <path d={`M${-s * 0.3},${s * 0.3} Q0,${s * 0.55} ${s * 0.3},${s * 0.3}`} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x={-s * 0.16} y={s * 0.3} width={s * 0.14} height={s * 0.18} rx={s * 0.04} fill="#fff" stroke={INK} strokeWidth="0.8" />
      <rect x={s * 0.04} y={s * 0.3} width={s * 0.14} height={s * 0.18} rx={s * 0.04} fill="#fff" stroke={INK} strokeWidth="0.8" />
      <path d={`M${-s * 0.75},${-s * 0.7} Q${-s * 0.5},${-s * 1.0} ${-s * 0.3},${-s * 0.75}`} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
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
  const { w, h, dir, shape } = p;
  const path = toothPath(shape, w, h, dir);
  // crown center (where problems sit): toward the biting edge
  const crownY = dir === 'up' ? h * 0.32 : h * 0.68;

  if (t.rot === 'gone') {
    // empty socket at the gum line
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

  const isRotten = t.rot === 'rotten';
  const isImplant = t.rot === 'implanted';
  const baseFill = isRotten ? '#9b8265' : isImplant ? '#ffffff' : '#fdfaf2';

  return (
    <g transform={`translate(${p.cx - w / 2},${p.cy - h / 2})`}>
    <g className={wiggling ? 'zd-wiggle' : undefined}>
      <path
        d={path}
        fill={baseFill}
        stroke={INK}
        strokeWidth="2.2"
        strokeLinejoin="round"
        className={highlight ? 'zd-target' : undefined}
      />
      {/* soft side shade */}
      <path d={path} fill="#1d3557" opacity={isRotten ? 0.18 : 0.06} transform={`translate(${w * 0.06},0) scale(0.88,1)`} />

      {isRotten && (
        <g stroke="#5d4a33" strokeWidth="1.6" strokeLinecap="round">
          <path d={`M${w * 0.3},${crownY - h * 0.18} l${w * 0.12},${h * 0.14} l${-w * 0.08},${h * 0.12}`} fill="none" />
          <path d={`M${w * 0.62},${crownY - h * 0.1} l${w * 0.1},${h * 0.12}`} fill="none" />
        </g>
      )}

      {/* problem overlays — dimmed until the magnifier reveals them */}
      <g className={revealed ? 'zd-revealed' : undefined} opacity={revealed ? 1 : 0.16}>
        {t.plaque > 0.02 && (
          <g opacity={Math.min(1, t.plaque * 0.9 + 0.1)}>
            <path d={path} fill="#c9a44a" opacity="0.75" />
            <circle cx={w * 0.32} cy={crownY} r={w * 0.08} fill="#8a6a1e" opacity="0.8" />
            <circle cx={w * 0.62} cy={crownY - h * 0.12} r={w * 0.06} fill="#8a6a1e" opacity="0.8" />
          </g>
        )}

        {t.cavity === 'hole' && (
          <g>
            <ellipse cx={w * 0.5} cy={crownY} rx={w * 0.2} ry={w * 0.16} fill="#3a2414" />
            <ellipse cx={w * 0.58} cy={crownY - h * 0.05} rx={w * 0.1} ry={w * 0.08} fill="#3a2414" />
            <g stroke="#3a2414" strokeWidth="1.3" strokeLinecap="round">
              <line x1={w * 0.3} y1={crownY - h * 0.12} x2={w * 0.4} y2={crownY - h * 0.04} />
              <line x1={w * 0.72} y1={crownY + h * 0.1} x2={w * 0.62} y2={crownY + h * 0.04} />
            </g>
          </g>
        )}
        {t.cavity === 'drilled' && (
          <ellipse cx={w * 0.5} cy={crownY} rx={w * 0.18} ry={w * 0.14} fill="#caa98a" stroke="#a3815f" strokeWidth="1.5" />
        )}
        {t.cavity === 'filled' && (
          <g>
            <ellipse cx={w * 0.5} cy={crownY} rx={w * 0.18} ry={w * 0.14} fill="#dbe7f0" stroke="#9fb4c4" strokeWidth="1.5" />
            <path d={`M${w * 0.42},${crownY - w * 0.06} l${w * 0.07},${-w * 0.05}`} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {t.chip !== 'none' && t.chipShape && (
          <g>
            <path
              d={chipNotchPath(t.chipShape, w, h, dir)}
              fill={t.chip === 'repaired' ? '#ffffff' : '#7a1f2b'}
              stroke={t.chip === 'repaired' ? '#bcd2e0' : INK}
              strokeWidth={t.chip === 'repaired' ? 1.4 : 2}
              strokeLinejoin="round"
            />
            {t.chip === 'broken' && (
              <g stroke={INK} strokeWidth="1.3" strokeLinecap="round">
                <line x1={w * 0.42} y1={dir === 'up' ? h * 0.12 : h * 0.88} x2={w * 0.34} y2={dir === 'up' ? h * 0.28 : h * 0.72} />
                <line x1={w * 0.5} y1={dir === 'up' ? h * 0.3 : h * 0.7} x2={w * 0.42} y2={dir === 'up' ? h * 0.44 : h * 0.56} />
              </g>
            )}
          </g>
        )}

        {t.debris && (
          <g transform={`translate(${w * 0.5},${crownY})`}>
            <DebrisSprite kind={t.debris} s={w * 0.32} />
          </g>
        )}

        {t.germ && (
          <g transform={`translate(${w * 0.5},${dir === 'up' ? -w * 0.18 : h + w * 0.18})`}>
            <Germ s={w * 0.3} wiggling={false} />
          </g>
        )}
      </g>

      {isImplant && (
        <path d={`M${w * 0.26},${crownY - h * 0.2} l${w * 0.1},${-w * 0.12}`} stroke="#bfe3ff" strokeWidth="2.4" strokeLinecap="round" />
      )}

      {t.sparkle && (
        <g transform={`translate(${w * 0.5},${crownY})`}>
          <g className="zd-spark">
            <path
              d={`M0,${-w * 0.42} L${w * 0.1},${-w * 0.1} L${w * 0.42},0 L${w * 0.1},${w * 0.1} L0,${w * 0.42} L${-w * 0.1},${w * 0.1} L${-w * 0.42},0 L${-w * 0.1},${-w * 0.1} Z`}
              fill="#ffe066"
              stroke="#fff"
              strokeWidth="1"
            />
          </g>
        </g>
      )}
    </g>
    </g>
  );
}
