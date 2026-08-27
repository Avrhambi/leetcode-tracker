import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { CatalogProblem, HelpType } from '../types/models';
import { AttemptForm } from './AttemptForm';

const helpTypeLabels: Record<HelpType, string> = {
  small_hint: 'nudge',
  pattern_identification: 'pattern hint',
  pseudocode: 'pseudocode',
  full_code: 'full solution',
  solution_video: 'walkthrough video'
};

export function ProblemDetail({ problem, onBack }: { problem: CatalogProblem; onBack: () => void }) {
  const attempts = useLiveQuery(() => db.attempts.where('problemId').equals(problem.id).reverse().sortBy('createdAt'), [problem.id]);
  const progress = useLiveQuery(() => db.progress.get(problem.id), [problem.id]);
  const [message, setMessage] = useState('');
  function saved() { setMessage('Attempt saved.'); window.setTimeout(() => setMessage(''), 2000); }
  return <section className="problem-detail"><button type="button" onClick={onBack}>Back to catalog</button><p className="eyebrow">{problem.primaryTopic}</p><h1>{problem.title}</h1><p>{problem.difficulty} · {problem.topics.join(', ')}</p><p><a href={problem.leetcodeUrl} target="_blank" rel="noreferrer">Solve on LeetCode</a></p>{progress && <p>Next review: {progress.nextReviewDate ?? 'Mastered'}{progress.struggling && <span className="struggling-badge"> · Needs a different approach</span>}</p>}{message && <p role="status">{message}</p>}<AttemptForm problemId={problem.id} onSaved={saved} /><h2>Attempt history</h2>{!attempts ? <p>Loading attempts…</p> : attempts.length === 0 ? <p>No attempts yet.</p> : <ol className="attempt-list">{attempts.map((attempt) => <li key={attempt.id}><strong>{attempt.attemptedOn}</strong> · {attempt.outcome.replaceAll('_', ' ')} · {attempt.quality}{attempt.helpType && <> · looked up {helpTypeLabels[attempt.helpType]}</>}{attempt.durationMinutes !== null && <> · {attempt.durationMinutes} min</>}{attempt.notes && <p className="attempt-notes">{attempt.notes}</p>}</li>)}</ol>}</section>;
}
