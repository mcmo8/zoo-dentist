import { BACKGROUNDS } from '../game/assets';
import * as sfx from '../lib/sfx';

/* Title screen: the clinic-exterior art is the backdrop; the logo + PLAY sit on
   top. (The old procedural tooth mascot is dropped — the clinic art already
   carries the tooth sign.) */

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
    <div
      className="zd-screen zd-title"
      style={{ backgroundImage: `url(${BACKGROUNDS.title})` }}
    >
      <button className="zd-sound" onClick={onToggleMute} aria-label="Sound">
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="zd-title-spacer" />
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
