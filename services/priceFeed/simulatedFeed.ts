import { PriceFeed } from './types';

const TICK_MS = 1600;
const JITTER_PCT = 0.02;

/**
 * Reference-counted simulator. The setInterval starts on first subscribe
 * and clears on last unsubscribe — no leak when the feed is replaced or
 * components unmount.
 *
 * Each tick recomputes prices for every symbol from its base ± 2% jitter.
 * Base prices stay fixed (mean-reverting, not drifting).
 */
export const createSimulatedFeed = (basePrices: Record<string, number>): PriceFeed => {
  const listeners = new Set<() => void>();
  let prices: Record<string, number> = { ...basePrices };
  let interval: ReturnType<typeof setInterval> | null = null;
  let version = 0;

  const tick = () => {
    const next: Record<string, number> = {};
    for (const sym of Object.keys(basePrices)) {
      const base = basePrices[sym];
      const jitter = (Math.random() * 2 - 1) * JITTER_PCT;
      next[sym] = base * (1 + jitter);
    }
    prices = next;
    version += 1;
    listeners.forEach((fn) => fn());
  };

  const feed: PriceFeed = {
    getPrice: (symbol) => prices[symbol] ?? basePrices[symbol] ?? 0,
    subscribe: (listener) => {
      listeners.add(listener);
      if (interval === null) {
        interval = setInterval(tick, TICK_MS);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && interval !== null) {
          clearInterval(interval);
          interval = null;
        }
      };
    },
    get version() {
      return version;
    },
  };

  return feed;
};
