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

export interface BackupPayload {
  formatVersion: 1 | 2;   // v2 adds ProblemProgress.consecutiveWeak / .struggling
  exportedAt: string;     // and the streak settings keys; a v1 file restores with
  progress: ProblemProgress[];       // those defaulted (0 / false)
  attempts: Attempt[];
  recommendationEvents: RecommendationEvent[];
  settings: AppSetting[];
}

export const dexieStores = {
  problems: '&id, slug, neetcodeOrder, primaryTopic, difficulty',
  progress: '&problemId, status, nextReviewDate, lastAttemptDate',
  attempts: '&id, problemId, attemptedOn, createdAt',
  recommendationEvents: '&id, problemId, kind, recommendedAt, skippedUntil',
  settings: '&key'
} as const;
// Dexie versions: v1 initial; v2 backfills consecutiveWeak/struggling on progress
// (no index change). The streak settings rows are not seeded and currently not
// written — the dashboard defaults the grace allowance when they are absent and
// re-derives usage from the active dates, so reset / v1-restore need no reseed.
// v3 (later PR) adds a gamification store.
```
