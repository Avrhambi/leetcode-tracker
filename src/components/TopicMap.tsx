import type { TopicMasteryCell } from '../services/mastery';
import { TIER_LABELS, topicTier, type TopicTier } from '../data/topicTiers';

interface TopicMapProps {
  cells: TopicMasteryCell[];
  strugglingTopics: Set<string>;
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}

// The centrepiece: every topic as a node, grouped into three labelled bands —
// Foundations / Intermediate / Advanced — from the curriculum tiers. Node size
// and fill track that topic's mastery; a struggling topic gets a warning ring.
// Deliberately banded, not a dependency DAG. Nodes are buttons: click opens the
// topic's problems in the side panel.
//
// Each band is a CSS grid of fixed-size cells; the dot is a small self-contained
// SVG and the label is plain HTML, so wrapping is width-driven with no viewBox
// scaling and labels stay legible at every width.
const NODE_BOX = 44; // px viewBox for one node's dot

function Node({ cell, struggling, selected, onSelect }: {
  cell: TopicMasteryCell;
  struggling: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const c = NODE_BOX / 2;
  const r = 5 + cell.mastery * 11;
  const filled = cell.mastery >= 0.5;
  const pct = Math.round(cell.mastery * 100);
  const classes = ['topic-node', filled ? 'filled' : '', struggling ? 'struggling' : '', selected ? 'selected' : '']
    .filter(Boolean).join(' ');

  return <div
    className={classes}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    aria-label={`${cell.topic}: ${pct}% mastery, ${cell.attempted} of ${cell.total} attempted${struggling ? ', needs a different approach' : ''}`}
    onClick={onSelect}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
      }
    }}
  >
    <svg className="topic-node-dot-svg" viewBox={`0 0 ${NODE_BOX} ${NODE_BOX}`} aria-hidden="true">
      {selected && <circle className="topic-node-ring" cx={c} cy={c} r={r + 6} />}
      {struggling && <circle className="topic-node-warn" cx={c} cy={c} r={r + 3} />}
      <circle className="topic-node-dot" cx={c} cy={c} r={r} />
    </svg>
    <span className="topic-node-label">{cell.topic}</span>
  </div>;
}

function Band({ tier, cells, strugglingTopics, selectedTopic, onSelectTopic }: {
  tier: TopicTier;
  cells: TopicMasteryCell[];
  strugglingTopics: Set<string>;
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}) {
  if (cells.length === 0) return null;

  return <div className="tier-band">
    <p className="tier-band-label eyebrow">{TIER_LABELS[tier]}</p>
    <div className="tier-band-nodes" role="group" aria-label={`${TIER_LABELS[tier]} topics`}>
      {cells.map((cell) => (
        <Node
          key={cell.topic}
          cell={cell}
          struggling={strugglingTopics.has(cell.topic)}
          selected={cell.topic === selectedTopic}
          onSelect={() => onSelectTopic(cell.topic)}
        />
      ))}
    </div>
  </div>;
}

export function TopicMap({ cells, strugglingTopics, selectedTopic, onSelectTopic }: TopicMapProps) {
  if (cells.length === 0) return null;

  // Group by tier, keeping catalog topic order within each band.
  const byTier: Record<TopicTier, TopicMasteryCell[]> = { 1: [], 2: [], 3: [] };
  for (const cell of cells) byTier[topicTier(cell.topic)].push(cell);

  return <section className="topic-map" aria-labelledby="topic-map-heading">
    <p className="eyebrow" id="topic-map-heading">Topic map</p>
    <p className="topic-map-hint">Bigger, brighter nodes are more mastered. Pick a topic to see its problems.</p>
    {([1, 2, 3] as TopicTier[]).map((tier) => (
      <Band
        key={tier}
        tier={tier}
        cells={byTier[tier]}
        strugglingTopics={strugglingTopics}
        selectedTopic={selectedTopic}
        onSelectTopic={onSelectTopic}
      />
    ))}
  </section>;
}
