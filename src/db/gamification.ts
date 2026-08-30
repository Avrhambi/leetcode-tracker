import { db } from './database';
import { mergeBadges } from '../services/badges';
import { xpForAttempt } from '../services/gamification';
import { streakEndingOn } from '../services/streak';
import type { BadgeId } from '../services/constants';
import type { GamificationState, Quality } from '../types/models';

const DEFAULT_STATE: Required<GamificationState> = { key: 'state', xp: 0, badges: [], updatedAt: '' };

// The gamification row is absent on a fresh install (created directly at v3, the
// upgrade callback never runs) and seeded by the v3 replay for existing users. A
// PR-5a-era row has `xp` but no `badges`. Either way, missing fields read as the
// default (0 XP, no badges).
export async function readGamification(): Promise<Required<GamificationState>> {
  const row = await db.gamification.get('state');
  if (!row) return DEFAULT_STATE;
  return { key: 'state', xp: row.xp, badges: row.badges ?? [], updatedAt: row.updatedAt };
}

// Award XP for one attempt, inside a caller-supplied transaction so the write is
// atomic with the attempt/progress writes in `saveAttempt`. `isFirstOfDay` is
// false for a same-day reinforcement pass. `attemptedOn` + `priorActiveDates`
// (the set of dates the user was already active on, INCLUDING this attempt's
// date) drive the grace-free streak multiplier — the same inputs `replayXp`
// reconstructs, so the v4 replay lands on the same lifetime total.
export async function awardAttemptXp(
  quality: Quality,
  isFirstOfDay: boolean,
  attemptedOn: string,
  activeDates: Set<string>,
  now: Date
): Promise<void> {
  const current = (await db.gamification.get('state')) ?? DEFAULT_STATE;
  const streakDays = streakEndingOn(activeDates, attemptedOn);
  await db.gamification.put({
    key: 'state',
    xp: current.xp + xpForAttempt(quality, isFirstOfDay, streakDays),
    badges: current.badges ?? [],
    updatedAt: now.toISOString()
  });
}

// Union freshly-earned badges into the stored set. Monotonic — a badge is never
// removed once earned, even if a later weak attempt resets the stage that earned
// it. Call inside `saveAttempt`'s transaction, after the progress write; the
// re-read picks up the XP `awardAttemptXp` wrote earlier in the same transaction.
// The put is unconditional and idempotent — comparing set contents to skip it
// would just re-do mergeBadges' work.
export async function recordBadges(earned: BadgeId[], now: Date): Promise<void> {
  const current = (await db.gamification.get('state')) ?? DEFAULT_STATE;
  const badges = mergeBadges(current.badges ?? [], earned);
  await db.gamification.put({ key: 'state', xp: current.xp, badges, updatedAt: now.toISOString() });
}
