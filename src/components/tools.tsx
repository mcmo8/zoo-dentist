import type { PuzzleShape, ToolId } from '../game/types';

const INK = '#1d3557';

/* Original tool sprites, each drawn centered on (0,0) in a ~56px box. */

export function ToolSprite({ tool }: { tool: ToolId }) {
  switch (tool) {
    case 'magnifier':
      return (
        <g>
          <circle cx="-6" cy="-8" r="16" fill="#cfeaff" fillOpacity="0.75" stroke={INK} strokeWidth="4" />
          <circle cx="-6" cy="-8" r="10" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
          <line x1="6" y1="4" x2="20" y2="20" stroke="#e8633c" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
    case 'sprayer':
      return (
        <g>
          <rect x="-10" y="-6" width="20" height="28" rx="6" fill="#5fc9e8" stroke={INK} strokeWidth="3" />
          <rect x="-8" y="-18" width="12" height="12" rx="3" fill="#3a9ec4" stroke={INK} strokeWidth="3" />
          <rect x="2" y="-16" width="12" height="6" rx="3" fill="#3a9ec4" stroke={INK} strokeWidth="3" />
          <g stroke="#5fc9e8" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="-16" x2="24" y2="-19" />
            <line x1="18" y1="-12" x2="25" y2="-12" />
            <line x1="18" y1="-8" x2="24" y2="-5" />
          </g>
        </g>
      );
    case 'tweezers':
      return (
        <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M-6,-22 Q-14,0 -4,20" />
          <path d="M6,-22 Q14,0 4,20" />
          <circle cx="0" cy="-22" r="5" fill="#f4b860" stroke={INK} strokeWidth="3" />
        </g>
      );
    case 'brush':
      return (
        <g transform="rotate(-35)">
          <rect x="-6" y="-4" width="12" height="30" rx="5" fill="#f06292" stroke={INK} strokeWidth="3" />
          <rect x="-8" y="-22" width="16" height="20" rx="4" fill="#fff" stroke={INK} strokeWidth="3" />
          <ellipse cx="0" cy="-24" rx="7" ry="5" fill="#8ed3f5" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'drill':
      return (
        <g transform="rotate(40)">
          <rect x="-7" y="-2" width="14" height="26" rx="6" fill="#b6c4d6" stroke={INK} strokeWidth="3" />
          <polygon points="-4,-2 4,-2 1.5,-20 -1.5,-20" fill="#8494a8" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="0" cy="-22" r="3" fill="#5a6a7e" />
        </g>
      );
    case 'germspray':
      return (
        <g>
          <rect x="-9" y="-4" width="18" height="26" rx="6" fill="#9be37c" stroke={INK} strokeWidth="3" />
          <rect x="-5" y="-14" width="10" height="10" fill="#62b04a" stroke={INK} strokeWidth="3" />
          <rect x="-9" y="-20" width="14" height="7" rx="3" fill="#62b04a" stroke={INK} strokeWidth="3" />
          <circle cx="0" cy="8" r="6" fill="#fff" opacity="0.6" />
        </g>
      );
    case 'filler':
      return (
        <g transform="rotate(30)">
          <rect x="-8" y="-10" width="16" height="28" rx="5" fill="#f4b860" stroke={INK} strokeWidth="3" />
          <polygon points="-5,-10 5,-10 2,-22 -2,-22" fill="#e8975a" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <ellipse cx="0" cy="-24" rx="4" ry="3" fill="#cfeaff" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'forceps':
      return (
        <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M-12,-20 Q-18,4 -5,18 Q0,22 5,18 Q18,4 12,-20" />
          <path d="M-12,-20 Q-2,-10 0,2 M12,-20 Q2,-10 0,2" />
          <circle cx="-12" cy="-20" r="5" fill="#5fc9e8" stroke={INK} strokeWidth="3" />
          <circle cx="12" cy="-20" r="5" fill="#5fc9e8" stroke={INK} strokeWidth="3" />
        </g>
      );
    case 'implant':
      return (
        <g>
          <path
            d="M-12,-14 C-12,-22 -5,-24 0,-24 C5,-24 12,-22 12,-14 C12,-8 10,-4 9,2 C8.4,7 8,14 4.5,14 C1.5,14 2.5,4 0,4 C-2.5,4 -1.5,14 -4.5,14 C-8,14 -8.4,7 -9,2 C-10,-4 -12,-8 -12,-14 Z"
            fill="#fff"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M-6,-18 l 4,-3" stroke="#bfe3ff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case 'mouthwash':
      return (
        <g>
          <path d="M-12,-16 L12,-16 L9,18 L-9,18 Z" fill="#cfeaff" fillOpacity="0.8" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M-10.5,-6 L10.5,-6 L9,18 L-9,18 Z" fill="#7fd4a8" stroke="none" />
          <ellipse cx="0" cy="-6" rx="10.5" ry="3" fill="#a8e8c8" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'puzzle':
      return <PuzzlePiece shape="tri" />;
  }
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
