import { describe, expect, it } from 'vitest';
import { validateBackupPayload } from './backup';
import type { ProblemProgress } from '../types/models';

const v1Progress = {
  problemId: 'two-sum', status: 'solved', reviewStage: 2, nextReviewDate: '2026-07-26',
  lastAttemptDate: '2026-07-19', lastQuality: 'strong', strongAttemptCount: 2, updatedAt: '2026-07-19T00:00:00.000Z'
};
const v2Progress: ProblemProgress = { ...v1Progress, status: 'solved', lastQuality: 'strong', consecutiveWeak: 0, struggling: false } as ProblemProgress;

const base = { exportedAt: '2026-07-19T00:00:00.000Z', attempts: [], recommendationEvents: [], settings: [{ key: 'catalogVersion', value: '1' }] };
const v1Backup = { ...base, formatVersion: 1, progress: [v1Progress] };
const v2Backup = { ...base, formatVersion: 2, progress: [v2Progress] };

describe('validateBackupPayload', () => {
  it('accepts a version-one backup whose progress omits the v2 fields', () => {
    expect(validateBackupPayload(v1Backup)).toEqual(v1Backup);
  });
  it('accepts a version-two backup that carries the v2 fields', () => {
    expect(validateBackupPayload(v2Backup)).toEqual(v2Backup);
  });
  it('accepts the new streak settings keys', () => {
    const withStreak = { ...v2Backup, settings: [{ key: 'streakGraceRemaining', value: '1' }, { key: 'streakGraceRefreshedOn', value: '2026-07-19' }] };
    expect(validateBackupPayload(withStreak)).toEqual(withStreak);
  });
  it('rejects invalid nested user data before restore', () => {
    expect(() => validateBackupPayload({ ...v1Backup, attempts: [{ id: 'a' }] })).toThrow('valid LeetCode Tracker backup');
  });
  it('rejects a malformed v2 field', () => {
    expect(() => validateBackupPayload({ ...v2Backup, progress: [{ ...v2Progress, consecutiveWeak: -1 }] })).toThrow('valid LeetCode Tracker backup');
  });
  it('rejects an unsupported format version', () => {
    expect(() => validateBackupPayload({ ...v1Backup, formatVersion: 3 })).toThrow('valid LeetCode Tracker backup');
  });
  it('rejects an unknown settings key', () => {
    expect(() => validateBackupPayload({ ...v1Backup, settings: [{ key: 'nope', value: 'x' }] })).toThrow('valid LeetCode Tracker backup');
  });
});
