import { useSyncExternalStore } from 'react';
import { PriceFeed } from './types';

/**
 * Subscribes to the feed and returns its current `version`. The version is
 * the snapshot value React tracks — when it changes, components re-render.
 *
 * The hook itself owns the React-side subscription lifecycle; the feed
 * handles its own interval lifecycle via reference counting.
 */
export const usePriceFeed = (feed: PriceFeed): number =>
  useSyncExternalStore(
    (cb) => feed.subscribe(cb),
    () => feed.version,
    () => feed.version
  );
