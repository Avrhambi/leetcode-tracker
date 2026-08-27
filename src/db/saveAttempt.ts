import { qualityFor, progressAfterAttempt } from '../services/reviews';
import { openRecommendationsToComplete } from '../services/recommendations';
import type { Attempt, HelpType, Outcome, PerceivedDifficulty } from '../types/models';
import { db } from './database';

export interface AttemptInput { problemId: string; attemptedOn: string; outcome: Outcome; perceivedDifficulty: PerceivedDifficulty; helpType: HelpType | null; durationMinutes: number | null; notes: string; }

export async function saveAttempt(input: AttemptInput): Promise<void> {
  const createdAt = new Date().toISOString();
  const now = new Date();
  const attempt: Attempt = { id: crypto.randomUUID(), ...input, quality: qualityFor(input.outcome, input.perceivedDifficulty), createdAt };
  await db.transaction('rw', db.attempts, db.progress, db.recommendationEvents, async () => {
    const existing = await db.progress.get(input.problemId);
    // A prior attempt for this problem on the same calendar day means the review
    // stage was already advanced today; a second pass is reinforcement only.
    const alreadyAttemptedToday = (await db.attempts.where('problemId').equals(input.problemId).and((row) => row.attemptedOn === input.attemptedOn).count()) > 0;
    await db.attempts.add(attempt);
    await db.progress.put({ ...progressAfterAttempt(existing, attempt.quality, input.attemptedOn, createdAt, alreadyAttemptedToday), problemId: input.problemId });
    // Recording an attempt from either entry point (daily plan or catalog)
    // completes any matching open daily recommendation for this problem today.
    const openEvents = await db.recommendationEvents.where('problemId').equals(input.problemId).toArray();
    for (const event of openRecommendationsToComplete(openEvents, input.problemId, now)) {
      await db.recommendationEvents.update(event.id, { completedAt: now.toISOString() });
    }
  });
}
