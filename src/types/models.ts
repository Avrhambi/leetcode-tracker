export type Difficulty = 'easy' | 'medium' | 'hard';
export type Outcome = 'solved_independently' | 'solved_with_hint' | 'watched_solution' | 'could_not_solve';
export type PerceivedDifficulty = 'easy' | 'manageable' | 'hard';
export type HelpType = 'small_hint' | 'pattern_identification' | 'pseudocode' | 'full_code' | 'solution_video';
export type Quality = 'strong' | 'partial' | 'weak';
export type ProgressStatus = 'not_started' | 'attempted' | 'solved' | 'mastered';

export interface CatalogProblem { id: string; title: string; slug: string; leetcodeUrl: string; difficulty: Difficulty; topics: string[]; primaryTopic: string; neetcodeOrder: number; }
export interface ProblemProgress { problemId: string; status: ProgressStatus; reviewStage: 0 | 1 | 2 | 3 | 4 | 5; nextReviewDate: string | null; lastAttemptDate: string | null; lastQuality: Quality | null; strongAttemptCount: number; consecutiveWeak: number; struggling: boolean; updatedAt: string; }
export interface Attempt { id: string; problemId: string; attemptedOn: string; outcome: Outcome; perceivedDifficulty: PerceivedDifficulty; helpType: HelpType | null; durationMinutes: number | null; notes: string; quality: Quality; createdAt: string; }
export interface RecommendationEvent { id: string; problemId: string; kind: 'new' | 'review'; recommendedAt: string; skippedUntil: string | null; completedAt?: string | null; }
export type AppSettingKey = 'catalogVersion' | 'streakGraceRemaining' | 'streakGraceRefreshedOn' | 'lastActiveOn';
export interface AppSetting { key: AppSettingKey; value: string; }
export interface BackupPayload { formatVersion: 1 | 2; exportedAt: string; progress: ProblemProgress[]; attempts: Attempt[]; recommendationEvents: RecommendationEvent[]; settings: AppSetting[]; }
