import { useLiveQuery } from 'dexie-react-hooks';
import { readGamification } from '../db/gamification';
import { snapshotForXp, type GamificationSnapshot } from '../services/gamification';

export interface GamificationView extends GamificationSnapshot {
  badges: string[];
}

// Live lifetime XP + earned badges, with the level snapshot derived on read.
// `readGamification` resolves the absent-row and absent-badges defaults, so the
// query yields a value; `useLiveQuery` returns undefined only while loading.
export function useGamification(): GamificationView | undefined {
  const state = useLiveQuery(() => readGamification(), []);
  if (state === undefined) return undefined;
  return { ...snapshotForXp(state.xp), badges: state.badges };
}
