import React from 'react';
import { PricedHolding } from '../../types';
import { cls, fmtPct, fmtUsd, plClass } from '../../utils/format';

interface Props {
  apiKey: string;
  setApiKey: (s: string) => void;
  isLive: boolean;
  setIsLive: (b: boolean) => void;
  onUploadClick: () => void;
  onAnalyze: () => void;
  analyzing: boolean;
  totalNlv: number;
  positions: PricedHolding[];
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-b border-line py-3">
    <div className="px-3 text-[9px] tracking-[0.22em] text-ink-3 mb-2">▸ {title}</div>
    <div className="px-3 space-y-2">{children}</div>
  </div>
);

const NavRail: React.FC<Props> = ({
  apiKey,
  setApiKey,
  isLive,
  setIsLive,
  onUploadClick,
  onAnalyze,
  analyzing,
  totalNlv,
  positions,
}) => {
  const top = [...positions]
    .map((p) => ({ ...p, weight: totalNlv > 0 ? ((p.MarketValue ?? 0) / totalNlv) * 100 : 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return (
    <div className="w-[260px] border-r border-line-2 bg-bg-1 flex flex-col overflow-y-auto">
      <Section title="WORKSPACE">
        <button
          onClick={onUploadClick}
          className="w-full text-left text-[10px] tracking-[0.18em] text-ink-2 hover:text-amber border border-line-2 px-2 py-1.5 hover:border-amber/40 transition-colors"
        >
          ⬆ LOAD CSV
        </button>
        <button
          onClick={onAnalyze}
          disabled={!apiKey || positions.length === 0 || analyzing}
          className={cls(
            'w-full text-left text-[10px] tracking-[0.18em] border px-2 py-1.5 transition-colors',
            !apiKey || positions.length === 0
              ? 'text-ink-4 border-line cursor-not-allowed'
              : 'text-violet border-violet/40 hover:bg-violet/5'
          )}
        >
          {analyzing ? '⏳ ANALYZING…' : '◆ RUN AI ANALYSIS'}
        </button>
      </Section>

      <Section title="API KEY">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="GEMINI_API_KEY"
          className="w-full bg-bg-2 border border-line-2 px-2 py-1 text-[10px] text-ink placeholder:text-ink-4 outline-none focus:border-amber/50"
        />
      </Section>

      <Section title="DATA FEED">
        <button
          onClick={() => setIsLive(!isLive)}
          className={cls(
            'w-full flex items-center justify-between text-[10px] tracking-[0.18em] border px-2 py-1.5 transition-colors',
            isLive
              ? 'border-green/40 text-green bg-green/5'
              : 'border-line-2 text-ink-3 hover:text-ink-2'
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className={cls('inline-block w-1.5 h-1.5 rounded-full', isLive ? 'bg-green pulse-dot' : 'bg-ink-4')} />
            {isLive ? 'LIVE · SIMULATED' : 'EOD MARK'}
          </span>
          <span>{isLive ? 'ON' : 'OFF'}</span>
        </button>
        <div className="text-[9px] text-ink-4 leading-relaxed">
          ±2% jitter applied to last price. Real intraday data not connected.
        </div>
      </Section>

      <Section title="CONCENTRATION · TOP 5">
        {top.length === 0 ? (
          <div className="text-[10px] text-ink-4">no holdings</div>
        ) : (
          top.map((h) => (
            <div key={h.Symbol} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-ink">{h.Symbol}</span>
                <span className="tabular-nums text-ink-2">{h.weight.toFixed(2)}%</span>
              </div>
              <div className="h-[2px] bg-bg-2">
                <div className="h-full bg-amber/70" style={{ width: `${Math.min(h.weight, 100)}%` }} />
              </div>
              <div className={cls('text-[9px] tabular-nums', plClass(h.UnrealizedPL))}>
                {fmtUsd(h.UnrealizedPL)} · {fmtPct(h.PurchasePrice > 0 ? ((h.CurrentPrice - h.PurchasePrice) / h.PurchasePrice) * 100 : 0)}
              </div>
            </div>
          ))
        )}
      </Section>

      <div className="flex-1" />
      <div className="border-t border-line px-3 py-2 text-[9px] tracking-[0.18em] text-ink-4">
        █ KEYBOARD<br />
        <span className="text-ink-3">g h</span> holdings · <span className="text-ink-3">g e</span> earnings · <span className="text-ink-3">g a</span> ai · <span className="text-ink-3">/</span> cmd
      </div>
    </div>
  );
};

export default NavRail;
