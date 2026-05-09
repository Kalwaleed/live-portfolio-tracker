import { useEffect, useRef } from 'react';
import { matchByKey } from './dispatch';
import { Command } from './types';

const CHORD_TIMEOUT_MS = 1500;

/**
 * Wires window.keydown to the command registry. Owns the chord state.
 *
 *   - Ignores keystrokes while focus is in an INPUT or TEXTAREA (so
 *     typing in the command bar doesn't trigger chords).
 *   - Holds an active chord state for 1.5s after the first key.
 *   - calls preventDefault on matched keys (so F1/F4 etc. don't trigger
 *     browser behavior).
 */
export const useKeyboardCommands = (commands: Command[]): void => {
  // Keep the latest commands in a ref so the effect doesn't re-bind on
  // every render. The effect can read whatever the freshest registry is.
  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands;
  });

  useEffect(() => {
    const chord: { first: string; expires: number } = { first: '', expires: 0 };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (inField) return;

      const now = Date.now();
      const chordFirst = now < chord.expires ? chord.first : null;
      const result = matchByKey(e.key, chordFirst, commandsRef.current);

      if (result.command) {
        e.preventDefault();
        chord.first = '';
        chord.expires = 0;
        result.command.run();
      } else if (result.startsChord) {
        chord.first = e.key;
        chord.expires = now + CHORD_TIMEOUT_MS;
      } else {
        chord.first = '';
        chord.expires = 0;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};
