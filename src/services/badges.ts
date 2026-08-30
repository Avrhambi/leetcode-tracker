import type { Attempt, CatalogProblem, ProblemProgress } from '../types/models';
import {
  BADGES, BADGE_ATTEMPTED_CENTURY, BADGE_ATTEMPTED_HALF, BADGE_LEVEL_HIGH, BADGE_LEVEL_MID,
  BADGE_STREAK_CENTURY, BADGE_STREAK_DAYS, BADGE_STREAK_MONTH, BADGE_STREAK_WEEK,
  BADGE_TOPICS_CLEARED, type BadgeId
} from './constants';

// Pure milestone-badge predicates. Everything is derived from progress + attempts
// + catalog + the already-computed streak length — no stored badge state is read
// here. The caller unions the result into the persisted set so a badge, once
// earned, is never lost when a later weak attempt resets a review stage.

export interface BadgeInput {
  progress: ProblemProgress[];
  attempts: Attempt[];
  problems: CatalogProblem[];
  currentStreakDays: number;
  level: number;
}

// How many distinct topics have every one of their problems mastered. A topic
// with no problems in the catalog never counts (an empty `.every` is vacuously
// true), which also keeps a zero-catalog state from earning anything.
function topicsCleared(progress: ProblemProgress[], problems: CatalogProblem[]): number {
  const masteredIds = new Set(progress.filter((row) => row.status === 'mastered').map((row) => row.problemId));
  const byTopic = new Map<string, CatalogProblem[]>();
  for (const problem of problems) {
    const list = byTopic.get(problem.primaryTopic) ?? [];
    list.push(problem);
    byTopic.set(problem.primaryTopic, list);
  }
  let cleared = 0;
  for (const list of byTopic.values()) {
    if (list.length > 0 && list.every((problem) => masteredIds.has(problem.id))) cleared += 1;
  }
  return cleared;
}

// The badge ids currently satisfied by this state, in BADGES order.
export function badgesEarned(input: BadgeInput): BadgeId[] {
  const { progress, attempts, problems, currentStreakDays, level } = input;
  const attemptedProblemIds = new Set(attempts.map((attempt) => attempt.problemId));
  const solvedCount = progress.filter((row) => row.status === 'solved' || row.status === 'mastered').length;
  const masteredCount = progress.filter((row) => row.status === 'mastered').length;
  const clearedTopics = topicsCleared(progress, problems);

  const earned: BadgeId[] = [];
  if (solvedCount >= 1) earned.push('first-solve');
  if (masteredCount >= 1) earned.push('first-mastered');

  if (currentStreakDays >= BADGE_STREAK_WEEK) earned.push('week-streak');
  if (currentStreakDays >= BADGE_STREAK_DAYS) earned.push('ten-day-streak');
  if (currentStreakDays >= BADGE_STREAK_MONTH) earned.push('month-streak');
  if (currentStreakDays >= BADGE_STREAK_CENTURY) earned.push('century-streak');

  if (clearedTopics >= 1) earned.push('topic-cleared');
  if (clearedTopics >= BADGE_TOPICS_CLEARED) earned.push('five-topics-cleared');
  if (problems.length > 0 && masteredCount >= problems.length) earned.push('all-mastered');

  if (attemptedProblemIds.size >= BADGE_ATTEMPTED_HALF) earned.push('half-catalog');
  if (attemptedProblemIds.size >= BADGE_ATTEMPTED_CENTURY) earned.push('century');

  if (level >= BADGE_LEVEL_MID) earned.push('level-5');
  if (level >= BADGE_LEVEL_HIGH) earned.push('level-10');
  return earned;
}

// Merge freshly-earned badges into the stored set without losing any, ordered by
// BADGES so the shelf is stable. Unknown ids in `stored` (e.g. a badge removed in
// a later release) are dropped rather than shown as blanks.
export function mergeBadges(stored: string[], earned: BadgeId[]): string[] {
  const has = new Set<string>([...stored, ...earned]);
  return BADGES.filter((badge) => has.has(badge.id)).map((badge) => badge.id);
}
