/**
 * Holdings flow through a 4-stage pipeline. Each subsequent type is a
 * strict superset — TypeScript enforces lifecycle order.
 *
 *   parseCSV          → RawHolding[]   structure + numeric coercion
 *   applyCurrencyRules → RawHolding[]  USD-normalized
 *   enrichSector       → Holding[]     + Sector
 *   priceHolding       → PricedHolding + MarketValue, CostBasis, UnrealizedPL
 *
 * Components that render dollars consume PricedHolding. Components that
 * only need ticker + sector data can take Holding.
 */

/** Raw row from CSV after parsing. No domain enrichment yet. */
export interface RawHolding {
  Symbol: string;
  Quantity: number;
  CurrentPrice: number;   // base price as listed in CSV
  PurchasePrice: number;
  HighLimit: number;
  LowLimit: number;
  Date: string;
  Time: string;
  Change: number;
  Open: number;
  High: number;
  Low: number;
  Volume: number;
  TradeDate: string;
  Commission: number;
  Comment: string;
  TransactionType: string;
  /** Optional CSV-provided sector. enrichSector respects this if present. */
  Sector?: string;
}

/** RawHolding with sector classification attached. */
export interface Holding extends RawHolding {
  Sector: string;
}

/** Holding with computed metrics. CurrentPrice may be live-effective. */
export interface PricedHolding extends Holding {
  MarketValue: number;
  CostBasis: number;
  UnrealizedPL: number;
}

export type TabKey = 'holdings' | 'earnings' | 'news' | 'sectors' | 'ai' | 'watchlist' | 'settings';

// AI capability types live with the gateway. Re-exported here so existing
// component imports (`../../types`) keep working.
export type {
  PortfolioAnalysis,
  MarketNewsResponse,
  MarketNewsItem,
  EarningsResponse,
  EarningsItem,
  EarningsStatus,
  AiFinding,
  AiAction,
  FindingTag,
  ActionVerb,
} from './services/gemini';
