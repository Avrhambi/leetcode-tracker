import { useState, type FormEvent } from 'react';
import { localDate } from '../services/reviews';
import { saveAttempt } from '../db/saveAttempt';
import type { HelpType, Outcome, PerceivedDifficulty } from '../types/models';

const outcomes: { value: Outcome; label: string }[] = [{ value: 'solved_independently', label: 'Solved independently' }, { value: 'solved_with_hint', label: 'Solved with a hint' }, { value: 'watched_solution', label: 'Watched solution' }, { value: 'could_not_solve', label: 'Could not solve' }];
const helpTypes: { value: HelpType; label: string }[] = [{ value: 'small_hint', label: 'Small hint' }, { value: 'pattern_identification', label: 'Pattern identification' }, { value: 'pseudocode', label: 'Pseudocode' }, { value: 'full_code', label: 'Full code' }, { value: 'solution_video', label: 'Solution video' }];

export function AttemptForm({ problemId, onSaved }: { problemId: string; onSaved: () => void }) {
  const [attemptedOn, setAttemptedOn] = useState(localDate()); const [outcome, setOutcome] = useState<Outcome>('solved_independently'); const [difficulty, setDifficulty] = useState<PerceivedDifficulty>('manageable'); const [helpType, setHelpType] = useState<HelpType | ''>(''); const [duration, setDuration] = useState(''); const [notes, setNotes] = useState(''); const [error, setError] = useState('');
  const requiresHelp = outcome === 'solved_with_hint' || outcome === 'watched_solution';
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); const durationMinutes = duration === '' ? null : Number(duration);
    if (!attemptedOn || (requiresHelp && !helpType) || !Number.isInteger(durationMinutes ?? 1) || (durationMinutes !== null && (durationMinutes < 1 || durationMinutes > 600))) { setError('Please complete all required fields with a duration from 1 to 600 minutes.'); return; }
    try { await saveAttempt({ problemId, attemptedOn, outcome, perceivedDifficulty: difficulty, helpType: requiresHelp ? helpType as HelpType : null, durationMinutes, notes: notes.trim() }); onSaved(); } catch { setError('The attempt could not be saved. Retry.'); }
  }
  return <form className="attempt-form" onSubmit={submit}><h2>Record attempt</h2>{error && <p role="alert">{error}</p>}<label>Date <input type="date" value={attemptedOn} onChange={(event) => setAttemptedOn(event.target.value)} required /></label><label>Outcome <select value={outcome} onChange={(event) => { setOutcome(event.target.value as Outcome); setHelpType(''); }}>{outcomes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Perceived difficulty <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as PerceivedDifficulty)}><option value="easy">Easy</option><option value="manageable">Manageable</option><option value="hard">Hard</option></select></label>{requiresHelp && <label>Help type <select value={helpType} onChange={(event) => setHelpType(event.target.value as HelpType)} required><option value="">Select help received</option>{helpTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}<label>Duration (minutes, optional) <input type="number" min="1" max="600" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label><label>Notes (optional) <textarea maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button type="submit">Save attempt</button></form>;
}
