import { db } from './database';
import { xpForAttempt } from '../services/gamification';
import type { GamificationState, Quality } from '../types/models';

const DEFAULT_STATE: GamificationState = { key: 'state', xp: 0, updatedAt: '' };

// The gamification row is absent on a fresh install (created directly at v3, the
// upgrade callback never runs) and seeded by the v3 replay for existing users.
// Either way, an absent row reads as zero XP.
export async function readGamification(): Promise<GamificationState> {
  return (await db.gamification.get('state')) ?? DEFAULT_STATE;
}

// Award XP for one attempt, inside a caller-supplied transaction so the write is
// atomic with the attempt/progress writes in `saveAttempt`. `isFirstOfDay` is
// false for a same-day reinforcement pass.
export async function awardAttemptXp(quality: Quality, isFirstOfDay: boolean, now: Date): Promise<void> {
  const current = (await db.gamification.get('state')) ?? DEFAULT_STATE;
  await db.gamification.put({
    key: 'state',
    xp: current.xp + xpForAttempt(quality, isFirstOfDay),
    updatedAt: now.toISOString()
  });
}
