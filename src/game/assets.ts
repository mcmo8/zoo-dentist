/* Single source of truth for every art asset (connector-art integration).
   Each file under /assets is imported here EXACTLY ONCE (Vite returns a hashed,
   precache-able URL); components consume these maps, never raw paths.

   The provided art had an opaque white background baked in by the cut/vectorize
   pipeline; `scripts/prep_assets.py` strips it (SVG bg-path removal + tight
   viewBox, raster flood-fill for the WebP effects) reading from each folder's
   `_raw/` backup. Re-run that script if the raw art is ever refreshed. */

import type { AnimalId, ToolId } from './types';

/* ---------- animals (SVG, transparent, tight viewBox) ---------- */
import bunny from '../../assets/animals/bunny.svg';
import lion from '../../assets/animals/lion.svg';
import elephant from '../../assets/animals/elephant.svg';
import hippo from '../../assets/animals/hippo.svg';
import monkey from '../../assets/animals/monkey.svg';
import croc from '../../assets/animals/croc.svg';
import tiger from '../../assets/animals/tiger.svg';
import giraffe from '../../assets/animals/giraffe.svg';

/* ---------- animals: sad-sitting lobby poses (WebP, transparent) ---------- */
import bunnySit from '../../assets/animals-sit/bunny.webp';
import lionSit from '../../assets/animals-sit/lion.webp';
import elephantSit from '../../assets/animals-sit/elephant.webp';
import hippoSit from '../../assets/animals-sit/hippo.webp';
import monkeySit from '../../assets/animals-sit/monkey.webp';
import crocSit from '../../assets/animals-sit/croc.webp';
import tigerSit from '../../assets/animals-sit/tiger.webp';
import giraffeSit from '../../assets/animals-sit/giraffe.webp';

/* ---------- tools (SVG, transparent, tight viewBox) ---------- */
import drill from '../../assets/tools/drill.svg';
import brush from '../../assets/tools/brush.svg';
import toothpaste from '../../assets/tools/toothpaste.svg';
import mirror from '../../assets/tools/mirror.svg';
import scaler from '../../assets/tools/scaler.svg';
import pick from '../../assets/tools/pick.svg';
import electricDrill from '../../assets/tools/electric-drill.svg';
import floss from '../../assets/tools/floss.svg';
import polisher from '../../assets/tools/polisher.svg';
import forceps from '../../assets/tools/forceps.svg';
import cup from '../../assets/tools/cup.svg';
import applicator from '../../assets/tools/applicator.svg';

/* ---------- effects (WebP, transparent) ---------- */
import eGermGreen from '../../assets/effects/item_1.webp';
import eGermPurple from '../../assets/effects/item_2.webp';
import eGermOrange from '../../assets/effects/item_3.webp';
import ePlaqueBlob from '../../assets/effects/item_4.webp';
import eTartar from '../../assets/effects/item_5.webp';
import eDecayBlob from '../../assets/effects/item_6.webp';
import ePlaqueCluster from '../../assets/effects/item_7.webp';
import eCandy from '../../assets/effects/item_8.webp';
import eGum from '../../assets/effects/item_9.webp';
import eStink from '../../assets/effects/item_10.webp';
import eSplat from '../../assets/effects/item_11.webp';
import eSparkle from '../../assets/effects/item_12.webp';

/* ---------- tooth states (WebP, transparent, white-bodied) ---------- */
import tClean from '../../assets/teeth/item_1.webp';
import tSparkleClean from '../../assets/teeth/item_2.webp';
import tPlaque from '../../assets/teeth/item_3.webp';
import tDecay from '../../assets/teeth/item_4.webp';
import tHole from '../../assets/teeth/item_7.webp';
import tChipped from '../../assets/teeth/item_9.webp';
import tCracked from '../../assets/teeth/item_10.webp';
import tShaking from '../../assets/teeth/item_11.webp';
import tRotten from '../../assets/teeth/item_12.webp';
import tFilling from '../../assets/teeth/item_13.webp';

