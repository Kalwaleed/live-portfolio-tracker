import { z } from 'zod';

const findingTag = z.enum([
  'CONCENTRATION',
  'SECTOR',
  'CATALYST',
  'PERFORMANCE',
  'LIMIT',
  'LIQUIDITY',
]);

const actionVerb = z.enum(['BUY', 'SELL', 'TRIM', 'HEDGE', 'SET', 'WATCH']);

export const portfolioAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  summary: z.string(),
  findings: z.array(
    z.object({
      tag: findingTag,
      title: z.string(),
      detail: z.string(),
      symbols: z.array(z.string()).optional(),
    })
  ),
  actions: z.array(
    z.object({
      verb: actionVerb,
      symbol: z.string().optional(),
      detail: z.string(),
    })
  ),
  generatedAt: z.string().optional(),
});

export const marketNewsSchema = z.object({
  gainers: z.array(
    z.object({
      symbol: z.string(),
      change: z.string(),
      reason: z.string(),
    })
  ),
  losers: z.array(
    z.object({
      symbol: z.string(),
      change: z.string(),
      reason: z.string(),
    })
  ),
  sources: z.number().optional(),
  generatedAt: z.string().optional(),
});

const earningsStatus = z.enum(['BEAT', 'MISS', 'INLINE', 'UPCOMING', 'UNKNOWN']);

// ---------- Sector classifier ----------------------------------------------

export const SECTOR_ENUM = z.enum([
  'Technology',
  'Financial',
  'Healthcare',
  'Energy',
  'Industrials',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Communication',
  'Real Estate',
  'Materials',
  'Utilities',
  'Crypto',
]);

export const sectorClassificationSchema = z.object({
  classifications: z.array(
    z.object({
      symbol: z.string(),
      sector: SECTOR_ENUM,
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
      reasoning: z.string().optional(),
    })
  ),
  generatedAt: z.string().optional(),
});

// ---------- Earnings -------------------------------------------------------

export const earningsSchema = z.object({
  items: z.array(
    z.object({
      symbol: z.string(),
      reportDate: z.string(),
      status: earningsStatus,
      epsActual: z.number().nullable().optional(),
      epsEstimate: z.number().nullable().optional(),
      revActual: z.string().nullable().optional(),
      revEstimate: z.string().nullable().optional(),
      surprisePct: z.number().nullable().optional(),
      note: z.string().optional(),
    })
  ),
  sources: z.number().optional(),
  generatedAt: z.string().optional(),
});
