import type { Attempt, Quality } from '../types/models';
import { XP_BY_QUALITY, XP_PER_LEVEL_UNIT, XP_REPEAT_SAME_DAY_MULTIPLIER, xpStreakMultiplier } from './constants';
import { streakEndingOn } from './streak';

// Pure XP and level rules. No storage, no Dexie — `db/gamification.ts` owns I/O.
// Everything here is a function of a stored `Attempt` row (or a list of them),
// so the live award path and the v3 migration replay agree by construction.

export interface GamificationSnapshot {
  xp: number;
  level: number;
  xpIntoLevel: number;   // XP earned since reaching the current level
  xpForNextLevel: number; // XP span from the current level to the next
}

// XP for one attempt. `isFirstOfDay` is false when another attempt for the same
// problem already exists on the same calendar day (a reinforcement pass).
// `streakDays` is the grace-free consecutive-active-day count ending on the
// attempt's date (see `streakEndingOn`) — it applies the consistency multiplier.
//
// One `Math.round` over the whole product: composing a round per factor would let
// the live award and the `replayXp` fold drift apart by ±1 XP per attempt.
export function xpForAttempt(quality: Quality, isFirstOfDay: boolean, streakDays: number): number {
  const base = XP_BY_QUALITY[quality];
  const repeatFactor = isFirstOfDay ? 1 : XP_REPEAT_SAME_DAY_MULTIPLIER;
  return Math.round(base * repeatFactor * xpStreakMultiplier(streakDays));
}

// level = floor(sqrt(xp / unit)). Monotonic; level 0 at 0 XP.
export function levelForXp(xp: number): number {
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / XP_PER_LEVEL_UNIT));
}

// Total XP at the start of a given level — the inverse of `levelForXp`.
export function xpForLevel(level: number): number {
  return level * level * XP_PER_LEVEL_UNIT;
}

export function snapshotForXp(xp: number): GamificationSnapshot {
  const safeXp = Math.max(0, Math.round(xp));
  const level = levelForXp(safeXp);
  const levelStart = xpForLevel(level);
  const nextLevelStart = xpForLevel(level + 1);
  return {
    xp: safeXp,
    level,
    xpIntoLevel: safeXp - levelStart,
    xpForNextLevel: nextLevelStart - levelStart
  };
}

// Replay lifetime XP from the full attempt history. Used by both the Dexie v3
// upgrade (seed the store for existing users) and backup restore (when the
// payload carries no gamification row). An attempt is "first of day" when no
// earlier attempt (by createdAt) exists for the same problem on the same
// `attemptedOn` date.
export function replayXp(attempts: Attempt[]): number {
  const seenByDay = new Set<string>();
  // Active dates accumulate as we fold forward, so the streak multiplier for an
  // attempt is computed against exactly the dates the live path would have seen
  // by the time that attempt was saved. The attempt's own date is added BEFORE
  // its multiplier is read (day 1 of a streak = ×1.0 per the tier table).
  const activeDates = new Set<string>();
  let xp = 0;
  // Sort by createdAt, then id, so two attempts sharing a timestamp always replay
  // in the same order the live path awarded them (which reads rows one at a time
  // as they were inserted). Without the id tiebreak, a strong-then-weak same-day
  // pair could replay weak-first and total differently.
  const ordered = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const attempt of ordered) {
    const dayKey = `${attempt.problemId} ${attempt.attemptedOn}`;
    const isFirstOfDay = !seenByDay.has(dayKey);
    seenByDay.add(dayKey);
    activeDates.add(attempt.attemptedOn);
    xp += xpForAttempt(attempt.quality, isFirstOfDay, streakEndingOn(activeDates, attempt.attemptedOn));
  }
  return xp;
}
