import type { CatalogProblem, ProblemProgress, RecommendationEvent } from '../types/models';

export interface DailyPlanItem {
  problem: CatalogProblem;
  kind: 'new' | 'review';
}

interface DailyPlanInput {
  problems: CatalogProblem[];
  progress: ProblemProgress[];
  recommendationEvents: RecommendationEvent[];
  now?: Date;
}

function localToday(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectDailyPlan({ problems, progress, recommendationEvents, now = new Date() }: DailyPlanInput): DailyPlanItem[] {
  const today = localToday(now);
  const progressByProblem = new Map(progress.map((item) => [item.problemId, item]));
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const hiddenProblemIds = new Set(recommendationEvents.filter((event) => event.skippedUntil !== null && new Date(event.skippedUntil) > now).map((event) => event.problemId));
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayRecommendations = recommendationEvents.filter((event) => new Date(event.recommendedAt) >= startOfToday && event.skippedUntil === null);
  if (todayRecommendations.length > 0) {
    const seenProblemIds = new Set<string>();
    const plan: DailyPlanItem[] = todayRecommendations
      .filter((event) => !hiddenProblemIds.has(event.problemId) && !seenProblemIds.has(event.problemId) && seenProblemIds.add(event.problemId))
      .map((event) => ({ problem: problemById.get(event.problemId), kind: event.kind }))
      .filter((item): item is DailyPlanItem => item.problem !== undefined)
      .sort((left, right) => left.kind.localeCompare(right.kind) || left.problem.neetcodeOrder - right.problem.neetcodeOrder)
      .slice(0, 2);
    while (plan.length < 2) {
      const nextProblem = selectNewProblem(problems, progressByProblem, recommendationEvents, hiddenProblemIds, new Set(plan.map((item) => item.problem.id)), problemById, now);
      if (!nextProblem) break;
      plan.push({ problem: nextProblem, kind: 'new' });
    }
    return plan;
  }
  const reviews = problems
    .filter((problem) => !hiddenProblemIds.has(problem.id))
    .filter((problem) => {
      const item = progressByProblem.get(problem.id);
      return item?.nextReviewDate !== null && item?.nextReviewDate !== undefined && item.nextReviewDate <= today;
    })
    .sort((left, right) => (progressByProblem.get(left.id)?.nextReviewDate ?? '').localeCompare(progressByProblem.get(right.id)?.nextReviewDate ?? '') || left.neetcodeOrder - right.neetcodeOrder)
    .slice(0, 2)
    .map((problem) => ({ problem, kind: 'review' as const }));

  const plan: DailyPlanItem[] = [...reviews];

  while (plan.length < 2) {
    const nextProblem = selectNewProblem(problems, progressByProblem, recommendationEvents, hiddenProblemIds, new Set(plan.map((item) => item.problem.id)), problemById, now);
    if (!nextProblem) break;
    plan.push({ problem: nextProblem, kind: 'new' });
  }

  return plan;
}

function selectNewProblem(problems: CatalogProblem[], progressByProblem: Map<string, ProblemProgress>, events: RecommendationEvent[], hiddenProblemIds: Set<string>, selectedProblemIds: Set<string>, problemById: Map<string, CatalogProblem>, now: Date): CatalogProblem | undefined {
  const candidates = problems.filter((problem) => {
    const status = progressByProblem.get(problem.id)?.status;
    return !hiddenProblemIds.has(problem.id) && !selectedProblemIds.has(problem.id) && status !== 'solved' && status !== 'mastered';
  });
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recentTopics = events.filter((event) => event.kind === 'new' && new Date(event.recommendedAt) < startOfToday).sort((left, right) => right.recommendedAt.localeCompare(left.recommendedAt)).slice(0, 2).map((event) => problemById.get(event.problemId)?.primaryTopic).filter((topic): topic is string => topic !== undefined);
  const eligibleTopics = [...new Set(candidates.map((problem) => problem.primaryTopic))];
  const unexcludedTopics = eligibleTopics.filter((topic) => !recentTopics.includes(topic));
  const topics = unexcludedTopics.length > 0 ? unexcludedTopics : eligibleTopics;
  const chosenTopic = topics.sort((left, right) => attemptedCount(left, candidates, progressByProblem) - attemptedCount(right, candidates, progressByProblem) || firstTopicOrder(left, candidates) - firstTopicOrder(right, candidates))[0];
  if (!chosenTopic) return undefined;

  const topicProblems = candidates.filter((problem) => problem.primaryTopic === chosenTopic);
  const strongAttempts = [...progressByProblem.values()].filter((item) => problemById.get(item.problemId)?.primaryTopic === chosenTopic).reduce((total, item) => total + item.strongAttemptCount, 0);
  const allowedDifficulties = strongAttempts >= 3 ? ['easy', 'medium', 'hard'] : strongAttempts >= 2 ? ['easy', 'medium'] : ['easy'];
  const difficultyOrder = ['easy', 'medium', 'hard'];
  const gated = topicProblems.filter((problem) => allowedDifficulties.includes(problem.difficulty)).sort((left, right) => difficultyOrder.indexOf(left.difficulty) - difficultyOrder.indexOf(right.difficulty) || left.neetcodeOrder - right.neetcodeOrder);
  return gated[0] ?? topicProblems.filter((problem) => !progressByProblem.has(problem.id)).sort((left, right) => left.neetcodeOrder - right.neetcodeOrder)[0];
}

function attemptedCount(topic: string, problems: CatalogProblem[], progressByProblem: Map<string, ProblemProgress>): number {
  return problems.filter((problem) => problem.primaryTopic === topic && progressByProblem.has(problem.id)).length;
}

function firstTopicOrder(topic: string, problems: CatalogProblem[]): number {
  return Math.min(...problems.filter((problem) => problem.primaryTopic === topic).map((problem) => problem.neetcodeOrder));
}
