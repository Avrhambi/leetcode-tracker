import type { Attempt, CatalogProblem, ProblemProgress, Quality } from '../types/models';

// "Is the practice actually helping?" signals, derived entirely from the recorded
// attempts and progress — no extra stored state.

const QUALITY_SCORE: Record<Quality, number> = { weak: 0, partial: 1, strong: 2 };

export type Trajectory = 'improving' | 'flat' | 'declining';

// Direction of the last `window` attempts in a topic, by comparing the mean
// quality of the older half against the newer half.
export function topicTrajectory(
  topic: string,
  attempts: Attempt[],
  problems: CatalogProblem[],
  window = 10
): Trajectory {
  const topicProblemIds = new Set(problems.filter((problem) => problem.primaryTopic === topic).map((problem) => problem.id));
  const recent = attempts
    .filter((attempt) => topicProblemIds.has(attempt.problemId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-window);
  if (recent.length < 4) return 'flat';

  const mid = Math.floor(recent.length / 2);
  const mean = (list: Attempt[]) => list.reduce((sum, a) => sum + QUALITY_SCORE[a.quality], 0) / list.length;
  const delta = mean(recent.slice(mid)) - mean(recent.slice(0, mid));

  if (delta > 0.3) return 'improving';
  if (delta < -0.3) return 'declining';
  return 'flat';
}

export interface StrugglingProblem { problemId: string; consecutiveWeak: number; }

// Problems currently flagged `struggling`, weakest run first — the "needs a
// different approach" list.
export function strugglingProblems(progress: ProblemProgress[]): StrugglingProblem[] {
  return progress
    .filter((row) => row.struggling)
    .sort((a, b) => b.consecutiveWeak - a.consecutiveWeak)
    .map((row) => ({ problemId: row.problemId, consecutiveWeak: row.consecutiveWeak }));
}
