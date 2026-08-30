import { describe, expect, it } from 'vitest';
import { levelForXp, replayXp, snapshotForXp, xpForAttempt, xpForLevel } from './gamification';
import { streakEndingOn } from './streak';
import type { Attempt } from '../types/models';

const attempt = (over: Partial<Attempt>): Attempt => ({
  id: crypto.randomUUID(),
  problemId: 'p1',
  attemptedOn: '2026-08-01',
  outcome: 'solved_independently',
  perceivedDifficulty: 'manageable',
  helpType: null,
  durationMinutes: null,
  notes: '',
  quality: 'strong',
  createdAt: '2026-08-01T10:00:00.000Z',
  ...over
});

describe('xpForAttempt', () => {
  it('awards the full quality-based amount on the first attempt of a ×1.0 streak day', () => {
    expect(xpForAttempt('strong', true, 1)).toBe(20);
    expect(xpForAttempt('partial', true, 2)).toBe(12);
    expect(xpForAttempt('weak', true, 0)).toBe(5);
  });

  it('awards a quarter (rounded) for a same-day reinforcement pass', () => {
    expect(xpForAttempt('strong', false, 1)).toBe(5);
    expect(xpForAttempt('partial', false, 1)).toBe(3);
    expect(xpForAttempt('weak', false, 1)).toBe(1);
  });

  it('scales by the streak-consistency multiplier, rounding once over the whole product', () => {
    expect(xpForAttempt('strong', true, 3)).toBe(22); // 20 × 1.1
    expect(xpForAttempt('strong', true, 7)).toBe(25); // 20 × 1.25
    expect(xpForAttempt('strong', true, 14)).toBe(30); // 20 × 1.5
    expect(xpForAttempt('strong', true, 999)).toBe(30); // ceiling holds
    expect(xpForAttempt('partial', true, 3)).toBe(13); // round(12 × 1.1 = 13.2)
    expect(xpForAttempt('weak', false, 7)).toBe(2); // round(5 × 0.25 × 1.25 = 1.5625)
  });
});

describe('levelForXp / xpForLevel', () => {
  it('is 0 at 0 XP and non-positive XP', () => {
    expect(levelForXp(0)).toBe(0);
    expect(levelForXp(-100)).toBe(0);
  });

  it('hits the expected breakpoints', () => {
    expect(levelForXp(49)).toBe(0);
    expect(levelForXp(50)).toBe(1);
    expect(levelForXp(199)).toBe(1);
    expect(levelForXp(200)).toBe(2);
    expect(levelForXp(450)).toBe(3);
    expect(levelForXp(800)).toBe(4);
  });

  it('is monotonic non-decreasing across a wide range', () => {
    let last = 0;
    for (let xp = 0; xp <= 5000; xp += 7) {
      const level = levelForXp(xp);
      expect(level).toBeGreaterThanOrEqual(last);
      last = level;
    }
  });

  it('xpForLevel is the inverse boundary of levelForXp', () => {
    for (let level = 0; level <= 10; level += 1) {
      const start = xpForLevel(level);
      expect(levelForXp(start)).toBe(level);
      if (start > 0) expect(levelForXp(start - 1)).toBe(level - 1);
    }
  });
});

describe('snapshotForXp', () => {
  it('reports progress within the current level', () => {
    const snap = snapshotForXp(120);
    expect(snap.level).toBe(1);
    expect(snap.xpIntoLevel).toBe(70); // 120 - 50
    expect(snap.xpForNextLevel).toBe(150); // 200 - 50
  });

  it('is exact at a level boundary', () => {
    const snap = snapshotForXp(200);
    expect(snap.level).toBe(2);
    expect(snap.xpIntoLevel).toBe(0);
  });
});

describe('replayXp', () => {
  it('sums first-of-day XP across distinct problem-days (all ×1.0, streak < 3)', () => {
    const xp = replayXp([
      attempt({ problemId: 'p1', attemptedOn: '2026-08-01', quality: 'strong' }),
      attempt({ problemId: 'p2', attemptedOn: '2026-08-01', quality: 'weak' }),
      attempt({ problemId: 'p1', attemptedOn: '2026-08-02', quality: 'partial' })
    ]);
    expect(xp).toBe(20 + 5 + 12);
  });

  it('applies the consistency multiplier once the streak crosses a tier', () => {
    // Five consecutive days, one strong attempt each. Days 1–2 ×1.0, days 3–5 ×1.1.
    const days = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'];
    const xp = replayXp(days.map((d, i) => attempt({
      problemId: `p${i}`, attemptedOn: d, quality: 'strong', createdAt: `${d}T09:00:00.000Z`
    })));
    expect(xp).toBe(20 + 20 + 22 + 22 + 22);
  });

  it('discounts a same-day repeat regardless of insertion order', () => {
    const first = attempt({ problemId: 'p1', attemptedOn: '2026-08-01', quality: 'strong', createdAt: '2026-08-01T09:00:00.000Z' });
    const repeat = attempt({ problemId: 'p1', attemptedOn: '2026-08-01', quality: 'strong', createdAt: '2026-08-01T18:00:00.000Z' });
    expect(replayXp([repeat, first])).toBe(20 + 5);
  });

  it('is 0 for an empty history', () => {
    expect(replayXp([])).toBe(0);
  });

  // The live path (saveAttempt) computes isFirstOfDay by counting attempt rows
  // already stored for this problem + attemptedOn. This folds a history the same
  // way and must land on the same lifetime total replayXp reports.
  it('agrees with an incremental live-award fold, including a backdated attempt', () => {
    const history: Attempt[] = [
      attempt({ id: 'a', problemId: 'p1', attemptedOn: '2026-08-01', quality: 'strong', createdAt: '2026-08-01T09:00:00.000Z' }),
      attempt({ id: 'b', problemId: 'p1', attemptedOn: '2026-08-01', quality: 'weak', createdAt: '2026-08-01T20:00:00.000Z' }),
      attempt({ id: 'c', problemId: 'p2', attemptedOn: '2026-08-02', quality: 'partial', createdAt: '2026-08-02T09:00:00.000Z' }),
      // logged on the 3rd but backdated to the 1st — a fresh problem-day
      attempt({ id: 'd', problemId: 'p1', attemptedOn: '2026-07-30', quality: 'strong', createdAt: '2026-08-03T09:00:00.000Z' })
    ];

    // Mirror saveAttempt: fold in createdAt order, accumulating active dates, and
    // compute the streak-ending-on multiplier from the dates seen so far.
    let liveTotal = 0;
    const stored: Attempt[] = [];
    const activeDates = new Set<string>();
    for (const next of history) {
      const isFirstOfDay = !stored.some((a) => a.problemId === next.problemId && a.attemptedOn === next.attemptedOn);
      activeDates.add(next.attemptedOn);
      liveTotal += xpForAttempt(next.quality, isFirstOfDay, streakEndingOn(activeDates, next.attemptedOn));
      stored.push(next);
    }

    expect(replayXp(history)).toBe(liveTotal);
  });
});
