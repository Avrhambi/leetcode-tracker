import { describe, expect, it } from 'vitest';
import { openRecommendationsToComplete } from './recommendations';
import type { RecommendationEvent } from '../types/models';

const now = new Date('2026-07-19T14:00:00');
const event = (over: Partial<RecommendationEvent>): RecommendationEvent => ({
  id: crypto.randomUUID(),
  problemId: 'p1',
  kind: 'new',
  recommendedAt: '2026-07-19T08:00:00.000Z',
  skippedUntil: null,
  completedAt: null,
  ...over
});

describe('openRecommendationsToComplete', () => {
  it('matches an open recommendation for the problem today, regardless of kind', () => {
    const events = [event({ kind: 'review' })];
    expect(openRecommendationsToComplete(events, 'p1', now)).toHaveLength(1);
  });

  it('ignores recommendations for other problems', () => {
    expect(openRecommendationsToComplete([event({ problemId: 'p2' })], 'p1', now)).toHaveLength(0);
  });

  it('ignores recommendations recommended before today', () => {
    expect(openRecommendationsToComplete([event({ recommendedAt: '2026-07-18T08:00:00.000Z' })], 'p1', now)).toHaveLength(0);
  });

  it('ignores skip rows (skippedUntil set)', () => {
    expect(openRecommendationsToComplete([event({ skippedUntil: '2026-07-20T08:00:00.000Z' })], 'p1', now)).toHaveLength(0);
  });

  it('ignores an already-completed recommendation so a second same-day attempt does not rewrite the timestamp', () => {
    expect(openRecommendationsToComplete([event({ completedAt: '2026-07-19T09:00:00.000Z' })], 'p1', now)).toHaveLength(0);
  });

  it('treats a missing completedAt field as not completed', () => {
    const { completedAt, ...rest } = event({});
    void completedAt;
    expect(openRecommendationsToComplete([rest as RecommendationEvent], 'p1', now)).toHaveLength(1);
  });

  it('completes every open event for the problem today, both kinds', () => {
    const events = [event({ kind: 'new' }), event({ kind: 'review' }), event({ problemId: 'p2' })];
    expect(openRecommendationsToComplete(events, 'p1', now)).toHaveLength(2);
  });
});
