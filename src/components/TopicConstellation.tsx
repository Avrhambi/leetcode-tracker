import type { TopicMasteryCell } from '../services/mastery';

interface TopicConstellationProps {
  cells: TopicMasteryCell[];
}

// A static star map of the 18 topics: nodes on a grid, joined left-to-right, each
// node's radius and fill set by that topic's mastery. No animation — it is a
// reference chart, not a flourish.
const COLS = 6;
const CELL_W = 100;
const CELL_H = 82;
const PAD = 18;

// Break a topic label into at most two lines so long names ("1-D Dynamic
// Programming") don't overrun their column.
function labelLines(topic: string): string[] {
  const words = topic.split(' ');
  if (words.length < 3) return [topic];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

export function TopicConstellation({ cells }: TopicConstellationProps) {
  if (cells.length === 0) return null;

  const rows = Math.ceil(cells.length / COLS);
  const width = COLS * CELL_W + PAD * 2;
  const height = rows * CELL_H + PAD * 2;

  const nodes = cells.map((cell, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    return {
      cell,
      x: PAD + col * CELL_W + CELL_W / 2,
      y: PAD + row * CELL_H + CELL_H / 2,
      r: 4 + cell.mastery * 9
    };
  });

  const edges = nodes.slice(1).map((node, index) => {
    const previous = nodes[index];
    // Only join within a row, so the map reads as strands rather than a zigzag.
    if (Math.floor(index / COLS) !== Math.floor((index + 1) / COLS)) return null;
    return <line key={`e${index}`} className="constellation-edge" x1={previous.x} y1={previous.y} x2={node.x} y2={node.y} />;
  });

  return <section className="constellation" aria-labelledby="constellation-heading">
    <p className="eyebrow" id="constellation-heading">Topic constellation</p>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Per-topic mastery: brighter, larger nodes are more mastered">
      {edges}
      {nodes.map((node) => <g key={node.cell.topic}>
        <circle
          className={`constellation-node${node.cell.mastery >= 0.5 ? ' filled' : ''}`}
          cx={node.x} cy={node.y} r={node.r}
        />
        <text className="constellation-label" x={node.x} y={node.y + CELL_H / 2 - 12} textAnchor="middle">
          {labelLines(node.cell.topic).map((line, lineIndex) => (
            <tspan key={line} x={node.x} dy={lineIndex === 0 ? 0 : 10}>{line}</tspan>
          ))}
        </text>
      </g>)}
    </svg>
  </section>;
}
