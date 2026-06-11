import type { AnimalSpec } from '../game/types';

export type Expression = 'sad' | 'open' | 'wince' | 'happy';

const INK = '#1d3557';

/* Original cartoon heads drawn around the mouth board at (180, 262).
   `mouthOpen` = treatment mode: the Mouth component draws the opening,
   so the face draws no mouth of its own. Otherwise a closed mouth is
   drawn matching the expression (lobby cards, celebration). */

function Eyes({ expr, y = 118 }: { expr: Expression; y?: number }) {
  const L = 122;
  const R = 238;
  if (expr === 'wince') {
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d={`M${L - 16},${y} l 14,-7 l -14,-7`} transform={`translate(0,7)`} />
        <path d={`M${R + 16},${y} l -14,-7 l 14,-7`} transform={`translate(0,7)`} />
      </g>
    );
  }
  if (expr === 'happy') {
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d={`M${L - 14},${y + 4} q 14,-16 28,0`} />
        <path d={`M${R - 14},${y + 4} q 14,-16 28,0`} />
      </g>
    );
  }
  // round open eyes; sad adds tilted brows + a tear
  return (
    <g>
      <ellipse cx={L} cy={y} rx="15" ry="17" fill="#fff" stroke={INK} strokeWidth="3" />
      <ellipse cx={R} cy={y} rx="15" ry="17" fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx={L + (expr === 'sad' ? 0 : 2)} cy={y + 3} r="6.5" fill={INK} />
      <circle cx={R + (expr === 'sad' ? 0 : 2)} cy={y + 3} r="6.5" fill={INK} />
      <circle cx={L + 4} cy={y - 1} r="2" fill="#fff" />
      <circle cx={R + 6} cy={y - 1} r="2" fill="#fff" />
      {expr === 'sad' && (
        <g>
          <path d={`M${L - 16},${y - 24} l 26,8`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d={`M${R + 16},${y - 24} l -26,8`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path
            d={`M${L - 24},${y + 14} q -6,14 2,18 q 8,3 8,-8 q 0,-6 -10,-10`}
            fill="#8ed3f5"
            stroke="#5aa8d6"
            strokeWidth="2"
          />
        </g>
      )}
    </g>
  );
}

function ClosedMouth({ expr }: { expr: Expression }) {
  if (expr === 'happy') {
    return (
      <g>
        <path
          d="M110,240 Q180,320 250,240 Q180,276 110,240 Z"
          fill="#8c2438"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M126,252 q 54,30 108,0 l -8,14 q -46,22 -92,0 Z" fill="#fff" stroke={INK} strokeWidth="2" />
        <path d="M150,236 l 6,8 M210,236 l -6,8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  if (expr === 'sad') {
    return (
      <path
        d="M140,272 Q180,240 220,272"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
      />
    );
  }
  return (
    <path d="M150,260 Q180,278 210,260" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
  );
}

export function AnimalFace({
  spec,
  expr,
  mouthOpen,
}: {
  spec: AnimalSpec;
  expr: Expression;
  mouthOpen: boolean;
}) {
  const { skin, skinDark, accent } = spec;
  const cheeks = (
    <g fill={accent} opacity="0.55">
      <ellipse cx="64" cy="178" rx="20" ry="14" />
      <ellipse cx="296" cy="178" rx="20" ry="14" />
    </g>
  );

  let extras: JSX.Element | null = null;
  let head = (
    <rect x="10" y="36" width="340" height="392" rx="120" fill={skin} stroke={INK} strokeWidth="5" />
  );

  switch (spec.id) {
    case 'bunny':
      extras = (
        <g>
          <g stroke={INK} strokeWidth="5">
            <ellipse cx="112" cy="6" rx="34" ry="78" fill={skin} transform="rotate(-10 112 6)" />
            <ellipse cx="248" cy="6" rx="34" ry="78" fill={skin} transform="rotate(10 248 6)" />
            <ellipse cx="112" cy="10" rx="17" ry="52" fill="#f4a8c0" transform="rotate(-10 112 10)" strokeWidth="0" />
            <ellipse cx="248" cy="10" rx="17" ry="52" fill="#f4a8c0" transform="rotate(10 248 10)" strokeWidth="0" />
          </g>
          <polygon points="172,132 188,132 180,144" fill="#f06292" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
      break;
    case 'monkey':
      extras = (
        <g>
          <circle cx="34" cy="150" r="38" fill={skin} stroke={INK} strokeWidth="5" />
          <circle cx="326" cy="150" r="38" fill={skin} stroke={INK} strokeWidth="5" />
          <circle cx="34" cy="150" r="20" fill={accent} />
          <circle cx="326" cy="150" r="20" fill={accent} />
          <path
            d="M70,120 Q180,30 290,120 Q290,210 180,206 Q70,210 70,120 Z"
            fill={accent}
            opacity="0.6"
          />
        </g>
      );
      break;
    case 'hippo':
      head = (
        <rect x="6" y="48" width="348" height="380" rx="130" fill={skin} stroke={INK} strokeWidth="5" />
      );
      extras = (
        <g>
          <ellipse cx="92" cy="48" rx="26" ry="20" fill={skin} stroke={INK} strokeWidth="5" />
          <ellipse cx="268" cy="48" rx="26" ry="20" fill={skin} stroke={INK} strokeWidth="5" />
          <ellipse cx="92" cy="50" rx="12" ry="9" fill={accent} />
          <ellipse cx="268" cy="50" rx="12" ry="9" fill={accent} />
          <ellipse cx="146" cy="152" rx="11" ry="15" fill={skinDark} />
          <ellipse cx="214" cy="152" rx="11" ry="15" fill={skinDark} />
        </g>
      );
      break;
    case 'elephant':
      extras = (
        <g>
          <ellipse cx="26" cy="170" rx="46" ry="62" fill={skinDark} stroke={INK} strokeWidth="5" />
          <ellipse cx="334" cy="170" rx="46" ry="62" fill={skinDark} stroke={INK} strokeWidth="5" />
          <ellipse cx="30" cy="170" rx="28" ry="44" fill={accent} opacity="0.7" />
          <ellipse cx="330" cy="170" rx="28" ry="44" fill={accent} opacity="0.7" />
          {/* trunk lifted out of the way, curling up the right side */}
          <path
            d="M298,236 Q346,250 340,300 Q334,348 296,338 Q318,322 314,298 Q310,268 286,260 Z"
            fill={skin}
            stroke={INK}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <ellipse cx="305" cy="334" rx="11" ry="8" fill={skinDark} />
        </g>
      );
      break;
    case 'croc':
      head = (
        <g>
          <rect x="14" y="60" width="332" height="370" rx="110" fill={skin} stroke={INK} strokeWidth="5" />
          {/* brow bumps the eyes sit on */}
          <circle cx="122" cy="96" r="42" fill={skin} stroke={INK} strokeWidth="5" />
          <circle cx="238" cy="96" r="42" fill={skin} stroke={INK} strokeWidth="5" />
          {/* back ridges */}
          <path d="M60,64 l 18,-22 l 16,22 M150,52 l 18,-22 l 16,22 M250,58 l 18,-22 l 16,22" fill={skinDark} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </g>
      );
      extras = (
        <g>
          <ellipse cx="150" cy="150" rx="9" ry="12" fill={skinDark} />
          <ellipse cx="210" cy="150" rx="9" ry="12" fill={skinDark} />
        </g>
      );
      break;
    case 'lion':
      extras = (
        <g>
          <g fill={skinDark} stroke={INK} strokeWidth="4">
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const x = 180 + Math.cos(a) * 168;
              const y = 226 + Math.sin(a) * 196;
              return <circle key={i} cx={x} cy={y} r="42" />;
            })}
          </g>
          <rect x="10" y="36" width="340" height="392" rx="120" fill={spec.skin} stroke={INK} strokeWidth="5" />
          <circle cx="78" cy="60" r="26" fill={spec.skin} stroke={INK} strokeWidth="5" />
          <circle cx="282" cy="60" r="26" fill={spec.skin} stroke={INK} strokeWidth="5" />
          <circle cx="78" cy="62" r="12" fill={accent} />
          <circle cx="282" cy="62" r="12" fill={accent} />
          <polygon points="170,150 190,150 180,164" fill="#b85c38" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </g>
      );
      break;
  }

  return (
    <g>
      {spec.id === 'lion' ? null : head}
      {extras}
      {cheeks}
      <Eyes expr={expr} y={spec.id === 'croc' ? 96 : 118} />
      {!mouthOpen && <ClosedMouth expr={expr} />}
    </g>
  );
}
