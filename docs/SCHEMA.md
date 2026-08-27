```ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Outcome =
  | 'solved_independently'
  | 'solved_with_hint'
  | 'watched_solution'
  | 'could_not_solve';
export type PerceivedDifficulty = 'easy' | 'manageable' | 'hard';
export type HelpType =
  | 'small_hint'
  | 'pattern_identification'
  | 'pseudocode'
  | 'full_code'
  | 'solution_video';
export type Quality = 'strong' | 'partial' | 'weak';
export type ProgressStatus = 'not_started' | 'attempted' | 'solved' | 'mastered';

export interface CatalogProblem {
  id: string;
  title: string;
  slug: string;
  leetcodeUrl: string;
  difficulty: Difficulty;
  topics: string[];
  primaryTopic: string;
  neetcodeOrder: number;
}

export interface ProblemProgress {
  problemId: string;
  status: ProgressStatus;
  reviewStage: 0 | 1 | 2 | 3 | 4 | 5;
  nextReviewDate: string | null;
  lastAttemptDate: string | null;
  lastQuality: Quality | null;
  strongAttemptCount: number;
  consecutiveWeak: number;   // back-to-back weak attempts; resets on any non-weak
  struggling: boolean;       // set at consecutiveWeak >= 3; cleared by a strong attempt
  updatedAt: string;
}

export interface Attempt {
  id: string;
  problemId: string;
  attemptedOn: string;
  outcome: Outcome;
  perceivedDifficulty: PerceivedDifficulty;
  helpType: HelpType | null;
  durationMinutes: number | null;
  notes: string;
  quality: Quality;
  createdAt: string;
}

export interface RecommendationEvent {
  id: string;
  problemId: string;
  kind: 'new' | 'review';
  recommendedAt: string;
  skippedUntil: string | null;
  completedAt?: string | null;
}

export type AppSettingKey =
  | 'catalogVersion'
  | 'streakGraceRemaining'      // integer, streak grace allowance (reserved; the
  | 'streakGraceRefreshedOn'    //   dashboard defaults these when absent and
  | 'lastActiveOn';             //   re-derives grace usage from the active dates)

export interface AppSetting {
  key: AppSettingKey;
  value: string;
}

// Single-row store (key: 'state'). `xp` is lifetime XP; `badges` is the earned
// milestone-id set, written as a monotonic union so it never regresses. Level is
// derived on read (services/gamification.ts) so it cannot drift from xp.
// `badges` is optional: a row written before the visuals slice has none and
// reads as [].
export interface GamificationState {
  key: 'state';
  xp: number;         // total lifetime XP
  badges?: string[];  // earned badge ids (see services/constants.ts BADGES)
  updatedAt: string;
}

export interface BackupPayload {
  formatVersion: 1 | 2;   // v2 adds ProblemProgress.consecutiveWeak / .struggling
  exportedAt: string;     // and the streak settings keys; a v1 file restores with
  progress: ProblemProgress[];       // those defaulted (0 / false)
  attempts: Attempt[];
  recommendationEvents: RecommendationEvent[];
  settings: AppSetting[];
  gamification?: GamificationState;  // optional within v2 — a coach-fixes-era
                                     // backup has none; XP rebuilt from `attempts`
                                     // on restore when absent, badges start empty
}

export const dexieStores = {
  problems: '&id, slug, neetcodeOrder, primaryTopic, difficulty',
  progress: '&problemId, status, nextReviewDate, lastAttemptDate',
  attempts: '&id, problemId, attemptedOn, createdAt',
  recommendationEvents: '&id, problemId, kind, recommendedAt, skippedUntil',
  settings: '&key',
  gamification: '&key'   // added in v3
} as const;
// Dexie versions: v1 initial; v2 backfills consecutiveWeak/struggling on progress
// (no index change). The streak settings rows are not seeded and currently not
// written — the dashboard defaults the grace allowance when they are absent and
// re-derives usage from the active dates, so reset / v1-restore need no reseed.
// v3 adds the `gamification` store and seeds it by replaying lifetime XP from the
// full `attempts` history (its own version — Dexie never re-runs a v2 upgrade for
// an existing v2 user). Fresh installs are created at v3 and skip the callback;
// the reader defaults to { xp: 0 } when the row is absent.
```

### XP and levels

XP is awarded per attempt, atomically inside `saveAttempt`'s transaction, and is
a pure function of the stored `Attempt` row — its `quality` and whether it is the
first attempt for that problem on that calendar day. No new-vs-review multiplier:
`kind` lives on `RecommendationEvent`, not `Attempt`, so the v3 replay could not
reconstruct it.

| quality | first of day | same-day repeat |
|---------|--------------|-----------------|
| strong  | 20           | 5               |
| partial | 12           | 3               |
| weak    | 5            | 1               |

`level = floor(sqrt(xp / 50))` — level 1 at 50 XP, 2 at 200, 3 at 450, 4 at 800.
`replayXp(attempts)` folds the whole history (sorted by `createdAt` then `id` for
a deterministic result) and is shared by the v3 upgrade and by backup restore
when the payload carries no gamification row.

### Badges

`badgesEarned(progress, attempts, problems, currentStreakDays)` (services/badges.ts)
returns the badge ids currently satisfied. `saveAttempt` calls it after the
progress write, with the streak length computed from the same transaction's
attempts + settings, and `recordBadges` unions the result into the stored set —
so a badge is monotonic and needs no replay (returning users pick badges up on
their next attempt). No Dexie version bump: `gamification: '&key'` has no index
on `badges`.
