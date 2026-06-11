import type {
  AnimalId,
  AnimalSpec,
  DebrisKind,
  ToothProblem,
  Visit,
} from './types';
import { ANIMAL_BY_ID } from './animals';
import { buildSteps, toothCount } from './engine';

/* Teaching curve: scripted first 6 visits, one new mechanic each.
   After that the lobby opens and problems re-roll per visit, weighted
   toward each animal's signature ailment family. */

export const SCRIPT_ORDER: AnimalId[] = [
  'bunny',
  'monkey',
  'hippo',
  'elephant',
  'croc',
  'lion',
];

const DEBRIS_POOL: Record<AnimalId, DebrisKind[]> = {
  bunny: ['carrot', 'leaf', 'candy'],
  monkey: ['candy', 'leaf', 'candy'],
  hippo: ['leaf', 'candy', 'carrot'],
  elephant: ['leaf', 'candy', 'carrot'],
  croc: ['fish', 'bone', 'candy'],
  lion: ['bone', 'fish', 'candy'],
};

/** Signature problem family per animal (drives free-play weighting). */
const SIGNATURE: Record<AnimalId, ToothProblem['kind']> = {
  bunny: 'debris',
  monkey: 'plaque',
  hippo: 'germs',
  elephant: 'cavity',
  croc: 'chip',
  lion: 'rotten',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n distinct random tooth indices. */
function pickTeeth(spec: AnimalSpec, n: number, used: Set<number>): number[] {
  const total = toothCount(spec.mouth);
  const free: number[] = [];
  for (let i = 0; i < total; i++) if (!used.has(i)) free.push(i);
  const out: number[] = [];
  while (out.length < n && free.length) {
    const j = Math.floor(Math.random() * free.length);
    out.push(free.splice(j, 1)[0]);
  }
  out.forEach((i) => used.add(i));
  return out;
}

function debrisOn(
  spec: AnimalSpec,
  n: number,
  used: Set<number>
): ToothProblem[] {
  return pickTeeth(spec, n, used).map((toothIndex) => ({
    kind: 'debris' as const,
    toothIndex,
    debris: pick(DEBRIS_POOL[spec.id]),
  }));
}

function on(
  kind: ToothProblem['kind'],
  spec: AnimalSpec,
  n: number,
  used: Set<number>
): ToothProblem[] {
  return pickTeeth(spec, n, used).map((toothIndex) => ({ kind, toothIndex }));
}

/** The scripted teaching visit for each animal's first treatment. */
function scriptedProblems(spec: AnimalSpec): ToothProblem[] {
  const used = new Set<number>();
  switch (spec.id) {
    case 'bunny':
      return debrisOn(spec, 3, used);
    case 'monkey':
      return [
        ...on('plaque', spec, 4, used),
        { kind: 'stink', toothIndex: 0 },
      ];
    case 'hippo':
      return [...on('germs', spec, 2, used), ...debrisOn(spec, 2, used)];
    case 'elephant':
      return [...on('cavity', spec, 1, used), ...on('plaque', spec, 2, used)];
    case 'croc':
      return [...on('chip', spec, 1, used), ...debrisOn(spec, 2, used)];
    case 'lion':
      return [
        ...on('rotten', spec, 1, used),
        ...on('plaque', spec, 2, used),
        ...on('germs', spec, 1, used),
      ];
    default:
      return debrisOn(spec, 2, used);
  }
}

/** Free-play roll: signature family + extras scaled by experience. */
function rolledProblems(spec: AnimalSpec, totalVisits: number): ToothProblem[] {
  const used = new Set<number>();
  const problems: ToothProblem[] = [];
  const big = toothCount(spec.mouth) >= 8;

  // signature family first so the croc still feels like the croc
  const sig = SIGNATURE[spec.id];
  if (sig === 'debris') problems.push(...debrisOn(spec, big ? 3 : 2, used));
  else if (sig === 'plaque') problems.push(...on('plaque', spec, 3, used));
  else if (sig === 'germs') problems.push(...on('germs', spec, 2, used));
  else problems.push(...on(sig, spec, 1, used));

  // extra families: 1 early, 2 once seasoned
  const extras = totalVisits >= 12 ? 2 : 1;
  const pool: ToothProblem['kind'][] = [
    'debris',
    'plaque',
    'germs',
    'cavity',
    'chip',
    'rotten',
  ].filter((k) => k !== sig) as ToothProblem['kind'][];
  for (let i = 0; i < extras; i++) {
    const kind = pick(pool);
    pool.splice(pool.indexOf(kind), 1);
    if (kind === 'debris') problems.push(...debrisOn(spec, 2, used));
    else if (kind === 'plaque') problems.push(...on('plaque', spec, 2, used));
    else if (kind === 'germs') problems.push(...on('germs', spec, 2, used));
    else problems.push(...on(kind, spec, 1, used));
  }

  if (Math.random() < 0.25) problems.push({ kind: 'stink', toothIndex: 0 });
  return problems;
}

export function makeVisit(
  animalId: AnimalId,
  treatedBefore: number,
  totalVisits: number
): Visit {
  const spec = ANIMAL_BY_ID[animalId];
  const problems =
    treatedBefore === 0 ? scriptedProblems(spec) : rolledProblems(spec, totalVisits);
  return { animal: animalId, problems, steps: buildSteps(problems) };
}

/** Which animal is next during the scripted phase; null = free choice. */
export function nextScripted(
  treated: Partial<Record<AnimalId, number>>
): AnimalId | null {
  for (const id of SCRIPT_ORDER) if (!treated[id]) return id;
  return null;
}
