import * as sfx from '../lib/sfx';

export function Title({
  onPlay,
  muted,
  onToggleMute,
}: {
  onPlay: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="zd-screen zd-title">
      <button className="zd-sound" onClick={onToggleMute} aria-label="Sound">
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="zd-title-art">
        <svg viewBox="0 0 200 170" width="min(60vw, 240px)">
          {/* the Zoo Smiles tooth mascot, waving */}
          <path
            d="M55,55 C55,25 80,18 100,18 C120,18 145,25 145,55 C145,76 138,90 134,112 C131,130 130,152 117,152 C106,152 110,118 100,118 C90,118 94,152 83,152 C70,152 69,130 66,112 C62,90 55,76 55,55 Z"
            fill="#fff"
            stroke="#1d3557"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <circle cx="86" cy="62" r="6" fill="#1d3557" />
          <circle cx="114" cy="62" r="6" fill="#1d3557" />
          <path d="M84,78 Q100,92 116,78" fill="none" stroke="#1d3557" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="72" cy="80" rx="7" ry="5" fill="#f4a8c0" opacity="0.7" />
          <ellipse cx="128" cy="80" rx="7" ry="5" fill="#f4a8c0" opacity="0.7" />
          {/* waving arm */}
          <path d="M146,80 Q170,70 174,48" fill="none" stroke="#1d3557" strokeWidth="6" strokeLinecap="round" className="zd-wave" />
          <circle cx="176" cy="44" r="9" fill="#fff" stroke="#1d3557" strokeWidth="5" />
          <path d="M30,30 l4,9 9,4 -9,4 -4,9 -4,-9 -9,-4 9,-4 Z" fill="#ffe066" />
          <path d="M168,120 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3 Z" fill="#ffe066" />
        </svg>
      </div>
      <h1 className="zd-logo">
        Zoo <span>Smiles</span>
      </h1>
      <p className="zd-tagline">Animal Dentist</p>
      <button
        className="zd-play"
        onClick={() => {
          sfx.chirp();
          onPlay();
        }}
      >
        PLAY
      </button>
    </div>
  );
}
