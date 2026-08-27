import { describe, expect, it } from 'vitest';
import { strugglingProblems, topicTrajectory } from './mastery';
import type { Attempt, CatalogProblem, ProblemProgress, Quality } from '../types/models';

const problems: CatalogProblem[] = [
  { id: 'a', title: 'A', slug: 'a', leetcodeUrl: '', difficulty: 'easy', topics: ['Arrays'], primaryTopic: 'Arrays', neetcodeOrder: 1 },
  { id: 'b', title: 'B', slug: 'b', leetcodeUrl: '', difficulty: 'medium', topics: ['Arrays'], primaryTopic: 'Arrays', neetcodeOrder: 2 },
  { id: 'c', title: 'C', slug: 'c', leetcodeUrl: '', difficulty: 'easy', topics: ['Trees'], primaryTopic: 'Trees', neetcodeOrder: 3 }
];

let seq = 0;
const attempt = (problemId: string, quality: Quality): Attempt => ({
  id: `x${seq}`, problemId, attemptedOn: '2026-07-19', outcome: 'solved_independently', perceivedDifficulty: 'manageable',
  helpType: null, durationMinutes: null, notes: '', quality, createdAt: `2026-07-19T00:00:${String(seq++).padStart(2, '0')}.000Z`
});

const progress = (changes: Partial<ProblemProgress>): ProblemProgress => ({
  problemId: 'a', status: 'attempted', reviewStage: 0, nextReviewDate: null, lastAttemptDate: null,
  lastQuality: null, strongAttemptCount: 0, consecutiveWeak: 0, struggling: false, updatedAt: '', ...changes
});

describe('topicTrajectory', () => {
  it('is flat with too few attempts', () => {
    expect(topicTrajectory('Arrays', [attempt('a', 'weak'), attempt('a', 'strong')], problems)).toBe('flat');
  });
  it('detects improvement', () => {
    const attempts = [attempt('a', 'weak'), attempt('a', 'weak'), attempt('b', 'strong'), attempt('b', 'strong')];
    expect(topicTrajectory('Arrays', attempts, problems)).toBe('improving');
  });
  it('detects decline', () => {
    const attempts = [attempt('a', 'strong'), attempt('a', 'strong'), attempt('b', 'weak'), attempt('b', 'weak')];
    expect(topicTrajectory('Arrays', attempts, problems)).toBe('declining');
  });
  it('is flat when quality holds steady', () => {
    const attempts = [attempt('a', 'partial'), attempt('a', 'partial'), attempt('b', 'partial'), attempt('b', 'partial')];
    expect(topicTrajectory('Arrays', attempts, problems)).toBe('flat');
  });
  it('ignores attempts from other topics', () => {
    const attempts = [attempt('c', 'weak'), attempt('c', 'weak'), attempt('a', 'strong'), attempt('a', 'strong')];
    expect(topicTrajectory('Arrays', attempts, problems)).toBe('flat');
  });
});

describe('strugglingProblems', () => {
  it('returns only flagged problems, weakest run first', () => {
    const rows = [
      progress({ problemId: 'a', struggling: true, consecutiveWeak: 3 }),
      progress({ problemId: 'b', struggling: false, consecutiveWeak: 1 }),
      progress({ problemId: 'c', struggling: true, consecutiveWeak: 5 })
    ];
    expect(strugglingProblems(rows).map((p) => p.problemId)).toEqual(['c', 'a']);
  });
});
