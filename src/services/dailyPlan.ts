import type { CatalogProblem, ProblemProgress, Quality, RecommendationEvent } from '../types/models';
import { tierWeight } from '../data/topicTiers';

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

const MAX_REVIEW_STAGE = 5;
const QUALITY_RANK: Record<Quality, number> = { weak: 0, partial: 1, strong: 2 };
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const;

function localToday(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDay(iso: string): string {
  return localToday(new Date(iso));
}

// Deterministic per-day, per-topic jitter in [0, 0.05) so topic order is not a
// fixed march down NeetCode order, while staying stable within a single day
// (the same-day replay branch depends on the plan being reproducible).
function jitter(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * 0.05;
}

// Number of review / new slots given how many reviews are due today. Always at
// least one new problem so fresh material never disappears; grows the plan to
// absorb a review backlog (2 items on a clean day, up to 4 when heavily behind).
function planSlots(dueCount: number): { reviewSlots: number; newSlots: number } {
  const reviewSlots = dueCount === 0 ? 0 : dueCount <= 2 ? 1 : dueCount <= 5 ? 2 : 3;
  const newSlots = dueCount <= 1 ? 2 : 1;
  return { reviewSlots, newSlots };
}

// Every problem due for review today, weakest-and-most-overdue first. Shared by
// the daily plan (which takes a handful off the top) and the review queue panel
// (which shows the whole list). `skipUntil` events are *not* filtered here — the
// queue is the "review everything" surface, so a problem skipped from the daily
// challenge still shows up as due. The daily plan applies its own skip filter.
export interface DueReview {
  problem: CatalogProblem;
  progress: ProblemProgress;
}

export function dueReviewQueue(problems: CatalogProblem[], progress: ProblemProgress[], now: Date = new Date()): DueReview[] {
  const today = localToday(now);
  const progressByProblem = new Map(progress.map((item) => [item.problemId, item]));
  return problems
    .map((problem) => ({ problem, progress: progressByProblem.get(problem.id) }))
    .filter((entry): entry is DueReview => {
      const next = entry.progress?.nextReviewDate;
      return next !== null && next !== undefined && next <= today;
    })
    .sort((left, right) =>
      QUALITY_RANK[left.progress.lastQuality ?? 'strong'] - QUALITY_RANK[right.progress.lastQuality ?? 'strong'] ||
      (left.progress.nextReviewDate ?? '').localeCompare(right.progress.nextReviewDate ?? '') ||
      left.problem.neetcodeOrder - right.problem.neetcodeOrder
    );
}

export function selectDailyPlan({ problems, progress, recommendationEvents, now = new Date() }: DailyPlanInput): DailyPlanItem[] {
  const progressByProblem = new Map(progress.map((item) => [item.problemId, item]));
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const hiddenProblemIds = new Set(recommendationEvents.filter((event) => event.skippedUntil !== null && new Date(event.skippedUntil) > now).map((event) => event.problemId));

  const dueReviews = dueReviewQueue(problems, progress, now).filter((entry) => !hiddenProblemIds.has(entry.problem.id));

  const { reviewSlots, newSlots } = planSlots(dueReviews.length);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayRecommendations = recommendationEvents.filter((event) => new Date(event.recommendedAt) >= startOfToday && event.skippedUntil === null);

  // Same-day replay: once any recommendation was persisted today, anchor the
  // plan on those stored items so it stays stable as progress changes, topping
  // up new problems if the stored set is short of the current new-slot target.
  if (todayRecommendations.length > 0) {
    const seen = new Set<string>();
    const plan: DailyPlanItem[] = todayRecommendations
      .filter((event) => !hiddenProblemIds.has(event.problemId) && !seen.has(event.problemId) && seen.add(event.problemId))
      .map((event) => ({ problem: problemById.get(event.problemId), kind: event.kind }))
      .filter((item): item is DailyPlanItem => item.problem !== undefined)
      .sort((left, right) => left.kind.localeCompare(right.kind) || left.problem.neetcodeOrder - right.problem.neetcodeOrder);

    const storedNew = plan.filter((item) => item.kind === 'new').length;
    let target = plan.length + Math.max(0, newSlots - storedNew);
    if (target < 2) target = 2;
    if (target > 4) target = 4;
    fillNewProblems(plan, target, problems, progressByProblem, recommendationEvents, hiddenProblemIds, problemById, now);
    return plan;
  }

  const plan: DailyPlanItem[] = dueReviews.slice(0, reviewSlots).map(({ problem }) => ({ problem, kind: 'review' as const }));
  fillNewProblems(plan, plan.length + newSlots, problems, progressByProblem, recommendationEvents, hiddenProblemIds, problemById, now);
  return plan;
}

function fillNewProblems(plan: DailyPlanItem[], target: number, problems: CatalogProblem[], progressByProblem: Map<string, ProblemProgress>, events: RecommendationEvent[], hiddenProblemIds: Set<string>, problemById: Map<string, CatalogProblem>, now: Date): void {
  while (plan.length < target) {
    const usedProblemIds = new Set(plan.map((item) => item.problem.id));
    const usedTopics = new Set(plan.map((item) => item.problem.primaryTopic));
    const nextProblem = selectNewProblem(problems, progressByProblem, events, hiddenProblemIds, usedProblemIds, usedTopics, problemById, now);
    if (!nextProblem) break;
    plan.push({ problem: nextProblem, kind: 'new' });
  }
}

// Mean mastery of a topic in [0, 1]: reviewStage/5 per problem, 0 for untouched.
//
// `struggling` problems get different treatment per call site (`forPriority`):
//   - priority (new-problem topic pick): a struggling problem contributes a
//     neutral 0.5 rather than its reset-to-0 stage, so a topic the user is stuck
//     on stops being pinned at maximum priority and flooding them with more
//     problems from it.
//   - difficulty ceiling: a struggling problem contributes its real (0) stage,
//     so the ceiling stays low — a topic the user is failing must not unlock
//     Medium/Hard just because its struggling problems were lifted to 0.5.
export function topicMastery(topic: string, problems: CatalogProblem[], progressByProblem: Map<string, ProblemProgress>, forPriority: boolean): number {
  const topicProblems = problems.filter((problem) => problem.primaryTopic === topic);
  if (topicProblems.length === 0) return 1;
  const total = topicProblems.reduce((sum, problem) => {
    const progress = progressByProblem.get(problem.id);
    if (forPriority && progress?.struggling) return sum + 0.5;
    return sum + (progress?.reviewStage ?? 0) / MAX_REVIEW_STAGE;
  }, 0);
  return total / topicProblems.length;
}

function maxDifficultyFor(mastery: number): number {
  const level = mastery >= 0.5 ? 'hard' : mastery >= 0.2 ? 'medium' : 'easy';
  return DIFFICULTY_ORDER.indexOf(level);
}

function selectNewProblem(problems: CatalogProblem[], progressByProblem: Map<string, ProblemProgress>, events: RecommendationEvent[], hiddenProblemIds: Set<string>, selectedProblemIds: Set<string>, selectedTopics: Set<string>, problemById: Map<string, CatalogProblem>, now: Date): CatalogProblem | undefined {
  const candidates = problems.filter((problem) => {
    const status = progressByProblem.get(problem.id)?.status;
    return !hiddenProblemIds.has(problem.id) && !selectedProblemIds.has(problem.id) && status !== 'solved' && status !== 'mastered';
  });
  const eligibleTopics = [...new Set(candidates.map((problem) => problem.primaryTopic))];
  if (eligibleTopics.length === 0) return undefined;

  const today = localToday(now);
  const recentTopics = new Set(
    events
      .filter((event) => event.kind === 'new' && localDay(event.recommendedAt) < today)
      .sort((left, right) => right.recommendedAt.localeCompare(left.recommendedAt))
      .map((event) => ({ topic: problemById.get(event.problemId)?.primaryTopic, day: localDay(event.recommendedAt) }))
      .filter((entry): entry is { topic: string; day: string } => entry.topic !== undefined)
      .reduce<{ days: Set<string>; topics: string[] }>((accumulator, entry) => {
        if (accumulator.days.size < 2 || accumulator.days.has(entry.day)) {
          accumulator.days.add(entry.day);
          accumulator.topics.push(entry.topic);
        }
        return accumulator;
      }, { days: new Set(), topics: [] }).topics
  );

  const chosenTopic = eligibleTopics
    .map((topic) => {
      const mastery = topicMastery(topic, problems, progressByProblem, true);
      const recencyPenalty = recentTopics.has(topic) || selectedTopics.has(topic) ? 0.35 : 1;
      const priority = tierWeight(topic) * (1 - mastery) * recencyPenalty + jitter(today + topic);
      return { topic, priority };
    })
    .sort((left, right) => right.priority - left.priority)[0]?.topic;
  if (!chosenTopic) return undefined;

  const ceilingMastery = topicMastery(chosenTopic, problems, progressByProblem, false);
  const maxDifficulty = maxDifficultyFor(ceilingMastery);
  const topicProblems = candidates
    .filter((problem) => problem.primaryTopic === chosenTopic)
    .sort((left, right) => DIFFICULTY_ORDER.indexOf(left.difficulty) - DIFFICULTY_ORDER.indexOf(right.difficulty) || left.neetcodeOrder - right.neetcodeOrder);

  const gated = topicProblems.filter((problem) => DIFFICULTY_ORDER.indexOf(problem.difficulty) <= maxDifficulty);
  return gated[0] ?? topicProblems[0];
}
