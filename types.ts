export interface PortfolioItem {
  Symbol: string;
  CurrentPrice: number;
  Date: string;
  Time: string;
  Change: number;
  Open: number;
  High: number;
  Low: number;
  Volume: number;
  TradeDate: string;
  PurchasePrice: number;
  Quantity: number;
  Commission: number;
  HighLimit: number;
  LowLimit: number;
  Comment: string;
  TransactionType: string;
  Sector?: string;
  MarketValue?: number;
  CostBasis?: number;
  UnrealizedPL?: number;
}

export type TabKey = 'holdings' | 'earnings' | 'news' | 'sectors' | 'ai' | 'watchlist' | 'settings';

export type FindingTag = 'CONCENTRATION' | 'SECTOR' | 'CATALYST' | 'PERFORMANCE' | 'LIMIT' | 'LIQUIDITY';
export type ActionVerb = 'BUY' | 'SELL' | 'TRIM' | 'HEDGE' | 'SET' | 'WATCH';

export interface AiFinding {
  tag: FindingTag;
  title: string;
  detail: string;
  symbols?: string[];
}

export interface AiAction {
  verb: ActionVerb;
  symbol?: string;
  detail: string;
}

export interface PortfolioAnalysis {
  riskScore: number;
  summary: string;
  findings: AiFinding[];
  actions: AiAction[];
  generatedAt: string;
}

export interface MarketNewsItem {
  symbol: string;
  change: string;
  reason: string;
}

export interface MarketNewsResponse {
  gainers: MarketNewsItem[];
  losers: MarketNewsItem[];
  sources?: number;
  generatedAt?: string;
}

export type EarningsStatus = 'BEAT' | 'MISS' | 'INLINE' | 'UPCOMING' | 'UNKNOWN';

export interface EarningsItem {
  symbol: string;
  reportDate: string;
  status: EarningsStatus;
  epsActual?: number | null;
  epsEstimate?: number | null;
  revActual?: string | null;
  revEstimate?: string | null;
  surprisePct?: number | null;
  note?: string;
}

export interface EarningsResponse {
  items: EarningsItem[];
  sources?: number;
  generatedAt?: string;
}
