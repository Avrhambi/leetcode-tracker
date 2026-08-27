import type { Attempt, CatalogProblem, ProblemProgress, Quality } from '../types/models';
import { topicMastery } from './dailyPlan';

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

export interface TopicMasteryCell {
  topic: string;
  mastery: number;   // [0, 1] mean review-stage progress, struggling counted honestly
  total: number;     // problems in the topic
  attempted: number;
  mastered: number;
}

// Per-topic mastery for the constellation visual — the display view (forPriority
// false, so a struggling problem counts as its real low stage, not the 0.5 the
// queue uses to relieve pressure). Ordered by the catalog's topic order.
export function masteryByTopic(problems: CatalogProblem[], progress: ProblemProgress[]): TopicMasteryCell[] {
  const progressByProblem = new Map(progress.map((row) => [row.problemId, row]));
  const topics: string[] = [];
  for (const problem of problems) if (!topics.includes(problem.primaryTopic)) topics.push(problem.primaryTopic);

  return topics.map((topic) => {
    const topicProblems = problems.filter((problem) => problem.primaryTopic === topic);
    const cells = topicProblems.map((problem) => progressByProblem.get(problem.id)).filter((row): row is ProblemProgress => row !== undefined);
    return {
      topic,
      mastery: topicMastery(topic, problems, progressByProblem, false),
      total: topicProblems.length,
      attempted: cells.length,
      mastered: cells.filter((row) => row.status === 'mastered').length
    };
  });
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
