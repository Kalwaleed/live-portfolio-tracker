import React from 'react';
import { cls } from '../../utils/format';

interface Props {
  isLive: boolean;
  hasApiKey: boolean;
  positions: number;
  tabHint: string;
  geminiCalls: number;
}

const StatusBar: React.FC<Props> = ({ isLive, hasApiKey, positions, tabHint, geminiCalls }) => {
  return (
    <div className="relative z-10 h-[22px] border-t border-line-2 bg-bg-0 flex items-center justify-between px-3 text-[9px] tracking-[0.18em] text-ink-3 select-none">
      <div className="flex items-center gap-4">
        <span className={cls(isLive ? 'text-green' : 'text-ink-3')}>
          ● {isLive ? 'LIVE · SIM' : 'EOD'}
        </span>
        <span>POS <span className="text-ink">{positions}</span></span>
        <span>USD/SAR <span className="text-ink">3.7500</span></span>
        <span>GEMINI <span className={hasApiKey ? 'text-green' : 'text-red'}>{hasApiKey ? 'CONNECTED' : 'NO KEY'}</span></span>
        <span>CALLS <span className="text-ink">{geminiCalls}</span></span>
      </div>
      <div className="flex items-center gap-3">
        <span>{tabHint}</span>
        <span className="text-ink-4">█ <span className="text-ink-3">g h</span> holdings · <span className="text-ink-3">g e</span> earnings · <span className="text-ink-3">g a</span> ai · <span className="text-ink-3">/</span> cmd</span>
      </div>
    </div>
  );
};

export default StatusBar;
