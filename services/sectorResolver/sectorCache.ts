import { CachedSector, SectorCache } from './types';

const STORAGE_KEY = 'desk:sectorCache';

export const loadCache = (): SectorCache => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as SectorCache;
  } catch {
    return {};
  }
};

export const saveCache = (cache: SectorCache): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded — drop the write. The cache is best-effort.
  }
};

export const clearCache = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const mergeIntoCache = (
  existing: SectorCache,
  entries: Array<{ symbol: string; sector: string; confidence?: 'HIGH' | 'MEDIUM' | 'LOW'; reasoning?: string }>
): SectorCache => {
  const next: SectorCache = { ...existing };
  const now = new Date().toISOString();
  for (const e of entries) {
    const cleanSym = e.symbol.toUpperCase().replace(/\..*$/, '');
    const entry: CachedSector = {
      sector: e.sector,
      source: 'ai',
      classifiedAt: now,
    };
    if (e.confidence !== undefined) entry.confidence = e.confidence;
    if (e.reasoning !== undefined) entry.reasoning = e.reasoning;
    next[cleanSym] = entry;
  }
  return next;
};
