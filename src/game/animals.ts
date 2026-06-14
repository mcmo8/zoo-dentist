import type { AnimalSpec, MouthLayout } from './types';

/* Original animal cast — colors + a SHARED mouth board. Per the R2/R3 redesign the
   mouth is one fixed generic open-mouth UI for every patient; the patient's identity
   is the head/ears behind it. Difficulty comes from each animal's problem mix (see
   levels.ts), not the mouth shape. The shape entries are all 'square' since the teeth
   render from art, not paths.

   R3: 5 teeth per row (10 total), matching the locked layered-mouth layout in
   assets/mouth-layout.json. The engine reads these counts dynamically (toothCount /
   initTeeth / pickTeeth), so the count is the single knob that keeps the rendered
   arch, the hit-test layout, and problem generation in lockstep. */

const SMILE: MouthLayout = {
  top: ['square', 'square', 'square', 'square', 'square'],
  bottom: ['square', 'square', 'square', 'square', 'square'],
};

export const ANIMALS: AnimalSpec[] = [
  {
    id: 'bunny',
    name: 'Pip',
    skin: '#cfd9e8',
    skinDark: '#9fb2cc',
    accent: '#f4a8c0',
    mouth: SMILE,
  },
  {
    id: 'monkey',
    name: 'Momo',
    skin: '#b07c4f',
    skinDark: '#8a5c36',
    accent: '#f2cf9a',
    mouth: SMILE,
  },
  {
    id: 'hippo',
    name: 'Hugo',
    skin: '#9d8ec7',
    skinDark: '#7a6aa8',
    accent: '#cfc3ee',
    mouth: SMILE,
  },
  {
    id: 'elephant',
    name: 'Ella',
    skin: '#8fb6bd',
    skinDark: '#6d949c',
    accent: '#c4e0e4',
    mouth: SMILE,
  },
  {
    id: 'croc',
    name: 'Snappy',
    skin: '#7fbf6e',
    skinDark: '#5c9a4d',
    accent: '#d4ec9f',
    mouth: SMILE,
  },
  {
    id: 'lion',
    name: 'Leo',
    skin: '#e8b04f',
    skinDark: '#c08a2e',
    accent: '#f7d98c',
    mouth: SMILE,
  },
];

export const ANIMAL_BY_ID = Object.fromEntries(
  ANIMALS.map((a) => [a.id, a])
) as Record<string, AnimalSpec>;
