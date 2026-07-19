import { useEffect, useState } from 'react';
import type { CatalogProblem, Difficulty, ProgressStatus } from '../types/models';

interface CatalogListProps { problems: CatalogProblem[]; progressByProblem: Map<string, ProgressStatus>; onSelect: (problem: CatalogProblem) => void; }

const statuses: { value: ProgressStatus | 'all'; label: string }[] = [{ value: 'all', label: 'All statuses' }, { value: 'not_started', label: 'Not started' }, { value: 'attempted', label: 'Attempted' }, { value: 'solved', label: 'Solved' }, { value: 'mastered', label: 'Mastered' }];

export function CatalogList({ problems, progressByProblem, onSelect }: CatalogListProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [status, setStatus] = useState<ProgressStatus | 'all'>('all');
  useEffect(() => { const timeout = window.setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 200); return () => window.clearTimeout(timeout); }, [searchInput]);
  const topics = [...new Set(problems.map((problem) => problem.primaryTopic))];
  const filtered = problems.filter((problem) => {
    const problemStatus = progressByProblem.get(problem.id) ?? 'not_started';
    return (search === '' || `${problem.title} ${problem.topics.join(' ')}`.toLowerCase().includes(search)) && (topic === 'all' || problem.primaryTopic === topic) && (difficulty === 'all' || problem.difficulty === difficulty) && (status === 'all' || problemStatus === status);
  });
  return <section aria-labelledby="problems-heading"><div className="section-heading"><div><p className="eyebrow">Catalog</p><h2 id="problems-heading">Problems</h2></div><p>{filtered.length} of {problems.length}</p></div><div className="filters"><label>Search<input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search problems" /></label><label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty | 'all')}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as ProgressStatus | 'all')}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>{filtered.length === 0 ? <p className="empty-state">No matching problems.</p> : <ol className="catalog-list">
    {filtered.map((problem) => <li key={problem.id} className="catalog-row">
      <span className="order">{problem.neetcodeOrder}</span>
      <div><button className="problem-link" type="button" onClick={() => onSelect(problem)}><h3>{problem.title}</h3></button><p>{problem.primaryTopic} · {problem.topics.join(', ')}</p></div>
      <div className="problem-meta"><span className={`difficulty ${problem.difficulty}`}>{problem.difficulty}</span><span>{(progressByProblem.get(problem.id) ?? 'not_started').replaceAll('_', ' ')}</span></div>
    </li>)}</ol>}</section>;
}
