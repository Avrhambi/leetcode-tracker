import { db } from './database';
import type { AppSetting, Attempt, BackupPayload, ProblemProgress, RecommendationEvent } from '../types/models';

const outcomes = ['solved_independently', 'solved_with_hint', 'watched_solution', 'could_not_solve'];
const perceivedDifficulties = ['easy', 'manageable', 'hard'];
const helpTypes = ['small_hint', 'pattern_identification', 'pseudocode', 'full_code', 'solution_video'];
const qualities = ['strong', 'partial', 'weak'];
const statuses = ['not_started', 'attempted', 'solved', 'mastered'];
const eventKinds = ['new', 'review'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string { return typeof value === 'string'; }
function isNullableString(value: unknown): value is string | null { return value === null || isString(value); }
function isOneOf(value: unknown, options: string[]): boolean { return isString(value) && options.includes(value); }
function isInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value); }

function isProgress(value: unknown): value is ProblemProgress {
  return isRecord(value) && isString(value.problemId) && isOneOf(value.status, statuses) && isInteger(value.reviewStage) && value.reviewStage >= 0 && value.reviewStage <= 5 && isNullableString(value.nextReviewDate) && isNullableString(value.lastAttemptDate) && (value.lastQuality === null || isOneOf(value.lastQuality, qualities)) && isInteger(value.strongAttemptCount) && value.strongAttemptCount >= 0 && isString(value.updatedAt);
}

function isAttempt(value: unknown): value is Attempt {
  return isRecord(value) && isString(value.id) && isString(value.problemId) && isString(value.attemptedOn) && isOneOf(value.outcome, outcomes) && isOneOf(value.perceivedDifficulty, perceivedDifficulties) && (value.helpType === null || isOneOf(value.helpType, helpTypes)) && (value.durationMinutes === null || (isInteger(value.durationMinutes) && value.durationMinutes >= 1 && value.durationMinutes <= 600)) && isString(value.notes) && isOneOf(value.quality, qualities) && isString(value.createdAt);
}

function isRecommendationEvent(value: unknown): value is RecommendationEvent {
  return isRecord(value) && isString(value.id) && isString(value.problemId) && isOneOf(value.kind, eventKinds) && isString(value.recommendedAt) && isNullableString(value.skippedUntil);
}

function isSetting(value: unknown): value is AppSetting {
  return isRecord(value) && value.key === 'catalogVersion' && isString(value.value);
}

export function validateBackupPayload(value: unknown): BackupPayload {
  if (!isRecord(value) || value.formatVersion !== 1 || !isString(value.exportedAt) || !Array.isArray(value.progress) || !Array.isArray(value.attempts) || !Array.isArray(value.recommendationEvents) || !Array.isArray(value.settings) || !value.progress.every(isProgress) || !value.attempts.every(isAttempt) || !value.recommendationEvents.every(isRecommendationEvent) || !value.settings.every(isSetting)) {
    throw new Error('This file is not a valid Pattern Pilot backup.');
  }
  return value as unknown as BackupPayload;
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [progress, attempts, recommendationEvents, settings] = await Promise.all([
    db.progress.toArray(), db.attempts.toArray(), db.recommendationEvents.toArray(), db.settings.toArray()
  ]);
  return { formatVersion: 1, exportedAt: new Date().toISOString(), progress, attempts, recommendationEvents, settings };
}

export async function restoreBackup(file: File): Promise<void> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Backup files must be 5 MB or smaller.');
  const payload = validateBackupPayload(JSON.parse(await file.text()));
  await db.transaction('rw', db.progress, db.attempts, db.recommendationEvents, db.settings, async () => {
    await Promise.all([db.progress.clear(), db.attempts.clear(), db.recommendationEvents.clear(), db.settings.clear()]);
    await Promise.all([
      db.progress.bulkPut(payload.progress),
      db.attempts.bulkPut(payload.attempts),
      db.recommendationEvents.bulkPut(payload.recommendationEvents),
      db.settings.bulkPut(payload.settings)
    ]);
  });
}

export async function resetAndReseed(): Promise<void> {
  const { catalog, CATALOG_VERSION } = await import('../data/catalog');
  await db.transaction('rw', db.problems, db.progress, db.attempts, db.recommendationEvents, db.settings, async () => {
    await Promise.all([db.problems.clear(), db.progress.clear(), db.attempts.clear(), db.recommendationEvents.clear(), db.settings.clear()]);
    await db.problems.bulkPut(catalog);
    await db.settings.put({ key: 'catalogVersion', value: CATALOG_VERSION });
  });
}
