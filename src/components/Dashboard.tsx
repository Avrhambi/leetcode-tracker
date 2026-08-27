import { STREAK_GRACE_PER_WEEK } from '../services/constants';
import { currentStreak, type StreakGraceState } from '../services/streak';
import type { GamificationSnapshot } from '../services/gamification';
import { GamificationBar } from './GamificationBar';
import type { AppSetting, Attempt, CatalogProblem, ProblemProgress } from '../types/models';

interface DashboardProps {
  attempts: Attempt[];
  problems: CatalogProblem[];
  progress: ProblemProgress[];
  settings: AppSetting[];
  gamification: GamificationSnapshot | undefined;
}

function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Grace state lives in the `settings` rows, but nothing writes a spent-down
// balance (see services/streak.ts) and the refresh caps at STREAK_GRACE_PER_WEEK,
// which equals this default — so when the rows are absent (fresh install, reset,
// v1 restore) the allowance is simply the default and grace usage is re-derived
// from the active dates on every render.
function graceStateFrom(settings: AppSetting[]): StreakGraceState {
  const byKey = new Map(settings.map((row) => [row.key, row.value]));
  const remaining = Number(byKey.get('streakGraceRemaining'));
  return {
    graceRemaining: Number.isFinite(remaining) ? remaining : STREAK_GRACE_PER_WEEK,
    graceRefreshedOn: byKey.get('streakGraceRefreshedOn') ?? ''
  };
}

export function Dashboard({ attempts, problems, progress, settings, gamification }: DashboardProps) {
  const today = localDate();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weekStart = localDate(sevenDaysAgo);
  const progressById = new Map(progress.map((item) => [item.problemId, item]));
  const topics = [...new Set(problems.map((problem) => problem.primaryTopic))];
  const dueReviews = progress.filter((item) => item.nextReviewDate !== null && item.nextReviewDate <= today).length;

  const activeDates = new Set(attempts.map((attempt) => attempt.attemptedOn));
  const { streak, graceDaysUsed } = currentStreak(activeDates, graceStateFrom(settings));

  return <section className="dashboard" aria-labelledby="dashboard-heading">
    <div className="section-heading"><div><p className="eyebrow">Overview</p><h2 id="dashboard-heading">Dashboard</h2></div></div>
    {gamification && <GamificationBar snapshot={gamification} />}
    <div className="metric-grid">
      <article><strong>{streak}</strong><span>Current streak{graceDaysUsed > 0 && <> · <span className="grace-note">{graceDaysUsed} grace {graceDaysUsed === 1 ? 'day' : 'days'} used</span></>}</span></article>
      <article><strong>{attempts.filter((attempt) => attempt.attemptedOn >= weekStart && attempt.attemptedOn <= today).length}</strong><span>Attempts in 7 days</span></article>
      <article><strong>{dueReviews}</strong><span>Due reviews</span></article>
    </div>
    <section className="topic-progress" aria-labelledby="topic-progress-heading">
      <div className="topic-progress-heading">
        <div><p className="eyebrow">Practice map</p><h2 id="topic-progress-heading">Topic progress</h2></div>
        <p>Each bar shows problems attempted in that topic.</p>
      </div>
      <ul className="topic-grid" aria-label="Topic progress">
        {topics.map((topic) => {
          const topicProblems = problems.filter((problem) => problem.primaryTopic === topic);
          const topicProgress = topicProblems.map((problem) => progressById.get(problem.id)).filter((item): item is ProblemProgress => item !== undefined);
          const attempted = topicProgress.length;
          const strongAttempts = topicProgress.reduce((count, item) => count + item.strongAttemptCount, 0);
          const mastered = topicProgress.filter((item) => item.status === 'mastered').length;
          return <li className="topic-card" key={topic}>
            <div className="topic-card-topline"><h3>{topic}</h3><strong>{attempted}<span>/{topicProblems.length}</span></strong></div>
            <progress value={attempted} max={topicProblems.length} aria-label={`${topic}: ${attempted} of ${topicProblems.length} problems attempted`} />
            <div className="topic-stats">
              <span className="topic-stat topic-stat-strong"><i aria-hidden="true">◆</i><b>{strongAttempts}</b> strong</span>
              <span className="topic-stat topic-stat-mastered"><i aria-hidden="true">✓</i><b>{mastered}</b> mastered</span>
            </div>
          </li>;
        })}
      </ul>
    </section>
  </section>;
}
