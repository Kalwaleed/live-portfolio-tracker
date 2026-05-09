import type { z } from 'zod';
import type { PricedHolding } from '../../types';
import type { GeminiSpec } from './types';
import {
  portfolioAnalysisSchema,
  marketNewsSchema,
  earningsSchema,
  sectorClassificationSchema,
} from './schemas';

// generatedAt is optional in the schema (the model doesn't produce it) but
// the gateway always attaches it before returning. Consumers should treat
// it as effectively-always-set at runtime — it is only typed optional to
// keep zod's generic variance honest.
export type PortfolioAnalysis = z.infer<typeof portfolioAnalysisSchema>;
export type MarketNewsResponse = z.infer<typeof marketNewsSchema>;
export type EarningsResponse = z.infer<typeof earningsSchema>;
export type SectorClassificationResponse = z.infer<typeof sectorClassificationSchema>;
export type SectorClassification = SectorClassificationResponse['classifications'][number];

// Re-exported subtypes for callers that destructure findings / earnings rows.
export type AiFinding = PortfolioAnalysis['findings'][number];
export type AiAction = PortfolioAnalysis['actions'][number];
export type FindingTag = AiFinding['tag'];
export type ActionVerb = AiAction['verb'];
export type MarketNewsItem = MarketNewsResponse['gainers'][number];
export type EarningsItem = EarningsResponse['items'][number];
export type EarningsStatus = EarningsItem['status'];

const summarizeForAudit = (data: PricedHolding[]) =>
  data.map((d) => ({
    sym: d.Symbol,
    qty: d.Quantity,
    last: d.CurrentPrice,
    cost: d.PurchasePrice,
    hi: d.HighLimit,
    lo: d.LowLimit,
    sector: d.Sector,
    mv: d.MarketValue,
    pl: d.UnrealizedPL,
  }));

const AUDIT_SCHEMA_INSTRUCTION = `
Return ONLY a single JSON object matching this exact schema. No markdown, no prose outside JSON.

{
  "riskScore": <integer 0-100, where 0 = pristine and 100 = critical>,
  "summary": "<one sentence, max 140 chars>",
  "findings": [
    {
      "tag": "<one of: CONCENTRATION, SECTOR, CATALYST, PERFORMANCE, LIMIT, LIQUIDITY>",
      "title": "<short headline, max 60 chars>",
      "detail": "<1-2 sentences with specific symbols and numbers>",
      "symbols": ["<ticker>", ...]
    }
  ],
  "actions": [
    {
      "verb": "<one of: BUY, SELL, TRIM, HEDGE, SET, WATCH>",
      "symbol": "<ticker or omit>",
      "detail": "<concrete action, max 100 chars>"
    }
  ]
}

Aim for 4-6 findings and 3-5 actions. Symbols must match those in the portfolio.`;

export const auditSpec = (
  data: PricedHolding[],
  customPrompt?: string
): GeminiSpec<PortfolioAnalysis> => {
  const systemPrompt = customPrompt
    ? `You are a buy-side portfolio risk analyst answering this specific question: "${customPrompt}". Ground your answer in the portfolio data provided.`
    : `You are a buy-side portfolio risk analyst. Audit the holdings for: concentration risk, sector imbalance, positions near HighLimit (take-profit) or LowLimit (stop-loss), drawdown from cost, and upcoming catalysts. Be specific. Cite symbols.`;

  return {
    prompt: `${systemPrompt}\n\n${AUDIT_SCHEMA_INSTRUCTION}\n\nPortfolio:\n${JSON.stringify(summarizeForAudit(data))}`,
    schema: portfolioAnalysisSchema,
  };
};

export const moversSpec = (symbols: string[]): GeminiSpec<MarketNewsResponse> => {
  const focus = symbols.length
    ? `Prioritize movement in these portfolio holdings: ${symbols.join(', ')}. Then fall back to top US large-caps.`
    : 'Focus on top US large-caps with significant movement.';

  return {
    prompt: `
Find today's top 3 stock market gainers and top 3 losers. ${focus}

Return ONLY this JSON shape, no prose, no markdown:
{
  "gainers": [{"symbol": "TICKER", "change": "+X.X%", "reason": "max 12 words"}, ...],
  "losers":  [{"symbol": "TICKER", "change": "-X.X%", "reason": "max 12 words"}, ...]
}`,
    schema: marketNewsSchema,
    useWebSearch: true,
  };
};

export const earningsSpec = (symbols: string[]): GeminiSpec<EarningsResponse> => ({
  prompt: `
For each of these tickers, find the most recent or upcoming quarterly earnings report and return concrete numbers when available: ${symbols.join(', ')}.

Return ONLY this JSON shape, no prose, no markdown:
{
  "items": [
    {
      "symbol": "TICKER",
      "reportDate": "YYYY-MM-DD",
      "status": "BEAT" | "MISS" | "INLINE" | "UPCOMING" | "UNKNOWN",
      "epsActual": <number or null>,
      "epsEstimate": <number or null>,
      "revActual": "<e.g. $35.1B or null>",
      "revEstimate": "<e.g. $34.8B or null>",
      "surprisePct": <number or null>,
      "note": "<10 words max, key takeaway or 'Report not yet released'>"
    }
  ]
}

Rules:
- If a report is upcoming (not yet released), set status="UPCOMING", actuals to null, and put the expected date in reportDate.
- If you cannot find reliable data for a ticker, set status="UNKNOWN" with a brief note.
- For non-US tickers (e.g. 4280, Saudi-listed), use the local exchange convention.
- surprisePct = ((actual - estimate) / |estimate|) * 100, rounded to 1 decimal.`,
  schema: earningsSchema,
  useWebSearch: true,
});

export const sectorClassifierSpec = (
  symbols: string[]
): GeminiSpec<SectorClassificationResponse> => ({
  prompt: `
Classify the sector for each of these ticker symbols by researching their actual exchange listing and business: ${symbols.join(', ')}.

Use ONE of these exact 12 sector labels — no others, no variations:
Technology, Financial, Healthcare, Energy, Industrials, Consumer Cyclical, Consumer Defensive, Communication, Real Estate, Materials, Utilities, Crypto.

Return ONLY this JSON shape, no prose, no markdown:
{
  "classifications": [
    {
      "symbol": "TICKER",
      "sector": "<one of the 12 labels above>",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "reasoning": "<10 words max, e.g. 'Citibank — global investment bank'>"
    }
  ]
}

Rules:
- "Crypto" is reserved for cryptocurrency tokens (BTC, ETH, SOL, etc.). Never use "Crypto" for public-market equities, even if the company has crypto exposure (e.g. COIN/Coinbase is "Financial", MSTR is "Technology").
- Saudi Tadawul tickers (4-digit numbers, e.g. 4280) should be classified by the underlying company.
- ETFs should be classified by their primary sector exposure (XLK→Technology, XLF→Financial, GLD→Materials, etc.).
- Single-letter tickers like "C" (Citibank), "F" (Ford), "T" (AT&T) are real public companies — research, do not assume crypto.
- If a ticker is genuinely unrecognizable after research, use confidence="LOW" with the best plausible sector and a reasoning note.`,
  schema: sectorClassificationSchema,
  useWebSearch: true,
});
