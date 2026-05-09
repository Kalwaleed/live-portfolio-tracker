import React, { useEffect } from 'react';
import { Command, CommandCategory } from '../../services/commandRegistry';

interface Props {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

const CATEGORY_LABEL: Record<CommandCategory, string> = {
  nav: 'NAVIGATION',
  ai: 'AI ACTIONS',
  system: 'SYSTEM',
};

const CATEGORY_ORDER: CommandCategory[] = ['nav', 'ai', 'system'];

const HelpOverlay: React.FC<Props> = ({ open, commands, onClose }) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const grouped: Record<CommandCategory, Command[]> = {
    nav: [],
    ai: [],
    system: [],
  };
  for (const c of commands) grouped[c.category].push(c);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-0/85 backdrop-blur-sm flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-bg-1 border border-line-2 max-w-[720px] w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line-2 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.22em] text-ink-3">▸ COMMANDS · ? · ESC TO CLOSE</span>
          <button
            onClick={onClose}
            className="text-[10px] text-ink-3 hover:text-ink tracking-[0.18em]"
          >
            [X]
          </button>
        </div>

        <div className="p-4 space-y-5">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[10px] tracking-[0.22em] text-ink-3 mb-2">
                  ▸ {CATEGORY_LABEL[cat]}
                </div>
                <div className="space-y-1">
                  {items.map((c) => (
                    <div key={c.id} className="flex items-baseline text-[11px] leading-relaxed">
                      <div className="w-[180px] flex-shrink-0 flex flex-wrap gap-1">
                        {c.keys?.map((k) => (
                          <span
                            key={k}
                            className="text-ink border border-line-2 px-1 text-[10px] tracking-[0.12em]"
                          >
                            {k}
                          </span>
                        ))}
                        {!c.keys?.length && <span className="text-ink-4 text-[10px]">—</span>}
                      </div>
                      <div className="w-[140px] flex-shrink-0 text-ink font-medium tracking-[0.08em]">
                        {c.id}
                        {c.aliases?.length ? (
                          <span className="text-ink-4 text-[10px]"> · {c.aliases.join(' · ')}</span>
                        ) : null}
                      </div>
                      <div className="flex-1 text-ink-2">{c.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