/* ---------- backgrounds + props (WebP) ---------- */
import bgTitle from '../../assets/backgrounds/clinic-exterior.webp';
import bgLobby from '../../assets/backgrounds/waiting-room.webp';
import bgTreatment from '../../assets/backgrounds/treatment-room.webp';
import propLamp from '../../assets/props/lamp.webp';
import propTray from '../../assets/props/tray.webp';
import propReception from '../../assets/props/reception.webp';

/* ===================== typed semantic maps ===================== */

/** All 8 cut animals. The roster (game/animals.ts) uses 6; tiger + giraffe are
 *  finished art kept available for a future patient (adding one is a content
 *  change, out of scope for this render swap). */
export const ANIMAL_ART = {
  bunny, lion, elephant, hippo, monkey, croc, tiger, giraffe,
} as const;
export type AnimalArtId = keyof typeof ANIMAL_ART;
export const animalArt = (id: AnimalId): string => ANIMAL_ART[id];

/** Sad-sitting lobby poses (waiting-room seats). All 8 exist; the roster seats 6. */
export const ANIMAL_SIT_ART = {
  bunny: bunnySit, lion: lionSit, elephant: elephantSit, hippo: hippoSit,
  monkey: monkeySit, croc: crocSit, tiger: tigerSit, giraffe: giraffeSit,
} as const;
export const animalSit = (id: AnimalId): string => ANIMAL_SIT_ART[id];

/** Every tool sprite, imported once. */
export const TOOL_ART = {
  drill, brush, toothpaste, mirror, scaler, pick,
  electricDrill, floss, polisher, forceps, cup, applicator,
} as const;
export type ToolArtId = keyof typeof TOOL_ART;

/** Game ToolId -> which tool sprite represents it. Some sprites (scaler,
 *  electricDrill, floss) are unused by the current rail but kept in the
 *  registry. `puzzle` never renders as a tool icon (its tray shows shape
 *  pieces), so it just reuses applicator as a harmless fallback. */
export const TOOL_FOR: Record<ToolId, ToolArtId> = {
  magnifier: 'mirror',
  sprayer: 'cup',
  tweezers: 'pick',
  brush: 'brush',
  germspray: 'polisher',
  drill: 'drill',
  filler: 'toothpaste',
  forceps: 'forceps',
  implant: 'applicator',
  mouthwash: 'cup',
  puzzle: 'applicator',
};
export const toolArt = (t: ToolId): string => TOOL_ART[TOOL_FOR[t]];

/** Free-floating effect sprites. */
export const EFFECT_ART = {
  germGreen: eGermGreen,
  germPurple: eGermPurple,
  germOrange: eGermOrange,
  plaqueBlob: ePlaqueBlob,
  tartar: eTartar,
  decayBlob: eDecayBlob,
  plaqueCluster: ePlaqueCluster,
  candy: eCandy,
  gum: eGum,
  stink: eStink,
  splat: eSplat,
  sparkle: eSparkle,
} as const;
export type EffectArtId = keyof typeof EFFECT_ART;

/** Per-tooth state art (the molar silhouette carries each problem look). */
export const TOOTH_ART = {
  clean: tClean,
  sparkleClean: tSparkleClean,
  plaque: tPlaque,
  decay: tDecay,
  hole: tHole,
  chipped: tChipped,
  cracked: tCracked,
  shaking: tShaking,
  rotten: tRotten,
  filling: tFilling,
} as const;
export type ToothArtId = keyof typeof TOOTH_ART;

/* The universal open-mouth is NOT a raster import: it is vendored as inline vector
   in src/components/mouthArt.tsx (from the artist's layered SVG), so the renderer can
   sandwich the tooth sprites between the mouth interior and the gum ridges by z-order.
   Being inline, it bundles into JS and precaches with it. The flat fallback
   assets/mouth/open-mouth.webp is intentionally unused (the layered vector is preferred,
   per the connector-art handoff). */

/** Full-screen backdrops, one per screen. */
export const BACKGROUNDS = {
  title: bgTitle,
  lobby: bgLobby,
  treatment: bgTreatment,
} as const;

/** Transparent prop overlays (unused: the room backdrops already bake in the
 *  lamp, tray-cart and reception desk — see Treatment for the note). */
export const PROPS = {
  lamp: propLamp,
  tray: propTray,
  reception: propReception,
} as const;
