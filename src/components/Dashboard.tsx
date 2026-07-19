import type { Attempt, CatalogProblem, ProblemProgress } from '../types/models';

interface DashboardProps {
  attempts: Attempt[];
  problems: CatalogProblem[];
  progress: ProblemProgress[];
}

function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentStreak(attempts: Attempt[]): number {
  const dates = new Set(attempts.map((attempt) => attempt.attemptedOn));
  const cursor = new Date();
  let streak = 0;
  while (dates.has(localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function Dashboard({ attempts, problems, progress }: DashboardProps) {
  const today = localDate();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weekStart = localDate(sevenDaysAgo);
  const progressById = new Map(progress.map((item) => [item.problemId, item]));
  const topics = [...new Set(problems.map((problem) => problem.primaryTopic))];
  const dueReviews = progress.filter((item) => item.nextReviewDate !== null && item.nextReviewDate <= today).length;

  return <section className="dashboard" aria-labelledby="dashboard-heading">
    <div className="section-heading"><div><p className="eyebrow">Overview</p><h2 id="dashboard-heading">Dashboard</h2></div></div>
    <div className="metric-grid">
      <article><strong>{currentStreak(attempts)}</strong><span>Current streak</span></article>
      <article><strong>{attempts.filter((attempt) => attempt.attemptedOn >= weekStart && attempt.attemptedOn <= today).length}</strong><span>Attempts in 7 days</span></article>
      <article><strong>{dueReviews}</strong><span>Due reviews</span></article>
    </div>
    <section className="topic-progress" aria-labelledby="topic-progress-heading">
      <h2 id="topic-progress-heading">Topic progress</h2>
      <div className="topic-table" role="table" aria-label="Topic progress">
        <div className="topic-row topic-header" role="row"><span role="columnheader">Topic</span><span role="columnheader">Attempted</span><span role="columnheader">Strong attempts</span><span role="columnheader">Mastered</span></div>
        {topics.map((topic) => {
          const topicProgress = problems.filter((problem) => problem.primaryTopic === topic).map((problem) => progressById.get(problem.id)).filter((item): item is ProblemProgress => item !== undefined);
          return <div className="topic-row" role="row" key={topic}><span role="cell">{topic}</span><span role="cell">{topicProgress.length}</span><span role="cell">{topicProgress.reduce((count, item) => count + item.strongAttemptCount, 0)}</span><span role="cell">{topicProgress.filter((item) => item.status === 'mastered').length}</span></div>;
        })}
      </div>
    </section>
  </section>;
}
