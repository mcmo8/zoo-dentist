import type { AnimalSpec } from '../game/types';
import { AnimalFace } from './AnimalFace';
import { Confetti } from './Confetti';
import * as sfx from '../lib/sfx';

export function Celebrate({
  spec,
  onNext,
}: {
  spec: AnimalSpec;
  onNext: () => void;
}) {
  return (
    <div className="zd-screen zd-celebrate">
      <Confetti />
      <div className="zd-celebrate-burst" aria-hidden />
      <h2 className="zd-celebrate-title">All better!</h2>
      <div className="zd-celebrate-face zd-pophappy">
        <svg viewBox="0 0 360 430" width="min(72vw, 300px)">
          <AnimalFace spec={spec} expr="happy" mouthOpen={false} />
        </svg>
      </div>
      <p className="zd-celebrate-sub">{spec.name} has a sparkly smile!</p>
      <div className="zd-celebrate-stars" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="zd-bigstar" style={{ animationDelay: `${0.25 + i * 0.3}s` }}>
            ★
          </span>
        ))}
      </div>
      <button
        className="zd-play"
        onClick={() => {
          sfx.chirp();
          onNext();
        }}
      >
        NEXT PATIENT
      </button>
    </div>
  );
}
