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
  // Computed & Enriched
  Sector?: string;
  MarketValue?: number;
  CostBasis?: number;
  UnrealizedPL?: number;
}

export enum Tab {
  HOLDINGS = 'HOLDINGS',
  WATCHLIST = 'WATCHLIST'
}