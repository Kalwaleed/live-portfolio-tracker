import React from 'react';
import { cls } from '../../utils/format';
import { useAiStats } from '../../services/gemini';

interface Props {
  isLive: boolean;
  hasApiKey: boolean;
  positions: number;
  tabHint: string;
}

const StatusBar: React.FC<Props> = ({ isLive, hasApiKey, positions, tabHint }) => {
  const stats = useAiStats();
  const totalErrors = Object.values(stats.errorsByKind).reduce((a, b) => a + b, 0);

  return (
    <div className="relative z-10 h-[22px] border-t border-line-2 bg-bg-0 flex items-center justify-between px-3 text-[9px] tracking-[0.18em] text-ink-3 select-none">
      <div className="flex items-center gap-4">
        <span className={cls(isLive ? 'text-green' : 'text-ink-3')}>
          ● {isLive ? 'LIVE · SIM' : 'EOD'}
        </span>
        <span>POS <span className="text-ink">{positions}</span></span>
        <span>USD/SAR <span className="text-ink">3.7500</span></span>
        <span>GEMINI <span className={hasApiKey ? 'text-green' : 'text-red'}>{hasApiKey ? 'CONNECTED' : 'NO KEY'}</span></span>
        <span>CALLS <span className="text-ink">{stats.calls}</span></span>
        {totalErrors > 0 && (
          <span title={JSON.stringify(stats.errorsByKind)}>
            ERR <span className="text-red">{totalErrors}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span>{tabHint}</span>
        <span className="text-ink-4">█ <span className="text-ink-3">g h</span> holdings · <span className="text-ink-3">g e</span> earnings · <span className="text-ink-3">g a</span> ai · <span className="text-ink-3">/</span> cmd</span>
      </div>
    </div>
  );
};

export default StatusBar;
