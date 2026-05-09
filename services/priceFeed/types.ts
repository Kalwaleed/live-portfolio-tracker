/**
 * Source of truth for "what's the current price for this symbol?"
 *
 * Adapters today:
 *   - Static: returns the CSV price unchanged (EOD mode)
 *   - Simulated: returns CSV ± 2% jitter, ticks every 1.6s (LIVE · SIM mode)
 *
 * Future:
 *   - Real: hits an actual market data API. Slots in without changing the seam.
 */
export interface PriceFeed {
  getPrice(symbol: string): number;
  /** Subscribe to tick notifications. Returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /**
   * Monotonic counter that increments on every tick. Stable for static
   * feeds. Used as the snapshot value for useSyncExternalStore so React
   * re-renders when prices change.
   */
  readonly version: number;
}
