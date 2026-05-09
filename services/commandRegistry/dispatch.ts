import { Command } from './types';

/**
 * Match a command-bar input string against the registry.
 *
 * Two-pass match:
 *   1. Full-input match (handles 'g h', 'analyze', etc.)
 *   2. First-word match with rest as args (handles 'ask <prompt>')
 *
 * Returns a function that runs the command, or null if no match. The
 * runner is unbound — caller decides when to invoke it (typically right
 * after clearing the input).
 */
export const matchByName = (
  input: string,
  commands: Command[]
): (() => void | Promise<void>) | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  // Pass 1: exact match against id or any alias
  for (const c of commands) {
    if (c.id === lower || c.aliases?.includes(lower)) {
      return () => c.run();
    }
  }

  // Pass 2: first word as command name, rest as args (preserve original
  // case for args — useful for 'ask "What's my exposure to AI?"')
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace > 0) {
    const name = trimmed.slice(0, firstSpace).toLowerCase();
    const args = trimmed.slice(firstSpace + 1);
    for (const c of commands) {
      if (c.id === name || c.aliases?.includes(name)) {
        return () => c.run(args);
      }
    }
  }

  return null;
};

/**
 * Match a keyboard event against the registry, taking chord state into
 * account.
 *
 *   - If a chord is active and not expired, look for `${chord.first} ${e.key}`
 *   - Otherwise look for direct match `e.key` (F1, F2, '/')
 *   - Otherwise check whether this key starts a possible chord
 */
export interface KeyMatchResult {
  command?: Command;
  /** True if this key is the first half of a possible chord. */
  startsChord: boolean;
}

export const matchByKey = (
  key: string,
  chordFirst: string | null,
  commands: Command[]
): KeyMatchResult => {
  // Active chord — try to complete it
  if (chordFirst) {
    const lookFor = `${chordFirst} ${key}`;
    const cmd = commands.find((c) => c.keys?.includes(lookFor));
    if (cmd) return { command: cmd, startsChord: false };
  }

  // Direct match (F1-F12, '/', etc.)
  const direct = commands.find((c) => c.keys?.includes(key));
  if (direct) return { command: direct, startsChord: false };

  // Could this key start a chord?
  const startsChord = commands.some((c) =>
    c.keys?.some((k) => k.startsWith(`${key} `))
  );
  return { startsChord };
};
