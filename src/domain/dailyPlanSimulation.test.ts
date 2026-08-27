import { describe, expect, it } from 'vitest';
import { selectDailyPlan } from './dailyPlan';
import { progressAfterAttempt, localDate } from './reviews';
import { catalog } from '../data/catalog';
import { TOPIC_TIERS } from '../data/topicTiers';
import type { ProblemProgress, RecommendationEvent } from '../types/models';

// Replays N simulated days over the real catalog, always solving each item
// strongly so review stages (and topic mastery) advance the way they would for
// a diligent user. Asserts the qualities the adaptive plan is meant to have.
function simulate(days: number) {
  const progress = new Map<string, ProblemProgress>();
  const events: RecommendationEvent[] = [];
  const perDay: { kind: string; topic: string }[][] = [];
  for (let day = 0; day < days; day += 1) {
    const now = new Date(2026, 6, 1 + day, 12);
    const plan = selectDailyPlan({ problems: catalog, progress: [...progress.values()], recommendationEvents: events, now });
    perDay.push(plan.map((item) => ({ kind: item.kind, topic: item.problem.primaryTopic })));
    for (const item of plan) {
      events.push({ id: `${item.problem.id}-${day}`, problemId: item.problem.id, kind: item.kind, recommendedAt: now.toISOString(), skippedUntil: null });
      const next = progressAfterAttempt(progress.get(item.problem.id), 'strong', localDate(0, now), now.toISOString(), now);
      progress.set(item.problem.id, { ...next, problemId: item.problem.id });
    }
  }
  return { perDay, progress };
}

describe('daily plan simulation over the real catalog', () => {
  it('keeps every day sized 2-4 with at least one new problem', () => {
    const { perDay } = simulate(30);
    for (const plan of perDay) {
      expect(plan.length).toBeGreaterThanOrEqual(2);
      expect(plan.length).toBeLessThanOrEqual(4);
      expect(plan.some((item) => item.kind === 'new')).toBe(true);
    }
  });

  it('never serves two new problems from the same topic on one day', () => {
    const { perDay } = simulate(30);
    for (const plan of perDay) {
      const newTopics = plan.filter((item) => item.kind === 'new').map((item) => item.topic);
      expect(new Set(newTopics).size).toBe(newTopics.length);
    }
  });

  it('rotates across every foundational topic within a month', () => {
    const { perDay } = simulate(30);
    const topics = new Set(perDay.flat().filter((item) => item.kind === 'new').map((item) => item.topic));
    // All seven tier-1 topics, versus the old engine's 5 topics in 14 days that
    // just ping-ponged between Arrays and Two Pointers.
    expect(topics.size).toBeGreaterThanOrEqual(7);
  });

  it('keeps new problems inside tier-1 foundations over the first two weeks', () => {
    const { perDay } = simulate(14);
    const newTopics = perDay.flat().filter((item) => item.kind === 'new').map((item) => item.topic);
    expect(newTopics.every((topic) => TOPIC_TIERS[topic] === 1)).toBe(true);
  });

  it('progresses to tier-2 and tier-3 topics once foundations are worked through', () => {
    const { perDay } = simulate(90);
    const tiers = new Set(perDay.flat().filter((item) => item.kind === 'new').map((item) => TOPIC_TIERS[item.topic]));
    expect(tiers.has(2)).toBe(true);
    expect(tiers.has(3)).toBe(true);
  });

  it('stops recommending a topic once it is fully mastered', () => {
    const target = 'Two Pointers';
    const progress = new Map<string, ProblemProgress>();
    // Drive every Two Pointers problem to mastered (reviewStage 5).
    for (const problem of catalog.filter((item) => item.primaryTopic === target)) {
      progress.set(problem.id, { problemId: problem.id, status: 'mastered', reviewStage: 5, nextReviewDate: null, lastAttemptDate: null, lastQuality: 'strong', strongAttemptCount: 5, updatedAt: '' });
    }
    const plan = selectDailyPlan({ problems: catalog, progress: [...progress.values()], recommendationEvents: [], now: new Date(2026, 6, 1, 12) });
    expect(plan.every((item) => item.problem.primaryTopic !== target || item.kind === 'review')).toBe(true);
  });
});
