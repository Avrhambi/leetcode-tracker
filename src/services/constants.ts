// Tunable thresholds for the coaching rules. Kept in one place so they are
// visible and adjustable without hunting through the algorithm modules.

// Consecutive weak attempts on one problem before it is flagged `struggling`:
// its reviews de-escalate and it stops pulling its topic up the new-problem queue.
export const STRUGGLE_THRESHOLD = 3;

// Days until the next review for a struggling problem, indexed by
// `min(consecutiveWeak - STRUGGLE_THRESHOLD, STRUGGLE_BACKOFF_DAYS.length - 1)`.
// Replaces the flat "review tomorrow" so a blind-spot problem does not return
// every single day forever.
export const STRUGGLE_BACKOFF_DAYS = [2, 4, 7] as const;

// Streak grace: a returning user does not lose the streak on the first missed
// day. One grace day is granted per rolling 7 active days.
export const STREAK_GRACE_PER_WEEK = 1;
export const STREAK_GRACE_ACTIVE_DAYS_PER_GRANT = 7;

// XP awarded per attempt, keyed by the derived `quality`. Both inputs to the XP
// calculation — `quality` and "first attempt of the day" — are reconstructible
// from a stored `Attempt` row alone, so the Dexie v3 replay produces the same
// lifetime total the live award path did. A new-vs-review multiplier is
// deliberately omitted: `kind` lives on `RecommendationEvent`, not `Attempt`,
// and an attempt logged from the catalog with no open recommendation has none —
// the replay could not reproduce it.
export const XP_BY_QUALITY = { strong: 20, partial: 12, weak: 5 } as const;

// A second (or later) attempt for the same problem on the same calendar day is
// reinforcement, not fresh progress — it earns a token fraction of the XP.
export const XP_REPEAT_SAME_DAY_MULTIPLIER = 0.25;

// Level curve: gentle square-root growth. level = floor(sqrt(xp / XP_PER_LEVEL_UNIT)),
// so level 1 at 50 XP, level 2 at 200, level 3 at 450, level 4 at 800.
export const XP_PER_LEVEL_UNIT = 50;
