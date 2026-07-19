import { describe, expect, it } from 'vitest';
import { localDate, progressAfterAttempt, qualityFor, reviewDate } from './reviews';

describe('attempt quality', () => {
  it('classifies outcome and perceived difficulty', () => {
    expect(qualityFor('solved_independently', 'easy')).toBe('strong');
    expect(qualityFor('solved_independently', 'hard')).toBe('partial');
    expect(qualityFor('solved_with_hint', 'manageable')).toBe('partial');
    expect(qualityFor('watched_solution', 'easy')).toBe('weak');
    expect(qualityFor('could_not_solve', 'easy')).toBe('weak');
  });
});

describe('review progress', () => {
  const today = new Date(2026, 6, 19);
  it('uses local calendar dates for stages', () => {
    expect(localDate(1, today)).toBe('2026-07-20'); expect(reviewDate(0, today)).toBe('2026-07-20'); expect(reviewDate(1, today)).toBe('2026-07-22'); expect(reviewDate(4, today)).toBe('2026-08-18'); expect(reviewDate(5, today)).toBeNull();
  });
  it('resets weak attempts and promotes partial attempts', () => {
    const existing = { problemId: 'one', status: 'mastered' as const, reviewStage: 5 as const, nextReviewDate: null, lastAttemptDate: null, lastQuality: 'strong' as const, strongAttemptCount: 3, updatedAt: '' };
    expect(progressAfterAttempt(existing, 'weak', '2026-07-19', 'now', today)).toMatchObject({ status: 'attempted', reviewStage: 0, nextReviewDate: '2026-07-20', strongAttemptCount: 3 });
    expect(progressAfterAttempt(existing, 'partial', '2026-07-19', 'now', today)).toMatchObject({ status: 'solved', reviewStage: 1, nextReviewDate: '2026-07-22' });
  });
  it('caps strong attempts at mastery', () => {
    const existing = { problemId: 'one', status: 'solved' as const, reviewStage: 4 as const, nextReviewDate: '2026-08-18', lastAttemptDate: null, lastQuality: 'strong' as const, strongAttemptCount: 2, updatedAt: '' };
    expect(progressAfterAttempt(existing, 'strong', '2026-07-19', 'now', today)).toMatchObject({ status: 'mastered', reviewStage: 5, nextReviewDate: null, strongAttemptCount: 3 });
  });
});
