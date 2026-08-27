import { strugglingProblems } from '../services/mastery';
import type { CatalogProblem, ProblemProgress } from '../types/models';

interface NeedsAttentionProps {
  problems: CatalogProblem[];
  progress: ProblemProgress[];
  onSelect: (problem: CatalogProblem) => void;
}

// The problems currently flagged `struggling`, weakest run first. Most profiles
// have none, so the all-clear state is the common one.
export function NeedsAttention({ problems, progress, onSelect }: NeedsAttentionProps) {
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const rows = strugglingProblems(progress)
    .map((row) => ({ problem: problemById.get(row.problemId), consecutiveWeak: row.consecutiveWeak }))
    .filter((row): row is { problem: CatalogProblem; consecutiveWeak: number } => row.problem !== undefined);

  return <section className="needs-attention" aria-labelledby="needs-attention-heading">
    <p className="eyebrow" id="needs-attention-heading">Needs a different approach</p>
    {rows.length === 0
      ? <p className="all-clear">Nothing stuck right now — every problem is on its normal review ladder.</p>
      : <ul>
          {rows.map(({ problem, consecutiveWeak }) => <li key={problem.id}>
            <button type="button" className="problem-link" onClick={() => onSelect(problem)}>{problem.title}</button>
            <span className="weak-run">{consecutiveWeak} weak in a row</span>
          </li>)}
        </ul>}
  </section>;
}
