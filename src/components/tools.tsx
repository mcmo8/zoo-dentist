import type { PuzzleShape, ToolId } from '../game/types';
import { toolArt } from '../game/assets';

const INK = '#1d3557';

/* Tool sprites are now finished art (transparent SVG from the manifest),
   rendered as a single <image> centered on (0,0) and fitted into a tray-icon
   box. The puzzle "pieces" stay procedural: their tri/square/round silhouette
   has to match the chip notch on the tooth, so the shape is gameplay, not art. */

const TOOL_W = 60;
const TOOL_H = 78;

export function ToolSprite({ tool }: { tool: ToolId }) {
  return (
    <image
      href={toolArt(tool)}
      x={-TOOL_W / 2}
      y={-TOOL_H / 2}
      width={TOOL_W}
      height={TOOL_H}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

export function PuzzlePiece({ shape }: { shape: PuzzleShape }) {
  switch (shape) {
    case 'tri':
      return (
        <polygon points="-14,-12 14,-12 0,14" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      );
    case 'square':
      return <rect x="-13" y="-11" width="26" height="22" rx="3" fill="#fff" stroke={INK} strokeWidth="3" />;
    case 'round':
      return (
        <path d="M-14,-10 A14,18 0 0 0 14,-10 L14,-10 L-14,-10 Z" transform="rotate(180)" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      );
  }
}
