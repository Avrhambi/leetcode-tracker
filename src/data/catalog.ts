import rawCatalog from './neetcode150.json';
import type { CatalogProblem, Difficulty } from '../types/models';

interface CatalogRow { title: string; slug: string; difficulty: Difficulty; topics: string[]; primaryTopic: string; }

const rows = rawCatalog as CatalogRow[];

export const catalog: CatalogProblem[] = rows.map((row, index) => ({
  ...row,
  id: row.slug,
  leetcodeUrl: `https://leetcode.com/problems/${row.slug}/`,
  neetcodeOrder: index + 1
}));

export const CATALOG_VERSION = 'neetcode-150-v3';
