import type { SaveData } from '../game/types';

const KEY = 'zoosmiles_save_v1';

const DEFAULTS: SaveData = { treated: {}, totalVisits: 0, muted: false };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      treated: parsed.treated ?? {},
      totalVisits: parsed.totalVisits ?? 0,
      muted: parsed.muted ?? false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function persistSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage full/blocked — play continues, progress just won't survive */
  }
}
