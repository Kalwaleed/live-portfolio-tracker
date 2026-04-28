import React from 'react';
import { PortfolioItem } from '../../types';
import { fmtNum, fmtPct, plClass } from '../../utils/format';

const Ticker: React.FC<{ holdings: PortfolioItem[] }> = ({ holdings }) => {
  if (!holdings.length) return <div className="h-6 border-b border-line bg-bg-0" />;

  const items = holdings.slice(0, 24);
  const row = (key: string) => (
    <div key={key} className="flex items-center gap-6 pr-6 text-[10px]">
      {items.map((h, i) => {
        const pct =
          h.PurchasePrice > 0 ? ((h.CurrentPrice - h.PurchasePrice) / h.PurchasePrice) * 100 : 0;
        return (
          <span key={`${key}-${i}`} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-ink-2 tracking-[0.06em]">{h.Symbol}</span>
            <span className="text-ink">{fmtNum(h.CurrentPrice)}</span>
            <span className={plClass(pct)}>{fmtPct(pct, 2)}</span>
            <span className="text-ink-4">·</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="relative z-10 h-6 border-b border-line bg-bg-1 overflow-hidden">
      <div className="ticker-slide flex h-full items-center">
        {row('a')}
        {row('b')}
      </div>
    </div>
  );
};

export default Ticker;
