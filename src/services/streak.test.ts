import { describe, expect, it } from 'vitest';
import { currentStreak, refreshGrace, streakEndingOn, type StreakGraceState } from './streak';

const grace = (remaining: number, refreshedOn = '2026-07-01'): StreakGraceState => ({ graceRemaining: remaining, graceRefreshedOn: refreshedOn });
const dates = (...list: string[]) => new Set(list);
const at = (key: string) => new Date(`${key}T12:00:00`);

describe('currentStreak', () => {
  it('counts consecutive active days ending today', () => {
    const result = currentStreak(dates('2026-07-17', '2026-07-18', '2026-07-19'), grace(0), at('2026-07-19'));
    expect(result.streak).toBe(3);
    expect(result.graceDaysUsed).toBe(0);
  });

  it('still counts when today has no attempt yet (streak up to the last active day)', () => {
    const result = currentStreak(dates('2026-07-17', '2026-07-18'), grace(0), at('2026-07-19'));
    expect(result.streak).toBe(2);
  });
});

describe('streakEndingOn', () => {
  it('counts consecutive active days ending on the given date, inclusive', () => {
    expect(streakEndingOn(dates('2026-07-17', '2026-07-18', '2026-07-19'), '2026-07-19')).toBe(3);
  });

  it('is 0 when the end date itself has no attempt', () => {
    expect(streakEndingOn(dates('2026-07-17', '2026-07-18'), '2026-07-19')).toBe(0);
  });

  it('stops at the first gap and ignores grace entirely', () => {
    expect(streakEndingOn(dates('2026-07-15', '2026-07-16', '2026-07-19'), '2026-07-19')).toBe(1);
  });

  it('crosses a month boundary', () => {
    expect(streakEndingOn(dates('2026-07-30', '2026-07-31', '2026-08-01'), '2026-08-01')).toBe(3);
  });

  it('breaks on a gap with no grace left', () => {
    const result = currentStreak(dates('2026-07-15', '2026-07-16', '2026-07-19'), grace(0), at('2026-07-19'));
    expect(result.streak).toBe(1);
  });

  it('a single grace day bridges one missed day', () => {
    // active: 16, 17, 19  — 18 is missed, one grace day covers it
    const result = currentStreak(dates('2026-07-16', '2026-07-17', '2026-07-19'), grace(1), at('2026-07-19'));
    expect(result.streak).toBe(3);
    expect(result.graceDaysUsed).toBe(1);
  });

  it('is idempotent: the returned graceState is the allowance, not a spent-down balance', () => {
    const active = dates('2026-07-16', '2026-07-17', '2026-07-19');
    const now = at('2026-07-19');
    const first = currentStreak(active, grace(1), now);
    // Feed the returned state straight back in — a re-render must not double-spend.
    const second = currentStreak(active, first.graceState, now);
    expect(second.streak).toBe(first.streak);
    expect(second.graceDaysUsed).toBe(first.graceDaysUsed);
    expect(second.graceState).toEqual(first.graceState);
  });

  it('returning after a 3-day absence: one grace day is not enough, streak resets', () => {
    // active up to 15, then away 16/17/18, back on 19
    const result = currentStreak(dates('2026-07-13', '2026-07-14', '2026-07-15', '2026-07-19'), grace(1), at('2026-07-19'));
    expect(result.streak).toBe(1); // only today's run survives
  });

  it('does not spend grace before the streak has started', () => {
    const result = currentStreak(dates('2026-07-10'), grace(3), at('2026-07-19'));
    expect(result.streak).toBe(0);
    expect(result.graceDaysUsed).toBe(0);
  });

  it('does not count grace that bridged nothing (gap before the first-ever attempt)', () => {
    // one active day, then nothing before it — grace must not be "spent" walking
    // backwards into empty pre-history.
    const result = currentStreak(dates('2026-07-19'), grace(1), at('2026-07-19'));
    expect(result.streak).toBe(1);
    expect(result.graceDaysUsed).toBe(0);
  });
});

describe('refreshGrace', () => {
  it('grants one grace day after 7 active days since the last refresh', () => {
    const active = dates('2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07', '2026-07-08');
    const next = refreshGrace(grace(0, '2026-07-01'), active, '2026-07-08');
    expect(next.graceRemaining).toBe(1);
    expect(next.graceRefreshedOn).toBe('2026-07-08');
  });

  it('does not grant before 7 active days', () => {
    const active = dates('2026-07-02', '2026-07-03', '2026-07-04');
    expect(refreshGrace(grace(0, '2026-07-01'), active, '2026-07-05')).toEqual(grace(0, '2026-07-01'));
  });

  it('caps the balance at the per-week allowance', () => {
    const active = new Set(Array.from({ length: 20 }, (_, i) => `2026-07-${String(i + 2).padStart(2, '0')}`));
    const next = refreshGrace(grace(1, '2026-07-01'), active, '2026-07-21');
    expect(next.graceRemaining).toBe(1);
  });
});
