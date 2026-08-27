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
const CELL_W = 116;
const ROW_H = 92;
const PAD_X = 12;
const PAD_TOP = 8;

function labelLines(topic: string): string[] {
  const words = topic.split(' ');
  if (words.length < 3) return [topic];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

function Band({ tier, cells, strugglingTopics, selectedTopic, onSelectTopic }: {
  tier: TopicTier;
  cells: TopicMasteryCell[];
  strugglingTopics: Set<string>;
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
}) {
  if (cells.length === 0) return null;
  const width = cells.length * CELL_W + PAD_X * 2;
  const height = ROW_H + PAD_TOP;

  return <div className="tier-band">
    <p className="tier-band-label eyebrow">{TIER_LABELS[tier]}</p>
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${TIER_LABELS[tier]} topics`}>
      {cells.map((cell, index) => {
        const cx = PAD_X + index * CELL_W + CELL_W / 2;
        const cy = PAD_TOP + 26;
        const r = 5 + cell.mastery * 11;
        const filled = cell.mastery >= 0.5;
        const struggling = strugglingTopics.has(cell.topic);
        const selected = cell.topic === selectedTopic;
        const classes = ['topic-node', filled ? 'filled' : '', struggling ? 'struggling' : '', selected ? 'selected' : ''].filter(Boolean).join(' ');
        const pct = Math.round(cell.mastery * 100);
        return <g
          key={cell.topic}
          className={classes}
          role="button"
          tabIndex={0}
          aria-pressed={selected}
          aria-label={`${cell.topic}: ${pct}% mastery, ${cell.attempted} of ${cell.total} attempted${struggling ? ', needs a different approach' : ''}`}
          onClick={() => onSelectTopic(cell.topic)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectTopic(cell.topic);
            }
          }}
        >
          {selected && <circle className="topic-node-ring" cx={cx} cy={cy} r={r + 6} />}
          {struggling && <circle className="topic-node-warn" cx={cx} cy={cy} r={r + 3} />}
          <circle className="topic-node-dot" cx={cx} cy={cy} r={r} />
          <text className="topic-node-label" x={cx} y={cy + 30} textAnchor="middle">
            {labelLines(cell.topic).map((line, lineIndex) => (
              <tspan key={line} x={cx} dy={lineIndex === 0 ? 0 : 11}>{line}</tspan>
            ))}
          </text>
        </g>;
      })}
    </svg>
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
