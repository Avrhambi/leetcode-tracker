import { useLiveQuery } from 'dexie-react-hooks';
import { readGamification } from '../db/gamification';
import { snapshotForXp, type GamificationSnapshot } from '../services/gamification';

// Live lifetime XP with the level snapshot derived on read. `readGamification`
// resolves the absent-row default, so the query yields a number; `useLiveQuery`
// returns undefined only while the first read is in flight.
export function useGamification(): GamificationSnapshot | undefined {
  const state = useLiveQuery(() => readGamification(), []);
  return state === undefined ? undefined : snapshotForXp(state.xp);
}
