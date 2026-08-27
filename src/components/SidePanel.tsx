import type { CatalogProblem, ProgressStatus } from '../types/models';
import { ProblemDetail } from './ProblemDetail';

// The panel opened beside the topic map. Three modes:
//  - topic:  the problems of one topic (from a map node)
//  - search: problems matching the workbench search box
//  - problem: one problem's full detail (attempt form + history), reached from
//    either list via a Back button. The map stays visible alongside throughout.
export type Panel =
  | { kind: 'topic'; topic: string }
  | { kind: 'search'; query: string }
  | { kind: 'problem'; problem: CatalogProblem; back: Panel };

interface SidePanelProps {
  panel: Panel;
  problems: CatalogProblem[];
  progressByProblem: Map<string, ProgressStatus>;
  onSelectProblem: (problem: CatalogProblem, back: Panel) => void;
  onBack: (target: Panel) => void;
  onClose: () => void;
}

function ProblemRow({ problem, status, showTopic, onSelect }: {
  problem: CatalogProblem;
  status: ProgressStatus;
  showTopic: boolean;
  onSelect: () => void;
}) {
  return <li className="catalog-row">
    <span className="order">{problem.neetcodeOrder}</span>
    <div>
      <button className="problem-link" type="button" onClick={onSelect}><h3>{problem.title}</h3></button>
      <p>{showTopic ? `${problem.primaryTopic} · ${problem.topics.join(', ')}` : problem.topics.join(', ')}</p>
    </div>
    <div className="problem-meta">
      <span className={`badge badge-difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
      <span className={`badge badge-status status-${status}`}>{status.replaceAll('_', ' ')}</span>
    </div>
  </li>;
}

export function SidePanel({ panel, problems, progressByProblem, onSelectProblem, onBack, onClose }: SidePanelProps) {
  if (panel.kind === 'problem') {
    return <aside className="topic-panel" aria-label={`${panel.problem.title} detail`}>
      <div className="topic-panel-detail">
        <ProblemDetail problem={panel.problem} onBack={() => onBack(panel.back)} />
      </div>
    </aside>;
  }

  const statusOf = (problem: CatalogProblem) => progressByProblem.get(problem.id) ?? 'not_started';

  if (panel.kind === 'search') {
    const query = panel.query.trim().toLowerCase();
    const matches = query === ''
      ? []
      : problems
          .filter((problem) => `${problem.title} ${problem.topics.join(' ')}`.toLowerCase().includes(query))
          .sort((a, b) => a.neetcodeOrder - b.neetcodeOrder);
    return <aside className="topic-panel" aria-label="Search results">
      <div className="topic-panel-head">
        <div>
          <p className="eyebrow">Search</p>
          <p className="topic-panel-count">{matches.length} of {problems.length}</p>
        </div>
        <button type="button" className="topic-panel-close" onClick={onClose} aria-label="Close search results">Close</button>
      </div>
      {matches.length === 0
        ? <p className="empty-state">No matching problems.</p>
        : <ol className="catalog-list">
            {matches.map((problem) => <ProblemRow
              key={problem.id}
              problem={problem}
              status={statusOf(problem)}
              showTopic
              onSelect={() => onSelectProblem(problem, panel)}
            />)}
          </ol>}
    </aside>;
  }

  const topicProblems = problems
    .filter((problem) => problem.primaryTopic === panel.topic)
    .sort((a, b) => a.neetcodeOrder - b.neetcodeOrder);
  const attempted = topicProblems.filter((problem) => statusOf(problem) !== 'not_started').length;

  return <aside className="topic-panel" aria-label={`${panel.topic} problems`}>
    <div className="topic-panel-head">
      <div>
        <p className="eyebrow">{panel.topic}</p>
        <p className="topic-panel-count">{attempted} / {topicProblems.length} attempted</p>
      </div>
      <button type="button" className="topic-panel-close" onClick={onClose} aria-label="Close topic panel">Close</button>
    </div>
    <ol className="catalog-list">
      {topicProblems.map((problem) => <ProblemRow
        key={problem.id}
        problem={problem}
        status={statusOf(problem)}
        showTopic={false}
        onSelect={() => onSelectProblem(problem, panel)}
      />)}
    </ol>
  </aside>;
}
