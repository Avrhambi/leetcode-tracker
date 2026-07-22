import { describe, expect, it } from 'vitest';
import { validateBackupPayload } from './backup';

const backup = { formatVersion: 1, exportedAt: '2026-07-19T00:00:00.000Z', progress: [], attempts: [], recommendationEvents: [], settings: [{ key: 'catalogVersion', value: '1' }] };

describe('validateBackupPayload', () => {
  it('accepts a complete version-one backup', () => expect(validateBackupPayload(backup)).toEqual(backup));
  it('rejects invalid nested user data before restore', () => expect(() => validateBackupPayload({ ...backup, attempts: [{ id: 'a' }] })).toThrow('valid LeetCode Tracker backup'));
  it('rejects an unsupported format', () => expect(() => validateBackupPayload({ ...backup, formatVersion: 2 })).toThrow('valid LeetCode Tracker backup'));
});
