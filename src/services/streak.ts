import { STREAK_GRACE_ACTIVE_DAYS_PER_GRANT, STREAK_GRACE_PER_WEEK } from './constants';

// Streak with grace days: a returning user does not lose the whole streak on the
// first missed day. Pure — the caller reads/writes the grace state from Dexie.

export interface StreakGraceState {
  graceRemaining: number;
  graceRefreshedOn: string; // YYYY-MM-DD
}

export interface StreakResult {
  streak: number;
  // The grace allowance to persist. This is the refreshed allowance BEFORE the
  // walk consumes any of it — grace usage is re-derived from `activeDates` on
  // every call, so `currentStreak` is idempotent for a given
  // (activeDates, graceState, now). Persisting a decremented balance would
  // double-spend on the next render.
  graceState: StreakGraceState;
  // Grace days spent to bridge gaps in the current streak, for display only.
  graceDaysUsed: number;
}

function toKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

// Refresh the grace allowance: grant STREAK_GRACE_PER_WEEK once every
// STREAK_GRACE_ACTIVE_DAYS_PER_GRANT active days. `activeDates` is the set of
// YYYY-MM-DD strings on which the user recorded at least one attempt.
export function refreshGrace(state: StreakGraceState, activeDates: Set<string>, today: string): StreakGraceState {
  const activeSince = [...activeDates].filter((date) => date > state.graceRefreshedOn && date <= today).length;
  if (activeSince < STREAK_GRACE_ACTIVE_DAYS_PER_GRANT) return state;
  const grants = Math.floor(activeSince / STREAK_GRACE_ACTIVE_DAYS_PER_GRANT);
  return {
    graceRemaining: Math.min(state.graceRemaining + grants * STREAK_GRACE_PER_WEEK, STREAK_GRACE_PER_WEEK),
    graceRefreshedOn: today
  };
}

// Current streak length. Walks back from today over active dates; the first
// missing day consumes a grace day and the walk continues, until grace runs out.
export function currentStreak(activeDates: Set<string>, graceState: StreakGraceState, now = new Date()): StreakResult {
  const today = toKey(now);
  const refreshed = refreshGrace(graceState, activeDates, today);

  let streak = 0;
  let graceLeft = refreshed.graceRemaining;
  let graceDaysUsed = 0;
  // Grace days spent walking a gap we have not yet bridged. Committed to
  // `graceDaysUsed` only when a later active day is reached; dropped if the walk
  // dead-ends (a gap before the user's first-ever attempt bridged nothing).
  let pendingGrace = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // If today has no attempt yet, don't break the streak — start counting from
  // yesterday (matches the old behaviour where the streak is "days in a row up
  // to and including the last active day").
  if (!activeDates.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = toKey(cursor);
    if (activeDates.has(key)) {
      streak += 1;
      graceDaysUsed += pendingGrace;
      pendingGrace = 0;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (graceLeft > 0 && streak > 0) {
      graceLeft -= 1;
      pendingGrace += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  return { streak, graceDaysUsed, graceState: refreshed };
}
