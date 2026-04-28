import React from 'react';
import { TabKey } from '../../types';
import { cls } from '../../utils/format';

const TABS: Array<{ key: TabKey; label: string; fkey: string }> = [
  { key: 'holdings', label: 'HOLDINGS', fkey: 'F1' },
  { key: 'watchlist', label: 'WATCHLIST', fkey: 'F2' },
  { key: 'sectors', label: 'SECTORS', fkey: 'F3' },
  { key: 'earnings', label: 'EARNINGS', fkey: 'F4' },
  { key: 'news', label: 'NEWS', fkey: 'F5' },
  { key: 'ai', label: 'AI ANALYST', fkey: 'F6' },
  { key: 'settings', label: 'SETTINGS', fkey: 'F7' },
];

const TabStrip: React.FC<{ active: TabKey; onChange: (k: TabKey) => void }> = ({ active, onChange }) => {
  return (
    <div className="relative z-10 h-[30px] border-b border-line-2 bg-bg-0 flex items-stretch">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cls(
            'h-full px-3 flex items-center gap-2 text-[10px] tracking-[0.18em] border-r border-line transition-colors',
            active === t.key
              ? 'text-amber bg-bg-2 border-b border-b-amber'
              : 'text-ink-3 hover:text-ink-2 hover:bg-bg-1'
          )}
        >
          <span className="text-ink-4 text-[9px]">{t.fkey}</span>
          <span>{t.label}</span>
        </button>
      ))}
      <div className="flex-1 border-b border-line" />
    </div>
  );
};

export default TabStrip;
