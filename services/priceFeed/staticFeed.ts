import { PriceFeed } from './types';

/**
 * EOD adapter — prices never change. Subscribe is a no-op since version
 * never advances.
 */
export const createStaticFeed = (basePrices: Record<string, number>): PriceFeed => ({
  getPrice: (symbol) => basePrices[symbol] ?? 0,
  subscribe: () => () => {},
  version: 0,
});
