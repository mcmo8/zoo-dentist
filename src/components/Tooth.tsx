import type { DebrisKind, PuzzleShape, ToothShape, ToothState } from '../game/types';
import { TOOTH_ART, EFFECT_ART } from '../game/assets';

export interface ToothPlacement {
  index: number;
  cx: number;
  cy: number;
  w: number; // square display size of the tooth sprite
  h: number; // ~= w (the tooth WebP canvas is square); kept for hit-test math
  dir: 'down' | 'up'; // down = hangs from the top gum (crown points down)
  shape: ToothShape;
}

const INK = '#1d3557';

/* Each tooth is the finished WebP art, drawn as a square sprite centered on its
   arch slot (the WebP canvas is 256x256 with the tooth centered + transparent
   margins, so no white card is needed behind it). The upper row is flipped
   vertically so its crowns point down toward the mouth.

   Clean = teeth/item_1; problem surfaces (plaque/hole/filling/rotten) swap the
   sprite. Germ + sparkle come from effects/. Two things stay procedural:
   - the chip NOTCH (tri/square/round) — its shape must match the tray puzzle
     piece the child picks, so it has to be visible;
   - the DebrisSprite food shapes (no art for carrot/leaf/bone/fish). */

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

/** Missing-corner wedge at the biting edge; its shape must read so the child can
 *  pick the matching tray piece. */
function ChipNotch({
  shape,
  s,
  dir,
  smoothed,
}: {
  shape: PuzzleShape;
  s: number;
  dir: 'down' | 'up';
  smoothed: boolean;
}) {
  const edge = dir === 'down' ? s * 0.4 : -s * 0.4; // biting-edge y
  const into = dir === 'down' ? -1 : 1; // toward tooth center
  const x0 = s * 0.04;
  const w = s * 0.34;
  const d = s * 0.3 * into;
  const fill = smoothed ? '#e7d8c4' : '#7a1f2b';
  const stroke = smoothed ? '#b9a78f' : INK;
  let dPath: string;
  if (shape === 'tri') {
    dPath = `M${x0},${edge} L${x0 + w},${edge} L${x0 + w / 2},${edge + d} Z`;
  } else if (shape === 'square') {
    dPath = `M${x0},${edge} L${x0 + w},${edge} L${x0 + w},${edge + d} L${x0},${edge + d} Z`;
  } else {
    const sweep = dir === 'down' ? 1 : 0;
    dPath = `M${x0},${edge} A${w / 2},${Math.abs(d)} 0 0 ${sweep} ${x0 + w},${edge} Z`;
  }
  return <path d={dPath} fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />;
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
  return null; // implanted / drilled / repaired / clean
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
  const { cx, cy, w, dir } = p;
  const dim = revealed ? 1 : 0.16;
  const toCrown = dir === 'down' ? 1 : -1; // sign toward the biting edge

  if (t.rot === 'gone') {
    // empty socket at the gum line (root side), procedural — it's a gum gap
    return (
      <g transform={`translate(${cx},${cy})`}>
        <ellipse
          cx={0}
          cy={-toCrown * w * 0.32}
          rx={w * 0.3}
          ry={w * 0.13}
          fill="#5e1620"
          stroke="#9c3246"
          strokeWidth="2"
          className={highlight ? 'zd-target' : undefined}
        />
      </g>
    );
  }

  const surface = surfaceArt(t, wiggling);

  return (
    <g transform={`translate(${cx},${cy})`}>
      {highlight && (
        <ellipse cx={0} cy={0} rx={w * 0.5} ry={w * 0.54} fill="#ffe066" opacity="0.5" className="zd-target" />
      )}

      <g className={wiggling ? 'zd-wiggle' : undefined}>
        {/* tooth body — square sprite, crown flipped down on the top row */}
        <g transform={dir === 'down' ? 'scale(1,-1)' : undefined}>
          <image href={TOOTH_ART.clean} x={-w / 2} y={-w / 2} width={w} height={w} preserveAspectRatio="xMidYMid meet" />
          {surface && (
            <image
              href={surface.src}
              x={-w / 2}
              y={-w / 2}
              width={w}
              height={w}
              preserveAspectRatio="xMidYMid meet"
              opacity={dim * surface.opacity}
              className={revealed ? 'zd-revealed' : undefined}
            />
          )}
        </g>

        {/* problem overlays in upright coords, dimmed until revealed */}
        {(t.chip === 'broken' || t.chip === 'smoothed') && t.chipShape && (
          <g opacity={dim} className={revealed ? 'zd-revealed' : undefined}>
            <ChipNotch shape={t.chipShape} s={w} dir={dir} smoothed={t.chip === 'smoothed'} />
          </g>
        )}

        {t.germ && (
          <g transform={`translate(0,${toCrown * w * 0.1})`} opacity={dim} className={revealed ? 'zd-revealed' : undefined}>
            <g className="zd-germ">
              <image href={EFFECT_ART.germGreen} x={-w * 0.4} y={-w * 0.4} width={w * 0.8} height={w * 0.8} preserveAspectRatio="xMidYMid meet" />
            </g>
          </g>
        )}

        {t.debris && (
          <g transform={`translate(0,${toCrown * w * 0.12})`} opacity={dim} className={revealed ? 'zd-revealed' : undefined}>
            <DebrisSprite kind={t.debris} s={w * 0.28} />
          </g>
        )}

        {t.sparkle && (
          <g transform={`translate(0,${toCrown * w * 0.08})`}>
            <g className="zd-spark">
              <image href={EFFECT_ART.sparkle} x={-w * 0.5} y={-w * 0.5} width={w} height={w} preserveAspectRatio="xMidYMid meet" />
            </g>
          </g>
        )}
      </g>
    </g>
  );
}
