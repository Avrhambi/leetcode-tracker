import { qualityFor, progressAfterAttempt } from '../services/reviews';
import { openRecommendationsToComplete } from '../services/recommendations';
import { badgesEarned } from '../services/badges';
import { currentStreak, type StreakGraceState } from '../services/streak';
import { STREAK_GRACE_PER_WEEK } from '../services/constants';
import { awardAttemptXp, recordBadges } from './gamification';
import type { Attempt, HelpType, Outcome, PerceivedDifficulty } from '../types/models';
import { db } from './database';

function graceStateFrom(settings: { key: string; value: string }[]): StreakGraceState {
  const byKey = new Map(settings.map((row) => [row.key, row.value]));
  const remaining = Number(byKey.get('streakGraceRemaining'));
  return {
    graceRemaining: Number.isFinite(remaining) ? remaining : STREAK_GRACE_PER_WEEK,
    graceRefreshedOn: byKey.get('streakGraceRefreshedOn') ?? ''
  };
}

export interface AttemptInput { problemId: string; attemptedOn: string; outcome: Outcome; perceivedDifficulty: PerceivedDifficulty; helpType: HelpType | null; durationMinutes: number | null; notes: string; }

export async function saveAttempt(input: AttemptInput): Promise<void> {
  const createdAt = new Date().toISOString();
  const now = new Date();
  const attempt: Attempt = { id: crypto.randomUUID(), ...input, quality: qualityFor(input.outcome, input.perceivedDifficulty), createdAt };
  await db.transaction('rw', [db.attempts, db.progress, db.recommendationEvents, db.gamification, db.problems, db.settings], async () => {
    const existing = await db.progress.get(input.problemId);
    // A prior attempt for this problem on the same calendar day means the review
    // stage was already advanced today; a second pass is reinforcement only.
    const alreadyAttemptedToday = (await db.attempts.where('problemId').equals(input.problemId).and((row) => row.attemptedOn === input.attemptedOn).count()) > 0;
    await db.attempts.add(attempt);
    await db.progress.put({ ...progressAfterAttempt(existing, attempt.quality, input.attemptedOn, createdAt, alreadyAttemptedToday), problemId: input.problemId });

    // Award XP in the same transaction so it is atomic with the attempt write.
    // `isFirstOfDay` is the negation of the same-day guard above, so the v3
    // replay (which recomputes it from attempt rows) lands on the same total.
    await awardAttemptXp(attempt.quality, !alreadyAttemptedToday, now);

    // Badge check runs after the progress write so predicates see fresh state.
    // The catalog and settings feed topic-completeness and the streak length;
    // recordBadges unions into the stored set, so this only ever adds.
    const [progress, attempts, problems, settings] = await Promise.all([
      db.progress.toArray(), db.attempts.toArray(), db.problems.toArray(), db.settings.toArray()
    ]);
    const { streak } = currentStreak(new Set(attempts.map((row) => row.attemptedOn)), graceStateFrom(settings), now);
    await recordBadges(badgesEarned({ progress, attempts, problems, currentStreakDays: streak }), now);
    // Recording an attempt from either entry point (daily plan or catalog)
    // completes any matching open daily recommendation for this problem today.
    const openEvents = await db.recommendationEvents.where('problemId').equals(input.problemId).toArray();
    for (const event of openRecommendationsToComplete(openEvents, input.problemId, now)) {
      await db.recommendationEvents.update(event.id, { completedAt: now.toISOString() });
    }
  });
}
