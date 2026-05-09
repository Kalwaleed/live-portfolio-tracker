export type CommandCategory = 'nav' | 'ai' | 'system';

/**
 * One unit of action — invocable from the command bar (by name/alias) and
 * the keyboard (by key/chord). Single source of truth for both surfaces.
 */
export interface Command {
  /** Stable ID. Also the primary command-bar name. */
  id: string;
  /** Alternative command-bar names (e.g. 'audit' for 'analyze'). */
  aliases?: string[];
  /**
   * Keyboard invocations. Single keys ('F1', '/') or chords ('g h').
   * Chord syntax is exactly two tokens separated by a single space.
   */
  keys?: string[];
  category: CommandCategory;
  /** One-line description shown in the help overlay. */
  description: string;
  /** What it does. Receives `args` only for parameterized commands like 'ask'. */
  run: (args?: string) => void | Promise<void>;
}
