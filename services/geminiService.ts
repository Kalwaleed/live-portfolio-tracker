import { GoogleGenAI } from '@google/genai';
import {
  PortfolioItem,
  PortfolioAnalysis,
  MarketNewsResponse,
  EarningsResponse,
  EarningsItem,
} from '../types';

const MODEL = 'gemini-3-flash-preview';

const summarize = (data: PortfolioItem[]) =>
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

const stripCodeFence = (s: string) =>
  s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

const safeJSON = <T>(text: string): T | null => {
  try {
    return JSON.parse(stripCodeFence(text)) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

export const analyzePortfolio = async (
  apiKey: string,
  data: PortfolioItem[],
  customPrompt?: string
): Promise<PortfolioAnalysis> => {
  if (!apiKey) throw new Error('API Key required');
  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = customPrompt
    ? `You are a buy-side portfolio risk analyst answering this specific question: "${customPrompt}". Ground your answer in the portfolio data provided.`
    : `You are a buy-side portfolio risk analyst. Audit the holdings for: concentration risk, sector imbalance, positions near HighLimit (take-profit) or LowLimit (stop-loss), drawdown from cost, and upcoming catalysts. Be specific. Cite symbols.`;

  const schemaInstruction = `
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

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n${schemaInstruction}\n\nPortfolio:\n${JSON.stringify(summarize(data))}`,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  const parsed = safeJSON<Omit<PortfolioAnalysis, 'generatedAt'>>(text);

  if (!parsed) {
    return {
      riskScore: 0,
      summary: 'Analysis returned malformed response.',
      findings: [
        {
          tag: 'PERFORMANCE',
          title: 'Parser failure',
          detail: 'The model did not return valid JSON. Try again or switch tabs.',
          symbols: [],
        },
      ],
      actions: [],
      generatedAt: new Date().toISOString(),
    };
  }

  return { ...parsed, generatedAt: new Date().toISOString() };
};

export const fetchMarketNews = async (
  apiKey: string,
  symbols: string[]
): Promise<MarketNewsResponse | null> => {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  const focus = symbols.length
    ? `Prioritize movement in these portfolio holdings: ${symbols.join(', ')}. Then fall back to top US large-caps.`
    : 'Focus on top US large-caps with significant movement.';

  const prompt = `
Find today's top 3 stock market gainers and top 3 losers. ${focus}

Return ONLY this JSON shape, no prose, no markdown:
{
  "gainers": [{"symbol": "TICKER", "change": "+X.X%", "reason": "max 12 words"}, ...],
  "losers":  [{"symbol": "TICKER", "change": "-X.X%", "reason": "max 12 words"}, ...]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' },
    });
    const parsed = safeJSON<MarketNewsResponse>(response.text ?? '');
    if (!parsed) return null;
    return { ...parsed, generatedAt: new Date().toISOString() };
  } catch (e) {
    console.error('News fetch error:', e);
    return null;
  }
};

export const fetchEarningsCalendar = async (
  apiKey: string,
  symbols: string[]
): Promise<EarningsResponse | null> => {
  if (!apiKey || symbols.length === 0) return null;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
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
- surprisePct = ((actual - estimate) / |estimate|) * 100, rounded to 1 decimal.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' },
    });
    const parsed = safeJSON<{ items: EarningsItem[] }>(response.text ?? '');
    if (!parsed?.items) return null;
    return { items: parsed.items, generatedAt: new Date().toISOString() };
  } catch (e) {
    console.error('Earnings fetch error:', e);
    return null;
  }
};
