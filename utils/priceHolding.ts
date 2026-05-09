import { Holding, PricedHolding } from '../types';

/**
 * Pure metric calculator. The current price comes from a PriceFeed adapter
 * — randomness/live behavior is the feed's concern, not this function's.
 *
 * `currentPrice` overwrites the holding's `CurrentPrice` field so that
 * downstream consumers see the live-effective price, not the CSV base.
 */
export const priceHolding = (holding: Holding, currentPrice: number): PricedHolding => {
  const marketValue = holding.Quantity * currentPrice;
  const costBasis = holding.Quantity * holding.PurchasePrice;
  const unrealizedPL = marketValue - costBasis;
  return {
    ...holding,
    CurrentPrice: currentPrice,
    MarketValue: marketValue,
    CostBasis: costBasis,
    UnrealizedPL: unrealizedPL,
  };
};
