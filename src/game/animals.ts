import type { AnimalSpec } from './types';

/* Original animal cast — colors + mouth boards. The mouth IS the level:
   bunny = few huge targets (easy), croc = many small fangs (hard). */

export const ANIMALS: AnimalSpec[] = [
  {
    id: 'bunny',
    name: 'Pip',
    skin: '#cfd9e8',
    skinDark: '#9fb2cc',
    accent: '#f4a8c0',
    mouth: {
      top: ['buck', 'buck'],
      bottom: ['square', 'square', 'square', 'square'],
    },
  },
  {
    id: 'monkey',
    name: 'Momo',
    skin: '#b07c4f',
    skinDark: '#8a5c36',
    accent: '#f2cf9a',
    mouth: {
      top: ['square', 'square', 'square', 'square'],
      bottom: ['square', 'square', 'square', 'square'],
    },
  },
  {
    id: 'hippo',
    name: 'Hugo',
    skin: '#9d8ec7',
    skinDark: '#7a6aa8',
    accent: '#cfc3ee',
    mouth: {
      top: ['molar', 'molar'],
      bottom: ['tusk', 'molar', 'molar', 'tusk'],
    },
  },
  {
    id: 'elephant',
    name: 'Ella',
    skin: '#8fb6bd',
    skinDark: '#6d949c',
    accent: '#c4e0e4',
    mouth: {
      top: ['molar', 'molar', 'molar'],
      bottom: ['tusk', 'molar', 'tusk'],
    },
  },
  {
    id: 'croc',
    name: 'Snappy',
    skin: '#7fbf6e',
    skinDark: '#5c9a4d',
    accent: '#d4ec9f',
    mouth: {
      top: ['fang', 'fang', 'fang', 'fang', 'fang'],
      bottom: ['fang', 'fang', 'fang', 'fang', 'fang'],
    },
  },
  {
    id: 'lion',
    name: 'Leo',
    skin: '#e8b04f',
    skinDark: '#c08a2e',
    accent: '#f7d98c',
    mouth: {
      top: ['fang', 'square', 'square', 'fang'],
      bottom: ['fang', 'square', 'square', 'fang'],
    },
  },
];

export const ANIMAL_BY_ID = Object.fromEntries(
  ANIMALS.map((a) => [a.id, a])
) as Record<string, AnimalSpec>;
