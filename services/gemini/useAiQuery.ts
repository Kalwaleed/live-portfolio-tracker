import { useCallback, useEffect, useRef, useState } from 'react';
import { callGemini } from './gateway';
import { GeminiError, GeminiSpec } from './types';

export interface AiQueryState<TData> {
  data: TData | null;
  loading: boolean;
  error: GeminiError | null;
  /** Call the spec. If buildSpec returns null, the call is skipped. */
  run: (...args: unknown[]) => Promise<void>;
  /** Clear state and cancel any in-flight call. */
  reset: () => void;
}

/**
 * Generic hook for "fire a Gemini call, track loading/error/data, branch
 * on result.kind." Replaces the data/loading/error state-trio that
 * audit/movers/earnings each rolled by hand.
 *
 * Behavior:
 *   - `buildSpec` may close over component state freely; it's stabilized
 *     via a ref so `run` stays referentially stable across renders.
 *   - `buildSpec(...args)` returning `null` means "skip this call" —
 *     the clean way to encode guards like "no apiKey" or "empty positions".
 *   - Token-based cancellation: if `run` fires twice rapidly, the first
 *     call's late response is dropped. State only ever reflects the
 *     latest call.
 */
export function useAiQuery<TArgs extends unknown[], TData>(
  buildSpec: (...args: TArgs) => GeminiSpec<TData> | null,
  apiKey: string
): {
  data: TData | null;
  loading: boolean;
  error: GeminiError | null;
  run: (...args: TArgs) => Promise<void>;
  reset: () => void;
} {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeminiError | null>(null);

  // Stabilize buildSpec across renders so `run` doesn't churn its identity.
  const buildSpecRef = useRef(buildSpec);
  useEffect(() => {
    buildSpecRef.current = buildSpec;
  });

  // Monotonic token. Any call whose token != latest is treated as stale.
  const tokenRef = useRef(0);

  const run = useCallback(
    async (...args: TArgs): Promise<void> => {
      if (!apiKey) return;
      const spec = buildSpecRef.current(...args);
      if (!spec) return;

      const myToken = ++tokenRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await callGemini(apiKey, spec);
        if (myToken !== tokenRef.current) return; // superseded
        if (result.kind === 'err') {
          setData(null);
          setError(result.error);
          return;
        }
        setData(result.data);
      } finally {
        if (myToken === tokenRef.current) setLoading(false);
      }
    },
    [apiKey]
  );

  const reset = useCallback(() => {
    tokenRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, run, reset };
}
