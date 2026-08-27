import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { snapshotForXp, type GamificationSnapshot } from '../services/gamification';

// Live lifetime XP with the level snapshot derived on read. `useLiveQuery`
// yields undefined both while loading and when `.get` finds nothing, so the
// query resolves to a number (0 when the row is absent — fresh install) and
// undefined means "still loading".
export function useGamification(): GamificationSnapshot | undefined {
  const xp = useLiveQuery(async () => (await db.gamification.get('state'))?.xp ?? 0, []);
  return xp === undefined ? undefined : snapshotForXp(xp);
}
