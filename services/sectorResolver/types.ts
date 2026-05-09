/**
 * Where a sector classification came from. Used for audit/debug, not for
 * resolution priority (which is fixed: csv > static > ai-cache > pending).
 */
export type SectorSource = 'csv' | 'static' | 'ai';

export interface CachedSector {
  sector: string;
  source: 'ai';
  classifiedAt: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string;
}

/** Symbol → cached AI classification. Only AI-derived entries live here. */
export type SectorCache = Record<string, CachedSector>;
