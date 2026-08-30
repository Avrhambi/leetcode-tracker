import type { TopicTier } from '../data/topicTiers';

// Geometry for the topic map's quest path.
//
// The map is an SVG with a fixed viewBox, so every position here is in viewBox
// units and the whole thing scales to whatever box the map region gets. That is
// what makes the map overflow-proof by construction — no column count, no band
// heights, no way for a node to be crushed or to push the page into a scroll.
//
// Placement is a deterministic function of a topic's index, never random: the
// user likes the curriculum ordering, so the path must walk the topics in that
// exact order and land the same way on every render.

// A wide viewBox, because the map region is wide and short. A square one gets
// letterboxed by `preserveAspectRatio` and wastes the horizontal space.
export const VIEW_W = 200;
export const VIEW_H = 100;

export interface PathNode {
  topic: string;
  tier: TopicTier;
  index: number;
  x: number;
  y: number;
  /** First node of a new tier — the path draws a gate marker before it. */
  tierStart: boolean;
  /**
   * Which side of the node its label sits on. Topic names are far wider than the
   * gap between nodes, so neighbours alternate above/below and never share a
   * baseline — the one thing that made the first draft unreadable.
   */
  labelBelow: boolean;
  /**
   * Horizontal text anchor for the label. A centred label on a node sitting at
   * the very edge of the viewBox spills past it and gets clipped, so the nodes
   * at the ends of each leg anchor their text inward ('start' at the left edge,
   * 'end' at the right) instead of 'middle'.
   */
  anchor: 'start' | 'middle' | 'end';
  /** Small inward x-nudge for the label so an edge-anchored name clears the node's ring. */
  labelDx: number;
}

// The trail snakes left-to-right, then right-to-left, one row per leg, so a long
// curriculum stays legible in a wide, short box. Nodes ride a sine wave across
// each leg so the path reads as a hand-drawn route rather than a row of dots —
// this is the whole point of leaving the grid behind.
const LEGS = 3;
const AMPLITUDE = 4.5;
const MARGIN_X = 12;
// Labels alternate above and below their node, and the wave can push a node a
// full AMPLITUDE past its leg's centre line — so both edges need clearance for
// a node at the extreme of the wave plus its label.
const MARGIN_TOP = 12 + AMPLITUDE;
const MARGIN_BOTTOM = 12 + AMPLITUDE;

export function layoutPath(topics: { topic: string; tier: TopicTier }[]): PathNode[] {
  const count = topics.length;
  if (count === 0) return [];

  const perLeg = Math.ceil(count / LEGS);
  const legHeight = (VIEW_H - MARGIN_TOP - MARGIN_BOTTOM) / Math.max(1, LEGS - 1);

  return topics.map((entry, index) => {
    const leg = Math.floor(index / perLeg);
    const withinLeg = index % perLeg;
    // How many nodes this leg actually holds (the last leg may be short).
    const legCount = Math.min(perLeg, count - leg * perLeg);
    const span = VIEW_W - MARGIN_X * 2;
    // A single-node leg sits at the start of its direction rather than dividing
    // by zero.
    const t = legCount === 1 ? 0 : withinLeg / (legCount - 1);
    // Serpentine: odd legs run right-to-left, so the trail is continuous.
    const forward = leg % 2 === 0;
    const x = MARGIN_X + (forward ? t : 1 - t) * span;
    const y = MARGIN_TOP + leg * legHeight + Math.sin(t * Math.PI * 2) * AMPLITUDE;

    // A label centred on an edge node overflows the viewBox; anchor it inward.
    // EDGE_BAND is how close to a margin counts as "at the edge".
    const EDGE_BAND = span * 0.12;
    const anchor: PathNode['anchor'] = x <= MARGIN_X + EDGE_BAND ? 'start' : x >= VIEW_W - MARGIN_X - EDGE_BAND ? 'end' : 'middle';
    const labelDx = anchor === 'start' ? 1.5 : anchor === 'end' ? -1.5 : 0;

    return {
      topic: entry.topic,
      tier: entry.tier,
      index,
      x,
      y,
      tierStart: index > 0 && entry.tier !== topics[index - 1].tier,
      labelBelow: withinLeg % 2 === 0,
      anchor,
      labelDx
    };
  });
}

// A smooth track through the nodes: a Catmull-Rom spline converted to cubic
// Béziers, so the trail curves through every node instead of elbowing between
// them. Returns one `d` string for the whole path.
export function trackPath(nodes: PathNode[]): string {
  if (nodes.length < 2) return '';

  const point = (i: number) => nodes[Math.max(0, Math.min(nodes.length - 1, i))];
  let d = `M ${point(0).x.toFixed(2)} ${point(0).y.toFixed(2)}`;

  for (let i = 0; i < nodes.length - 1; i++) {
    const p0 = point(i - 1);
    const p1 = point(i);
    const p2 = point(i + 1);
    const p3 = point(i + 2);
    // Catmull-Rom → cubic Bézier control points (tension 1/6).
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}
