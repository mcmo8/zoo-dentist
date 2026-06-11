/* Pure game logic: build a visit's tooth states + the guided step rail,
   and answer "is this step done?" against live tooth state. */

import type {
  MouthLayout,
  Step,
  ToothProblem,
  ToothState,
} from './types';

export function toothCount(layout: MouthLayout): number {
  return layout.top.length + layout.bottom.length;
}

export function initTeeth(
  layout: MouthLayout,
  problems: ToothProblem[]
): ToothState[] {
  const teeth: ToothState[] = [];
  for (let i = 0; i < toothCount(layout); i++) {
    teeth.push({
      index: i,
      plaque: 0,
      debris: null,
      germ: false,
      cavity: 'none',
      chip: 'none',
      rot: 'none',
      sparkle: false,
    });
  }
  for (const p of problems) {
    const t = teeth[p.toothIndex];
    if (!t) continue;
    switch (p.kind) {
      case 'plaque':
        t.plaque = 1;
        break;
      case 'debris':
        t.debris = p.debris ?? 'candy';
        break;
      case 'germs':
        t.germ = true;
        break;
      case 'cavity':
        t.cavity = 'hole';
        break;
      case 'chip': {
        t.chip = 'broken';
        const shapes = ['tri', 'square', 'round'] as const;
        t.chipShape = shapes[Math.floor(Math.random() * shapes.length)];
        break;
      }
      case 'rotten':
        t.rot = 'rotten';
        break;
      // 'stink' lives on the visit, not a tooth
    }
  }
  return teeth;
}

/** Canonical dental order, mirroring the genre's on-rails sequences. */
export function buildSteps(problems: ToothProblem[]): Step[] {
  const by = (k: ToothProblem['kind']) =>
    problems.filter((p) => p.kind === k).map((p) => p.toothIndex);

  const debris = by('debris');
  const plaque = by('plaque');
  const germs = by('germs');
  const cavities = by('cavity');
  const chips = by('chip');
  const rotten = by('rotten');
  const stink = problems.some((p) => p.kind === 'stink');

  const steps: Step[] = [];
  steps.push({
    tool: 'magnifier',
    targets: [],
    interaction: 'drag-over',
    label: 'Look inside!',
  });
  if (debris.length || plaque.length) {
    steps.push({
      tool: 'sprayer',
      targets: [],
      interaction: 'dwell',
      label: 'Rinse the teeth!',
    });
  }
  if (debris.length) {
    steps.push({
      tool: 'tweezers',
      targets: debris,
      interaction: 'pluck',
      label: 'Pick out the food!',
    });
  }
  if (plaque.length) {
    steps.push({
      tool: 'brush',
      targets: plaque,
      interaction: 'scrub',
      label: 'Brush, brush, brush!',
    });
  }
  if (germs.length) {
    steps.push({
      tool: 'germspray',
      targets: germs,
      interaction: 'pluck',
      label: 'Zap the germs!',
    });
  }
  if (cavities.length || chips.length) {
    steps.push({
      tool: 'drill',
      targets: [...cavities, ...chips],
      interaction: 'dwell',
      label: cavities.length ? 'Clean the hole!' : 'Smooth it out!',
    });
  }
  if (cavities.length) {
    steps.push({
      tool: 'filler',
      targets: cavities,
      interaction: 'dwell',
      label: 'Fill it up!',
    });
  }
  if (chips.length) {
    steps.push({
      tool: 'puzzle',
      targets: chips,
      interaction: 'snap',
      label: 'Find the right piece!',
    });
  }
  if (rotten.length) {
    steps.push({
      tool: 'forceps',
      targets: rotten,
      interaction: 'pluck',
      label: 'Wiggle it out!',
    });
    steps.push({
      tool: 'implant',
      targets: rotten,
      interaction: 'snap',
      label: 'Pop in a new tooth!',
    });
  }
  if (stink) {
    steps.push({
      tool: 'mouthwash',
      targets: [],
      interaction: 'dwell',
      label: 'Swish and rinse!',
    });
  }
  return steps;
}

/** Is a single tooth fully resolved for the given step's tool? */
export function toothDoneForTool(t: ToothState, tool: Step['tool']): boolean {
  switch (tool) {
    case 'tweezers':
      return t.debris === null;
    case 'brush':
      return t.plaque <= 0.02;
    case 'germspray':
      return !t.germ;
    case 'drill':
      return t.cavity !== 'hole' && t.chip !== 'broken';
    case 'filler':
      return t.cavity === 'none' || t.cavity === 'filled';
    case 'puzzle':
      return t.chip === 'none' || t.chip === 'repaired';
    case 'forceps':
      return t.rot !== 'rotten';
    case 'implant':
      return t.rot === 'none' || t.rot === 'implanted';
    default:
      return true; // whole-mouth steps use their own progress meter
  }
}

export function stepDone(
  step: Step,
  teeth: ToothState[],
  mouthProgress: number
): boolean {
  if (step.targets.length === 0) return mouthProgress >= 1;
  return step.targets.every((i) => toothDoneForTool(teeth[i], step.tool));
}

/** Is a tooth completely healthy (for sparkle + final check)? */
export function toothHealthy(t: ToothState): boolean {
  return (
    t.plaque <= 0.02 &&
    t.debris === null &&
    !t.germ &&
    (t.cavity === 'none' || t.cavity === 'filled') &&
    (t.chip === 'none' || t.chip === 'repaired') &&
    (t.rot === 'none' || t.rot === 'implanted')
  );
}
