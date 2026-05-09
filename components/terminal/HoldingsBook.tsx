import React, { useMemo, useState } from 'react';
import { PricedHolding } from '../../types';
import { cls, fmtNum, fmtPct, fmtUsd, plClass } from '../../utils/format';

type SortKey = 'Symbol' | 'Sector' | 'Quantity' | 'PurchasePrice' | 'CurrentPrice' | 'MarketValue' | 'Weight' | 'UnrealizedPL' | 'PLPct';

interface Props {
  holdings: PricedHolding[];
  totalNlv: number;
  mode: 'holdings' | 'watchlist';
}

const sectorPillBorder: Record<string, string> = {
  Technology: 'border-violet/40 text-violet/90',
  Financial: 'border-amber/40 text-amber/90',
  Healthcare: 'border-green/40 text-green/90',
  Energy: 'border-red/40 text-red/90',
  Communication: 'border-violet/40 text-violet/90',
  'Consumer Cyclical': 'border-ink-3 text-ink-2',
  'Consumer Defensive': 'border-ink-3 text-ink-2',
  Automotive: 'border-amber/40 text-amber/90',
  Industrials: 'border-ink-3 text-ink-2',
  Crypto: 'border-amber-dim/60 text-amber-dim',
};

const HoldingsBook: React.FC<Props> = ({ holdings, totalNlv, mode }) => {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'MarketValue', dir: 'desc' });

  const rows = useMemo(() => {
    const enriched = holdings.map((h) => {
      const weight = totalNlv > 0 ? ((h.MarketValue ?? 0) / totalNlv) * 100 : 0;
      const plPct = h.PurchasePrice > 0 ? ((h.CurrentPrice - h.PurchasePrice) / h.PurchasePrice) * 100 : 0;
      const breach: 'high' | 'low' | null =
        h.HighLimit > 0 && h.CurrentPrice >= h.HighLimit ? 'high'
        : h.LowLimit > 0 && h.CurrentPrice <= h.LowLimit ? 'low'
        : null;
      return { ...h, _weight: weight, _plPct: plPct, _breach: breach };
    });

    enriched.sort((a, b) => {
      const k = sort.key;
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (k === 'Weight') return ((a._weight - b._weight) * dir);
      if (k === 'PLPct') return ((a._plPct - b._plPct) * dir);
      const av = (a as any)[k];
      const bv = (b as any)[k];
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    });
    return enriched;
  }, [holdings, totalNlv, sort]);

  const setSortKey = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  const Th: React.FC<{ k?: SortKey; children: React.ReactNode; align?: string }> = ({ k, children, align = 'text-left' }) => (
    <th
      className={cls('px-2 py-1.5 text-[9px] tracking-[0.18em] font-medium text-ink-3 select-none', align, k && 'cursor-pointer hover:text-ink')}
      onClick={k ? () => setSortKey(k) : undefined}
    >
      {children}
      {k && sort.key === k && <span className="ml-1 text-amber">{sort.dir === 'desc' ? '▾' : '▴'}</span>}
    </th>
  );

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-3 text-[11px] tracking-[0.18em]">
        ▸ {mode === 'watchlist' ? 'NO WATCHLIST ROWS · ADD QTY=0 LINES TO YOUR CSV' : 'NO HOLDINGS · UPLOAD CSV TO BEGIN'}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-bg-1 border-b border-line-2 z-10">
          <tr>
            <Th k="Symbol">SYMBOL</Th>
            <Th k="Sector">SECTOR</Th>
            <Th k="Quantity" align="text-right">QTY</Th>
            <Th k="PurchasePrice" align="text-right">AVG COST</Th>
            <Th k="CurrentPrice" align="text-right">LAST</Th>
            <Th k="MarketValue" align="text-right">MKT VALUE</Th>
            <Th k="Weight">WEIGHT %</Th>
            <Th k="UnrealizedPL" align="text-right">UNR P&L</Th>
            <Th k="PLPct" align="text-right">P&L %</Th>
            <Th align="text-center">FLAG</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.Symbol} className={cls(
              'border-b border-line hover:bg-bg-1 group',
              r._breach === 'high' && 'bg-amber/5',
              r._breach === 'low' && 'bg-red/8'
            )}>
              <td className="px-2 py-1.5 text-ink font-medium tracking-[0.06em]">{r.Symbol}</td>
              <td className="px-2 py-1.5">
                {r.Sector && (
                  <span className={cls(
                    'text-[9px] px-1.5 py-0.5 border tracking-[0.12em]',
                    sectorPillBorder[r.Sector] ?? 'border-ink-3 text-ink-2'
                  )}>{r.Sector.toUpperCase()}</span>
                )}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{fmtNum(r.Quantity, 0)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink-2">{fmtUsd(r.PurchasePrice)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink">{fmtUsd(r.CurrentPrice)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-ink">{fmtUsd(r.MarketValue, { compact: false })}</td>
              <td className="px-2 py-1.5 min-w-[110px]">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[3px] bg-bg-2 relative">
                    <div className="absolute inset-y-0 left-0 bg-amber/70" style={{ width: `${Math.min(r._weight, 100)}%` }} />
                  </div>
                  <span className="tabular-nums text-[11px] text-ink-2 w-12 text-right">{r._weight.toFixed(2)}%</span>
                </div>
              </td>
              <td className={cls('px-2 py-1.5 text-right tabular-nums', plClass(r.UnrealizedPL))}>{fmtUsd(r.UnrealizedPL)}</td>
              <td className={cls('px-2 py-1.5 text-right tabular-nums', plClass(r._plPct))}>{fmtPct(r._plPct)}</td>
              <td className="px-2 py-1.5 text-center">
                {r._breach === 'high' && <span className="text-amber text-[9px] tracking-[0.18em]">▲ AT HI</span>}
                {r._breach === 'low' && <span className="text-red text-[9px] tracking-[0.18em]">▼ AT LO</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsBook;
