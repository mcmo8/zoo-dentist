import type { AnimalId, SaveData } from '../game/types';
import { ANIMAL_BY_ID } from '../game/animals';
import { animalSit, BACKGROUNDS } from '../game/assets';
import * as sfx from '../lib/sfx';

/* The waiting room: patients sit in the chairs (their sad-sitting poses) and you tap
   one to treat it. FREE PLAY — every seated patient is available in any order (no
   scripted gating). The room art has ~4 chairs, so we seat 4 at a time and rotate
   which patients occupy the fixed chair slots each visit (rather than piling all on).
   The first time you treat any animal it still gets its gentle one-mechanic intro
   (levels.ts, treatedBefore === 0); repeats roll.

   Geometry mirrors assets/lobby-tuner.html exactly: a 360x639 stage, the room art
   covers it, and each sprite is center-anchored at its seat (sprite width = 120*s).
   Coords are LOCKED in assets/lobby-seats.json. */

const STAGE_W = 360;
const STAGE_H = 639;
const SPRITE_W = 120;

// locked seat placements (assets/lobby-seats.json) — center-anchored, 360-wide stage
const SEATS: Record<AnimalId, { x: number; y: number; s: number }> = {
  bunny: { x: 47, y: 276, s: 0.7 },
  monkey: { x: 137, y: 290, s: 0.78 },
  hippo: { x: 225, y: 299, s: 0.69 },
  lion: { x: 319, y: 293, s: 0.78 },
  croc: { x: 54, y: 286, s: 0.81 },
  elephant: { x: 317, y: 293, s: 0.95 },
};

/* The 4 chairs and the playable patients that can occupy each. bunny/croc share chair
   1, monkey chair 2, hippo chair 3, lion/elephant chair 4 (tiger + giraffe have seat
   poses but no treatment mechanics yet, so they're future content and never seated). */
const CHAIRS: AnimalId[][] = [
  ['bunny', 'croc'],
  ['monkey'],
  ['hippo'],
  ['lion', 'elephant'],
];

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
  // rotate the dual-candidate chairs by visit count so all patients cycle through
  const parity = save.totalVisits % 2;
  const seated = CHAIRS.map((c) => c[parity % c.length]);

  return (
    <div className="zd-screen zd-lobby">
      <div className="zd-lobby-stage">
        <img className="zd-lobby-bg" src={BACKGROUNDS.lobby} alt="" draggable={false} />

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

        {seated.map((id) => {
          const seat = SEATS[id];
          const treated = save.treated[id] ?? 0;
          return (
            <button
              key={id}
              className="zd-seat"
              style={{
                left: `${(seat.x / STAGE_W) * 100}%`,
                top: `${(seat.y / STAGE_H) * 100}%`,
                width: `${((SPRITE_W * seat.s) / STAGE_W) * 100}%`,
              }}
              aria-label={`${ANIMAL_BY_ID[id].name} — needs help`}
              onClick={() => {
                sfx.pop();
                onPick(id);
              }}
            >
              <img
                className="zd-seat-img zd-seat-awake"
                src={animalSit(id)}
                alt=""
                draggable={false}
              />
              <span className="zd-seat-ouch" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M7 5 C7 2.6 9.6 2 12 2 C14.4 2 17 2.6 17 5 C17 7.4 16.2 9 15.8 11.4 C15.5 13.4 15.4 16 14 16 C12.7 16 13.2 12 12 12 C10.8 12 11.3 16 10 16 C8.6 16 8.5 13.4 8.2 11.4 C7.8 9 7 7.4 7 5 Z"
                    fill="#fdfaf2"
                    stroke="#1d3557"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="7" r="2.4" fill="#3a2414" />
                </svg>
              </span>
              {treated > 0 && (
                <span className="zd-seat-badge" aria-hidden>
                  {'★'.repeat(Math.min(3, treated))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
