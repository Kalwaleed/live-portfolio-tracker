import React from 'react';
import { PortfolioItem } from '../../types';
import { fmtPct, fmtUsd, plClass, cls } from '../../utils/format';

interface Props {
  holdings: PortfolioItem[];
  isLive: boolean;
}

const KpiCell: React.FC<{
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
  width?: string;
}> = ({ label, value, hint, valueClass, width }) => (
  <div className={cls('px-4 py-2 border-r border-line flex flex-col justify-center', width)}>
    <div className="text-[9px] tracking-[0.22em] text-ink-3 mb-1">{label}</div>
    <div className={cls('text-[18px] font-medium leading-tight', valueClass ?? 'text-ink')}>{value}</div>
    {hint && <div className="text-[9px] text-ink-4 mt-0.5">{hint}</div>}
  </div>
);

const KpiStrip: React.FC<Props> = ({ holdings, isLive }) => {
  const positions = holdings.filter((h) => h.Quantity > 0);
  const nlv = positions.reduce((s, h) => s + (h.MarketValue ?? 0), 0);
  const cost = positions.reduce((s, h) => s + (h.CostBasis ?? 0), 0);
  const pl = nlv - cost;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;

  // Day P&L proxy: when live mode is on, the simulator applies a multiplier each render.
  // Estimate day delta as the difference between current MV and what MV would be without jitter.
  const dayDelta = positions.reduce((s, h) => {
    const baseMV = h.PurchasePrice * h.Quantity;
    const live = (h.MarketValue ?? 0);
    const jitter = isLive ? live - h.CurrentPrice * h.Quantity / (h.MarketValue ? (h.MarketValue / (h.CurrentPrice * h.Quantity)) : 1) : 0;
    return s + (isLive ? jitter : 0);
  }, 0);
  // Above is fragile under simulator; expose Day P&L only as 0 when not live and "—" otherwise to stay honest.
  const dayPlValue = isLive ? '~ jitter' : '—';

  const cashRow = holdings.find((h) => h.Symbol === 'CASH' || h.Symbol === 'USD');
  const cashUsd = cashRow ? cashRow.MarketValue ?? 0 : 0;
  const cashPct = nlv > 0 ? (cashUsd / nlv) * 100 : 0;

  return (
    <div className="relative z-10 border-b border-line-2 bg-bg-0 grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.6fr]">
      <KpiCell
        label="NET LIQ. VALUE"
        value={fmtUsd(nlv, { compact: false })}
        hint={isLive ? 'SIMULATED ±2% LIVE' : 'EOD MARK'}
        valueClass="text-amber"
      />
      <KpiCell
        label="TOTAL P&L"
        value={fmtUsd(pl)}
        hint={fmtPct(plPct)}
        valueClass={plClass(pl)}
      />
      <KpiCell
        label="DAY P&L"
        value={dayPlValue}
        hint={isLive ? 'simulated · no intraday feed' : 'live feed off'}
        valueClass="text-ink-3"
      />
      <KpiCell
        label="CASH"
        value={cashRow ? fmtUsd(cashUsd, { compact: true }) : '—'}
        hint={cashRow ? `${cashPct.toFixed(1)}%` : 'not in CSV'}
        valueClass="text-ink-2"
      />
      <KpiCell label="POSITIONS" value={String(positions.length)} valueClass="text-ink" />
    </div>
  );
};

export default KpiStrip;
