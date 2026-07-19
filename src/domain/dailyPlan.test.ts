import { describe, expect, it } from 'vitest';
import { selectDailyPlan } from './dailyPlan';
import type { CatalogProblem, ProblemProgress, RecommendationEvent } from '../types/models';

const problems: CatalogProblem[] = [
  { id: 'a', title: 'A', slug: 'a', leetcodeUrl: 'https://leetcode.com/problems/a/', difficulty: 'easy', topics: ['Arrays'], primaryTopic: 'Arrays', neetcodeOrder: 1 },
  { id: 'b', title: 'B', slug: 'b', leetcodeUrl: 'https://leetcode.com/problems/b/', difficulty: 'medium', topics: ['Arrays'], primaryTopic: 'Arrays', neetcodeOrder: 2 },
  { id: 'c', title: 'C', slug: 'c', leetcodeUrl: 'https://leetcode.com/problems/c/', difficulty: 'hard', topics: ['Trees'], primaryTopic: 'Trees', neetcodeOrder: 3 },
  { id: 'd', title: 'D', slug: 'd', leetcodeUrl: 'https://leetcode.com/problems/d/', difficulty: 'easy', topics: ['Trees'], primaryTopic: 'Trees', neetcodeOrder: 4 }
];
const now = new Date(2026, 6, 19, 12);
const progress = (problemId: string, changes: Partial<ProblemProgress>): ProblemProgress => ({ problemId, status: 'attempted', reviewStage: 0, nextReviewDate: null, lastAttemptDate: null, lastQuality: null, strongAttemptCount: 0, updatedAt: '', ...changes });
const event = (problemId: string, kind: RecommendationEvent['kind'], recommendedAt: string, skippedUntil: string | null = null): RecommendationEvent => ({ id: `${problemId}-${recommendedAt}`, problemId, kind, recommendedAt, skippedUntil });

describe('daily plan selection', () => {
  it('limits the daily challenge to the two earliest due reviews', () => {
    const result = selectDailyPlan({ problems, progress: [progress('c', { nextReviewDate: '2026-07-19' }), progress('b', { nextReviewDate: '2026-07-18' }), progress('a', { nextReviewDate: '2026-07-17' })], recommendationEvents: [], now });
    expect(result.map((item) => `${item.kind}:${item.problem.id}`)).toEqual(['review:a', 'review:b']);
  });
  it('uses topic attempt counts, gates difficulty, and avoids the last two new topics', () => {
    const result = selectDailyPlan({ problems, progress: [progress('a', { strongAttemptCount: 2 })], recommendationEvents: [event('a', 'new', '2026-07-18T09:00:00.000Z')], now });
    expect(result[0]?.problem.id).toBe('d');
  });
  it('does not select items with an active skip', () => {
    const result = selectDailyPlan({ problems, progress: [], recommendationEvents: [event('a', 'new', '2026-07-19T10:00:00.000Z', '2026-07-20T10:00:00.000Z')], now });
    expect(result.at(-1)?.problem.id).not.toBe('a');
  });
  it('fills the daily challenge with two distinct problems when there are no due reviews', () => {
    const result = selectDailyPlan({ problems, progress: [], recommendationEvents: [], now });
    expect(result).toHaveLength(2);
    expect(new Set(result.map((item) => item.problem.id)).size).toBe(2);
  });
  it('keeps today’s recommended challenges after their progress changes', () => {
    const result = selectDailyPlan({
      problems,
      progress: [progress('a', { status: 'solved' }), progress('d', { status: 'solved' })],
      recommendationEvents: [event('a', 'new', '2026-07-19T10:00:00.000Z'), event('d', 'new', '2026-07-19T10:00:00.000Z')],
      now
    });
    expect(result.map((item) => item.problem.id)).toEqual(['a', 'd']);
  });
  it('fills an incomplete current-day plan without replacing its existing recommendation', () => {
    const result = selectDailyPlan({
      problems,
      progress: [],
      recommendationEvents: [event('a', 'new', '2026-07-19T10:00:00.000Z')],
      now
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.problem.id).toBe('a');
  });
  it('shows only two problems when more current-day recommendations were previously saved', () => {
    const result = selectDailyPlan({
      problems,
      progress: [],
      recommendationEvents: [event('a', 'new', '2026-07-19T10:00:00.000Z'), event('b', 'new', '2026-07-19T10:00:00.000Z'), event('c', 'new', '2026-07-19T10:00:00.000Z')],
      now
    });
    expect(result).toHaveLength(2);
  });
});
