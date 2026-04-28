import React from 'react';
import { MarketNewsResponse } from '../../types';
import { cls } from '../../utils/format';

interface Props {
  news: MarketNewsResponse | null;
  loading: boolean;
  onRefresh: () => void;
  hasApiKey: boolean;
  variant?: 'compact' | 'full';
}

const Row: React.FC<{ symbol: string; change: string; reason: string }> = ({ symbol, change, reason }) => {
  const up = change.startsWith('+');
  return (
    <div className="border-b border-line py-2 px-3 flex items-start gap-3 hover:bg-bg-1">
      <span className="text-[10px] text-ink font-medium w-12 flex-shrink-0">{symbol}</span>
      <span className={cls('text-[10px] tabular-nums w-16 flex-shrink-0', up ? 'text-green' : 'text-red')}>{change}</span>
      <span className="text-[10px] text-ink-2 flex-1 leading-relaxed">{reason}</span>
    </div>
  );
};

const NewsFeed: React.FC<Props> = ({ news, loading, onRefresh, hasApiKey, variant = 'compact' }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center justify-between bg-bg-1">
        <span className="text-[9px] tracking-[0.22em] text-ink-3">▸ MARKET WIRE</span>
        <button
          onClick={onRefresh}
          disabled={!hasApiKey || loading}
          className={cls(
            'text-[9px] tracking-[0.18em]',
            !hasApiKey ? 'text-ink-4' : 'text-amber hover:text-ink'
          )}
        >
          {loading ? '⏳ FETCHING' : '↻ REFRESH'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!hasApiKey && (
          <div className="p-3 text-[10px] text-ink-4">▸ API key required to fetch news</div>
        )}
        {hasApiKey && !news && !loading && (
          <div className="p-3 text-[10px] text-ink-3">
            <button onClick={onRefresh} className="text-amber hover:text-ink tracking-[0.18em]">▸ FETCH TODAY&apos;S MOVERS</button>
          </div>
        )}
        {loading && (
          <div className="p-3 text-[10px] text-ink-3"><span className="text-amber">●</span> fetching grounded sources<span className="caret-blink">…</span></div>
        )}
        {news && (
          <>
            <div className="px-3 py-1.5 text-[9px] tracking-[0.22em] text-green bg-green/5 border-b border-line">▲ GAINERS</div>
            {news.gainers.map((g, i) => <Row key={`g-${i}`} {...g} />)}
            <div className="px-3 py-1.5 text-[9px] tracking-[0.22em] text-red bg-red/5 border-b border-line border-t border-line">▼ LOSERS</div>
            {news.losers.map((l, i) => <Row key={`l-${i}`} {...l} />)}
            <div className="px-3 py-2 text-[9px] tracking-[0.18em] text-ink-4">
              GROUNDED · GEMINI · {news.generatedAt && new Date(news.generatedAt).toLocaleTimeString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
