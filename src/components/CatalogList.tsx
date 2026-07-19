import type { CatalogProblem } from '../types/models';

interface CatalogListProps { problems: CatalogProblem[]; }

export function CatalogList({ problems }: CatalogListProps) {
  return <ol className="catalog-list">
    {problems.map((problem) => <li key={problem.id} className="catalog-row">
      <span className="order">{problem.neetcodeOrder}</span>
      <div><h2>{problem.title}</h2><p>{problem.primaryTopic} · {problem.topics.join(', ')}</p></div>
      <span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span>
    </li>)}
  </ol>;
}
