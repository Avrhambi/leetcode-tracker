import { useEffect, useState } from 'react';
import type { CatalogProblem, ProgressStatus } from '../types/models';
import { ProblemDetail } from './ProblemDetail';

interface TopicPanelProps {
  topic: string;
  problems: CatalogProblem[];
  progressByProblem: Map<string, ProgressStatus>;
  onClose: () => void;
}

// The side panel opened from a topic node. Shows that topic's problems; clicking
// one swaps the panel to the full problem detail (attempt form + history) with a
// back arrow. The topic map stays visible alongside.
export function TopicPanel({ topic, problems, progressByProblem, onClose }: TopicPanelProps) {
  const [selectedProblem, setSelectedProblem] = useState<CatalogProblem | null>(null);

  // Reset to the list whenever the selected topic changes.
  useEffect(() => setSelectedProblem(null), [topic]);

  const topicProblems = problems
    .filter((problem) => problem.primaryTopic === topic)
    .sort((a, b) => a.neetcodeOrder - b.neetcodeOrder);
  const attempted = topicProblems.filter((problem) => (progressByProblem.get(problem.id) ?? 'not_started') !== 'not_started').length;

  return <aside className="topic-panel" aria-label={`${topic} problems`}>
    {selectedProblem
      ? <div className="topic-panel-detail">
          <ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} />
        </div>
      : <>
          <div className="topic-panel-head">
            <div>
              <p className="eyebrow">{topic}</p>
              <p className="topic-panel-count">{attempted} / {topicProblems.length} attempted</p>
            </div>
            <button type="button" className="topic-panel-close" onClick={onClose} aria-label="Close topic panel">Close</button>
          </div>
          <ol className="catalog-list">
            {topicProblems.map((problem) => {
              const status = progressByProblem.get(problem.id) ?? 'not_started';
              return <li key={problem.id} className="catalog-row">
                <span className="order">{problem.neetcodeOrder}</span>
                <div>
                  <button className="problem-link" type="button" onClick={() => setSelectedProblem(problem)}><h3>{problem.title}</h3></button>
                  <p>{problem.topics.join(', ')}</p>
                </div>
                <div className="problem-meta">
                  <span className={`badge badge-difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
                  <span className={`badge badge-status status-${status}`}>{status.replaceAll('_', ' ')}</span>
                </div>
              </li>;
            })}
          </ol>
        </>}
  </aside>;
}
