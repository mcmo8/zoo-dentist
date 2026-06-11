import type { AnimalId, SaveData } from '../game/types';
import { ANIMALS } from '../game/animals';
import { nextScripted } from '../game/levels';
import { AnimalFace } from './AnimalFace';
import * as sfx from '../lib/sfx';

/* The waiting room. During the scripted teaching phase only the next
   patient is awake; afterwards everyone is available, forever. */

export function Lobby({
  save,
  onPick,
  muted,
  onToggleMute,
}: {
  save: SaveData;
  onPick: (id: AnimalId) => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const next = nextScripted(save.treated);

  return (
    <div className="zd-screen zd-lobby">
      <header className="zd-lobby-head">
        <div className="zd-lobby-title">
          Who needs <span>help?</span>
        </div>
        <div className="zd-lobby-right">
          <span className="zd-smilecount">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M7 5 C7 2.6 9.6 2 12 2 C14.4 2 17 2.6 17 5 C17 7.4 16.2 9 15.8 11.4 C15.5 13.4 15.4 16 14 16 C12.7 16 13.2 12 12 12 C10.8 12 11.3 16 10 16 C8.6 16 8.5 13.4 8.2 11.4 C7.8 9 7 7.4 7 5 Z"
                fill="#fff"
                stroke="#1d3557"
                strokeWidth="1.6"
              />
            </svg>
            {save.totalVisits}
          </span>
          <button className="zd-sound" onClick={onToggleMute} aria-label="Sound">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <div className="zd-grid">
        {ANIMALS.map((a) => {
          const treated = save.treated[a.id] ?? 0;
          const isNext = next === a.id;
          const locked = next !== null && !isNext && treated === 0;
          return (
            <button
              key={a.id}
              className={[
                'zd-card',
                isNext ? 'zd-card-next' : '',
                locked ? 'zd-card-locked' : '',
              ].join(' ')}
              disabled={locked}
              onClick={() => {
                sfx.pop();
                onPick(a.id);
              }}
              style={{ background: `linear-gradient(180deg, ${a.accent}55, #ffffff)` }}
            >
              <svg viewBox="0 0 360 430" className="zd-card-face">
                <AnimalFace
                  spec={a}
                  expr={locked ? 'happy' : treated > 0 && !isNext ? 'happy' : 'sad'}
                  mouthOpen={false}
                />
              </svg>
              <div className="zd-card-name">{a.name}</div>
              {locked && <div className="zd-zzz">Zzz</div>}
              {isNext && (
                <div className="zd-ouch" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      d="M7 5 C7 2.6 9.6 2 12 2 C14.4 2 17 2.6 17 5 C17 7.4 16.2 9 15.8 11.4 C15.5 13.4 15.4 16 14 16 C12.7 16 13.2 12 12 12 C10.8 12 11.3 16 10 16 C8.6 16 8.5 13.4 8.2 11.4 C7.8 9 7 7.4 7 5 Z"
                      fill="#fdfaf2"
                      stroke="#1d3557"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="7" r="2.4" fill="#3a2414" />
                  </svg>
                </div>
              )}
              {treated > 0 && (
                <div className="zd-badge">
                  {'★'.repeat(Math.min(3, treated))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
