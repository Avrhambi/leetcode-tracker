import { describe, expect, it } from 'vitest';
import { layoutPath, trackPath, VIEW_H, VIEW_W } from './topicPath';
import type { TopicTier } from '../data/topicTiers';

const TOPICS: { topic: string; tier: TopicTier }[] = [
  { topic: 'Arrays & Hashing', tier: 1 },
  { topic: 'Two Pointers', tier: 1 },
  { topic: 'Sliding Window', tier: 1 },
  { topic: 'Stack', tier: 1 },
  { topic: 'Binary Search', tier: 1 },
  { topic: 'Linked List', tier: 1 },
  { topic: 'Trees', tier: 1 },
  { topic: 'Heap / Priority Queue', tier: 2 },
  { topic: 'Backtracking', tier: 2 },
  { topic: 'Graphs', tier: 2 },
  { topic: '1-D Dynamic Programming', tier: 2 },
  { topic: 'Greedy', tier: 2 },
  { topic: 'Intervals', tier: 2 },
  { topic: 'Tries', tier: 3 },
  { topic: 'Advanced Graphs', tier: 3 },
  { topic: '2-D Dynamic Programming', tier: 3 },
  { topic: 'Math & Geometry', tier: 3 },
  { topic: 'Bit Manipulation', tier: 3 }
];

describe('layoutPath', () => {
  it('keeps the given topic order', () => {
    expect(layoutPath(TOPICS).map((node) => node.topic)).toEqual(TOPICS.map((t) => t.topic));
  });

  it('is deterministic — the same input lays out identically', () => {
    expect(layoutPath(TOPICS)).toEqual(layoutPath(TOPICS));
  });

  it('keeps every node inside the viewBox with room for its label', () => {
    for (const node of layoutPath(TOPICS)) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(VIEW_W);
      // Labels sit above or below the node, so both edges need clearance.
      expect(node.y).toBeGreaterThanOrEqual(8);
      expect(node.y).toBeLessThanOrEqual(VIEW_H - 8);
    }
  });

  it('anchors edge-of-leg labels inward so wide topic names cannot clip the viewBox', () => {
    for (const node of layoutPath(TOPICS)) {
      if (node.x < VIEW_W * 0.15) expect(node.anchor).toBe('start');
      else if (node.x > VIEW_W * 0.85) expect(node.anchor).toBe('end');
      // start pushes the label right, end pushes it left, middle no nudge.
      if (node.anchor === 'start') expect(node.labelDx).toBeGreaterThan(0);
      if (node.anchor === 'end') expect(node.labelDx).toBeLessThan(0);
      if (node.anchor === 'middle') expect(node.labelDx).toBe(0);
    }
  });

  it('alternates the label side so neighbours never share a baseline', () => {
    const nodes = layoutPath(TOPICS);
    for (let i = 0; i < nodes.length - 1; i++) {
      // Only within a leg — a leg boundary may repeat a side, and those two
      // nodes are at opposite ends of the canvas anyway.
      const sameLeg = Math.abs(nodes[i + 1].x - nodes[i].x) < VIEW_W / 2;
      if (sameLeg) expect(nodes[i + 1].labelBelow).not.toBe(nodes[i].labelBelow);
    }
  });

  it('marks only the first node of each new tier as a gate', () => {
    const gates = layoutPath(TOPICS).filter((node) => node.tierStart);
    expect(gates.map((node) => node.topic)).toEqual(['Heap / Priority Queue', 'Tries']);
  });

  it('never marks the first node as a gate', () => {
    expect(layoutPath(TOPICS)[0].tierStart).toBe(false);
  });

  it('separates consecutive nodes so they cannot overlap', () => {
    const nodes = layoutPath(TOPICS);
    for (let i = 0; i < nodes.length - 1; i++) {
      const dx = nodes[i + 1].x - nodes[i].x;
      const dy = nodes[i + 1].y - nodes[i].y;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(12);
    }
  });

  it('handles the degenerate sizes', () => {
    expect(layoutPath([])).toEqual([]);
    const one = layoutPath([{ topic: 'Only', tier: 1 }]);
    expect(one).toHaveLength(1);
    expect(Number.isFinite(one[0].x)).toBe(true);
    expect(Number.isFinite(one[0].y)).toBe(true);
  });
});

describe('trackPath', () => {
  it('is empty below two nodes', () => {
    expect(trackPath([])).toBe('');
    expect(trackPath(layoutPath([{ topic: 'Only', tier: 1 }]))).toBe('');
  });

  it('starts at the first node and emits a curve per gap', () => {
    const nodes = layoutPath(TOPICS);
    const d = trackPath(nodes);
    expect(d.startsWith(`M ${nodes[0].x.toFixed(2)} ${nodes[0].y.toFixed(2)}`)).toBe(true);
    expect(d.match(/C /g)).toHaveLength(nodes.length - 1);
    expect(d).not.toMatch(/NaN|Infinity/);
  });
});
