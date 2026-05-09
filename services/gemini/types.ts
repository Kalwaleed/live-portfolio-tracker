import type { ZodType } from 'zod';

export type GeminiErrorKind =
  | 'NO_API_KEY'
  | 'NETWORK'
  | 'MALFORMED_JSON'
  | 'SCHEMA_MISMATCH'
  | 'SDK_ERROR';

export interface GeminiError {
  kind: GeminiErrorKind;
  message: string;
  cause?: unknown;
}

// Discriminator is a string literal (not boolean) because non-strict-mode
// TypeScript widens boolean literals and breaks discriminated union narrowing.
export type Result<T> =
  | { kind: 'ok'; data: T; generatedAt: string }
  | { kind: 'err'; error: GeminiError };

export const isOk = <T>(r: Result<T>): r is { kind: 'ok'; data: T; generatedAt: string } =>
  r.kind === 'ok';

export interface GeminiSpec<T> {
  prompt: string;
  schema: ZodType<T>;
  useWebSearch?: boolean;
}

export interface AiStats {
  calls: number;
  errorsByKind: Record<GeminiErrorKind, number>;
}

export const ZERO_STATS: AiStats = {
  calls: 0,
  errorsByKind: {
    NO_API_KEY: 0,
    NETWORK: 0,
    MALFORMED_JSON: 0,
    SCHEMA_MISMATCH: 0,
    SDK_ERROR: 0,
  },
};
