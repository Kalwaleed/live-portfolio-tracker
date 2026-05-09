import { useEffect, useMemo, useRef, useState } from 'react';
import { Holding, RawHolding } from '../../types';
import { DEFAULT_SECTOR_MAP, enrichSector, SectorMap } from '../../utils/enrichSector';
import { callGemini, sectorClassifierSpec, GeminiError } from '../gemini';
import { clearCache, loadCache, mergeIntoCache, saveCache } from './sectorCache';
import { SectorCache } from './types';

export interface ResolverState {
  holdings: Holding[];
  /** True when an AI classification call is in flight. */
  classifying: boolean;
  /** Last AI classification error, if any. */
  classifierError: GeminiError | null;
  /** Symbols that resolved to 'Unclassified' (AI failed or no apiKey). */
  unclassifiedSymbols: string[];
  /** Manually re-trigger classification (e.g. after API key fix). */
  retry: () => void;
  /** Clear cached AI classifications (Settings affordance). */
  clearAiCache: () => void;
}

/**
 * Resolution order (per row):
 *   1. CSV-provided Sector on the row
 *   2. DEFAULT_SECTOR_MAP.bySymbol lookup
 *   3. AI cache (localStorage, populated by previous Gemini calls)
 *   4. 'Unclassified' (transient — AI fires for these on upload)
 *
 * On every CSV change, symbols that fall to step 4 are batched and sent
 * to Gemini for classification. Results merge into the cache and persist
 * to localStorage so future uploads don't re-query the same symbols.
 */
export const useSectorResolver = (rawRows: RawHolding[], apiKey: string): ResolverState => {
  const [cache, setCache] = useState<SectorCache>(() => loadCache());
  const [classifying, setClassifying] = useState(false);
  const [classifierError, setClassifierError] = useState<GeminiError | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const inFlightRef = useRef<Set<string>>(new Set());

  // Combined map: static + cached AI results. Cache only fills gaps the
  // static map doesn't already answer.
  const combinedMap = useMemo<SectorMap>(() => {
    const merged: Record<string, string> = { ...DEFAULT_SECTOR_MAP.bySymbol };
    for (const [sym, entry] of Object.entries(cache)) {
      if (!merged[sym]) merged[sym] = entry.sector;
    }
    return { bySymbol: merged, defaultSector: 'Unclassified' };
  }, [cache]);

  // Run enrichment with the combined map.
  const holdings = useMemo(
    () => enrichSector(rawRows, combinedMap),
    [rawRows, combinedMap]
  );

  // Identify symbols still 'Unclassified' after the merged-map pass.
  const unclassifiedSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          holdings
            .filter((h) => h.Sector === 'Unclassified')
            .map((h) => h.Symbol.toUpperCase().replace(/\..*$/, ''))
        )
      ),
    [holdings]
  );

  // Eager AI classification: fires whenever there are unclassified symbols
  // and an API key. Each symbol is queried at most once per session via
  // inFlightRef (and at most once across sessions via the cache).
  useEffect(() => {
    if (!apiKey) return;
    if (unclassifiedSymbols.length === 0) return;

    const todo = unclassifiedSymbols.filter((s) => !inFlightRef.current.has(s));
    if (todo.length === 0) return;

    todo.forEach((s) => inFlightRef.current.add(s));
    let cancelled = false;

    (async () => {
      setClassifying(true);
      setClassifierError(null);
      try {
        const result = await callGemini(apiKey, sectorClassifierSpec(todo));
        if (cancelled) return;
        if (result.kind === 'err') {
          setClassifierError(result.error);
          // Allow retry on next render — release the in-flight lock
          todo.forEach((s) => inFlightRef.current.delete(s));
          return;
        }
        const next = mergeIntoCache(cache, result.data.classifications);
        setCache(next);
        saveCache(next);
      } finally {
        if (!cancelled) setClassifying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unclassifiedSymbols.join(','), apiKey, retryNonce]);

  return {
    holdings,
    classifying,
    classifierError,
    unclassifiedSymbols,
    retry: () => {
      // Allow re-querying everything that's still unclassified
      inFlightRef.current.clear();
      setRetryNonce((n) => n + 1);
    },
    clearAiCache: () => {
      clearCache();
      setCache({});
      inFlightRef.current.clear();
    },
  };
};
