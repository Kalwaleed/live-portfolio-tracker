import { useSyncExternalStore } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  AiStats,
  GeminiError,
  GeminiErrorKind,
  GeminiSpec,
  Result,
  ZERO_STATS,
} from './types';

/**
 * Pinned model. Change this constant to upgrade — it is the only place
 * the model ID lives. Stay on the Flash family per project decision.
 */
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

// ---------- SDK client cache ----------------------------------------------

let cachedKey: string | null = null;
let cachedClient: GoogleGenAI | null = null;

const getClient = (apiKey: string): GoogleGenAI => {
  if (cachedKey === apiKey && cachedClient) return cachedClient;
  cachedClient = new GoogleGenAI({ apiKey });
  cachedKey = apiKey;
  return cachedClient;
};

// ---------- Stats store ---------------------------------------------------

let stats: AiStats = ZERO_STATS;
const listeners = new Set<() => void>();

const setStats = (next: AiStats) => {
  stats = next;
  listeners.forEach((fn) => fn());
};

const recordCall = () => {
  setStats({ ...stats, calls: stats.calls + 1 });
};

const recordError = (kind: GeminiErrorKind) => {
  setStats({
    ...stats,
    errorsByKind: { ...stats.errorsByKind, [kind]: stats.errorsByKind[kind] + 1 },
  });
};

export const useAiStats = (): AiStats =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => stats,
    () => stats
  );

/** For tests only — resets the in-memory stats and SDK cache. */
export const __resetGatewayForTests = () => {
  stats = ZERO_STATS;
  listeners.forEach((fn) => fn());
  cachedKey = null;
  cachedClient = null;
};

// ---------- JSON repair ---------------------------------------------------

const stripCodeFence = (s: string) =>
  s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

const tryParseJson = (text: string): unknown | undefined => {
  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return undefined;
    try {
      return JSON.parse(match[0]);
    } catch {
      return undefined;
    }
  }
};

// ---------- Result helpers -----------------------------------------------

const fail = (kind: GeminiErrorKind, message: string, cause?: unknown): Result<never> => {
  recordError(kind);
  const error: GeminiError = { kind, message };
  if (cause !== undefined) error.cause = cause;
  return { kind: 'err', error };
};

// ---------- Public call function -----------------------------------------

export const callGemini = async <T>(
  apiKey: string,
  spec: GeminiSpec<T>
): Promise<Result<T>> => {
  if (!apiKey) {
    return fail('NO_API_KEY', 'No Gemini API key configured.');
  }

  const client = getClient(apiKey);

  let rawText: string;
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: spec.prompt,
      config: {
        responseMimeType: 'application/json',
        ...(spec.useWebSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
    rawText = response.text ?? '';
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gemini SDK call failed.';
    // Best-effort distinction between transport and SDK-internal errors.
    const kind: GeminiErrorKind = /network|fetch|timeout|ECONN/i.test(msg)
      ? 'NETWORK'
      : 'SDK_ERROR';
    return fail(kind, msg, e);
  }

  const parsed = tryParseJson(rawText);
  if (parsed === undefined) {
    return fail('MALFORMED_JSON', 'Model returned text that was not valid JSON.', rawText);
  }

  const validation = spec.schema.safeParse(parsed);
  if (!validation.success) {
    return fail(
      'SCHEMA_MISMATCH',
      'Model output did not match expected schema.',
      validation.error
    );
  }

  recordCall();
  const generatedAt = new Date().toISOString();
  // Attach generatedAt onto the data so existing consumers stay unchanged.
  const data = { ...validation.data, generatedAt } as T;
  return { kind: 'ok', data, generatedAt };
};
