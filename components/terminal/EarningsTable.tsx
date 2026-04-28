import React from 'react';
import { EarningsResponse, EarningsStatus } from '../../types';
import { cls, fmtPct } from '../../utils/format';

interface Props {
  earnings: EarningsResponse | null;
  loading: boolean;
  onFetch: () => void;
  hasApiKey: boolean;
  hasHoldings: boolean;
}

const statusBadge: Record<EarningsStatus, string> = {
  BEAT: 'text-green border-green/40 bg-green/5',
  MISS: 'text-red border-red/40 bg-red/5',
  INLINE: 'text-ink-2 border-ink-3',
  UPCOMING: 'text-amber border-amber/40 bg-amber/5',
  UNKNOWN: 'text-ink-4 border-line',
};

const EarningsTable: React.FC<Props> = ({ earnings, loading, onFetch, hasApiKey, hasHoldings }) => {
  if (!hasApiKey) return <div className="p-6 text-[11px] text-ink-3">▸ API key required</div>;
  if (!hasHoldings) return <div className="p-6 text-[11px] text-ink-3">▸ Upload CSV to fetch earnings</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-line-2 flex items-center justify-between bg-bg-1">
        <span className="text-[10px] tracking-[0.22em] text-ink-3">▸ EARNINGS CALENDAR</span>
        <button
          onClick={onFetch}
          disabled={loading}
          className="text-[10px] tracking-[0.18em] text-amber hover:text-ink disabled:text-ink-4"
        >
          {loading ? '⏳ FETCHING' : '↻ REFRESH'}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {!earnings && !loading && (
          <div className="p-6 text-center">
            <button onClick={onFetch} className="text-[11px] text-amber hover:text-ink tracking-[0.18em] border border-amber/40 px-4 py-2 hover:bg-amber/5">
              ▸ FETCH ACTUALS VS ESTIMATES
            </button>
            <div className="text-[9px] text-ink-4 mt-3">Gemini grounded search · returns most recent or upcoming report per ticker</div>
          </div>
        )}
        {loading && <div className="p-6 text-[11px] text-ink-3"><span className="text-amber">●</span> grounding earnings data<span className="caret-blink">…</span></div>}
        {earnings && (
          <table className="w-full">
            <thead className="bg-bg-1 border-b border-line-2 sticky top-0 z-10">
              <tr>
                {['SYMBOL', 'REPORT DATE', 'STATUS', 'EPS ACTUAL', 'EPS EST', 'SURPRISE %', 'REV ACTUAL', 'REV EST', 'NOTE'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] tracking-[0.18em] text-ink-3 font-medium text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earnings.items.map((e) => (
                <tr key={e.symbol} className="border-b border-line hover:bg-bg-1">
                  <td className="px-2 py-1.5 text-ink font-medium">{e.symbol}</td>
                  <td className="px-2 py-1.5 text-ink-2 tabular-nums">{e.reportDate}</td>
                  <td className="px-2 py-1.5">
                    <span className={cls('text-[9px] tracking-[0.18em] border px-1.5 py-0.5', statusBadge[e.status])}>{e.status}</span>
                  </td>
                  <td className="px-2 py-1.5 tabular-nums text-ink-2">{e.epsActual ?? '—'}</td>
                  <td className="px-2 py-1.5 tabular-nums text-ink-3">{e.epsEstimate ?? '—'}</td>
                  <td className={cls('px-2 py-1.5 tabular-nums', e.surprisePct == null ? 'text-ink-4' : e.surprisePct >= 0 ? 'text-green' : 'text-red')}>
                    {e.surprisePct == null ? '—' : fmtPct(e.surprisePct, 1)}
                  </td>
                  <td className="px-2 py-1.5 text-ink-2">{e.revActual ?? '—'}</td>
                  <td className="px-2 py-1.5 text-ink-3">{e.revEstimate ?? '—'}</td>
                  <td className="px-2 py-1.5 text-[10px] text-ink-2">{e.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {earnings && (
          <div className="px-3 py-2 text-[9px] tracking-[0.18em] text-ink-4 border-t border-line">
            G · GROUNDED · {earnings.items.length} TICKERS · {earnings.generatedAt && new Date(earnings.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsTable;
