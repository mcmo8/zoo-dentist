/* Core game model — derived from gameplay research:
   - Every problem is a discrete visual object on a specific tooth.
   - Treatment is ON RAILS: a fixed step sequence, one active tool per step,
     auto-advance when the step's targets are all resolved. No fail state. */

export type AnimalId =
  | 'bunny'
  | 'monkey'
  | 'hippo'
  | 'croc'
  | 'lion'
  | 'elephant';

export type ProblemKind =
  | 'debris' // stuck food item — plucked with tweezers
  | 'plaque' // dirt layer on tooth — scrubbed with brush
  | 'germs' // grinning germ sprite — zapped with germ spray
  | 'cavity' // dark hole — drilled clean, then filled
  | 'chip' // jagged broken corner — drilled smooth, then shape-puzzle piece
  | 'rotten' // dead grey tooth — extracted, then implant into the gap
  | 'stink'; // bad-breath cloud — rinsed with mouthwash

export type ToolId =
  | 'magnifier'
  | 'sprayer'
  | 'tweezers'
  | 'brush'
  | 'drill'
  | 'germspray'
  | 'filler' // goo gun for cavity fill
  | 'forceps'
  | 'implant'
  | 'puzzle' // shape-matched repair piece (special tray UI)
  | 'mouthwash';

export type Interaction = 'drag-over' | 'scrub' | 'dwell' | 'pluck' | 'snap';

/** Food items that can be stuck between teeth. */
export type DebrisKind = 'candy' | 'carrot' | 'leaf' | 'bone' | 'fish';

/** Notch silhouettes for the chip-repair shape puzzle. */
export type PuzzleShape = 'tri' | 'square' | 'round';

export interface ToothProblem {
  kind: ProblemKind;
  toothIndex: number; // which tooth carries it
  debris?: DebrisKind;
}

/** A single guided step in the treatment sequence. */
export interface Step {
  tool: ToolId;
  /** Tooth indices this step works on; empty = whole mouth (spray, wash). */
  targets: number[];
  interaction: Interaction;
  /** Voice-free instruction shown as a big pictogram + short text. */
  label: string;
}

/** Live per-tooth state during treatment. */
export interface ToothState {
  index: number;
  /** 0..1 — plaque remaining (1 = filthy). */
  plaque: number;
  debris: DebrisKind | null;
  germ: boolean;
  /** cavity: hole present; drilled: hole cleaned; filled: done */
  cavity: 'none' | 'hole' | 'drilled' | 'filled';
  /** chip: broken corner; smoothed: ready for piece; repaired: done */
  chip: 'none' | 'broken' | 'smoothed' | 'repaired';
  /** which puzzle piece fits this tooth's notch (set when chip present) */
  chipShape?: PuzzleShape;
  /** rotten -> wiggled -> gone (gap) -> implanted */
  rot: 'none' | 'rotten' | 'gone' | 'implanted';
  sparkle: boolean; // brief celebration flag when a tooth is finished
}

export interface MouthLayout {
  /** Teeth in the visible arc, top row then bottom row. */
  top: ToothShape[];
  bottom: ToothShape[];
}

export type ToothShape = 'square' | 'fang' | 'molar' | 'buck' | 'tusk';

export interface AnimalSpec {
  id: AnimalId;
  name: string;
  /** Card + chair colors (original palette per animal). */
  skin: string;
  skinDark: string;
  accent: string;
  mouth: MouthLayout;
}

/** One visit = an animal + its generated problems + the derived rail. */
export interface Visit {
  animal: AnimalId;
  problems: ToothProblem[];
  steps: Step[];
}

export type Screen = 'title' | 'lobby' | 'treat' | 'celebrate';

export interface SaveData {
  /** visits completed per animal (drives badge counts + roster unlocks). */
  treated: Partial<Record<AnimalId, number>>;
  totalVisits: number;
  muted: boolean;
}
