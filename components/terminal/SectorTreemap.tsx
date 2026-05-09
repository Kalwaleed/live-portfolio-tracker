import React, { useMemo } from 'react';
import { PricedHolding } from '../../types';
import { cls, fmtPct, fmtUsd, plClass } from '../../utils/format';

interface Props { holdings: PricedHolding[]; totalNlv: number; }

interface Tile { sector: string; mv: number; pl: number; weight: number; symbols: string[]; }

const squarify = (tiles: Tile[], x: number, y: number, w: number, h: number): Array<Tile & { x: number; y: number; w: number; h: number }> => {
  const total = tiles.reduce((s, t) => s + t.mv, 0);
  if (total === 0 || tiles.length === 0) return [];
  const result: Array<Tile & { x: number; y: number; w: number; h: number }> = [];
  let currX = x, currY = y, currW = w, currH = h;

  const pieces = tiles.map(t => ({ ...t, area: (t.mv / total) * (w * h) }));
  let remaining = [...pieces];

  while (remaining.length) {
    const horizontal = currW >= currH;
    const side = horizontal ? currH : currW;
    let row: typeof remaining = [];
    let bestRatio = Infinity;

    for (const p of remaining) {
      const trial = [...row, p];
      const sum = trial.reduce((s, q) => s + q.area, 0);
      const length = sum / side;
      const worst = Math.max(...trial.map((q) => Math.max((side * side * q.area) / (sum * sum), (sum * sum) / (side * side * q.area))));
      if (worst < bestRatio) { row = trial; bestRatio = worst; } else break;
    }
    if (row.length === 0) row = [remaining[0]];
    const sum = row.reduce((s, q) => s + q.area, 0);
    const length = sum / side;
    let offset = horizontal ? currY : currX;
    row.forEach((p) => {
      const segLen = p.area / side;
      const tx = horizontal ? currX : offset;
      const ty = horizontal ? offset : currY;
      const tw = horizontal ? length : segLen;
      const th = horizontal ? segLen : side;
      result.push({ ...p, x: tx, y: ty, w: tw, h: th });
      offset += segLen;
    });
    if (horizontal) { currX += length; currW -= length; } else { currY += length; currH -= length; }
    remaining = remaining.slice(row.length);
  }
  return result;
};

const SectorTreemap: React.FC<Props> = ({ holdings, totalNlv }) => {
  const tiles = useMemo(() => {
    const bySector = new Map<string, Tile>();
    holdings.forEach((h) => {
      const sec = h.Sector ?? 'Unknown';
      const t = bySector.get(sec) ?? { sector: sec, mv: 0, pl: 0, weight: 0, symbols: [] };
      t.mv += h.MarketValue ?? 0;
      t.pl += h.UnrealizedPL ?? 0;
      t.symbols.push(h.Symbol);
      bySector.set(sec, t);
    });
    const arr = Array.from(bySector.values()).map((t) => ({
      ...t,
      weight: totalNlv > 0 ? (t.mv / totalNlv) * 100 : 0,
    })).sort((a, b) => b.mv - a.mv);
    return arr;
  }, [holdings, totalNlv]);

  const W = 1000, H = 560;
  const positioned = useMemo(() => squarify(tiles, 0, 0, W, H), [tiles]);

  if (positioned.length === 0) return <div className="p-6 text-[11px] text-ink-3">▸ NO SECTOR DATA</div>;

  return (
    <div className="p-3">
      <div className="text-[10px] tracking-[0.22em] text-ink-3 mb-2">▸ SECTOR ALLOCATION · WEIGHT BY MV · COLOR BY P&L</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto border border-line-2">
        {positioned.map((t) => {
          const plPct = t.mv > 0 ? (t.pl / (t.mv - t.pl)) * 100 : 0;
          const intensity = Math.min(Math.abs(plPct) / 30, 1);
          const fill = t.pl >= 0
            ? `rgba(63, 207, 142, ${0.15 + intensity * 0.45})`
            : `rgba(255, 93, 93, ${0.15 + intensity * 0.45})`;
          return (
            <g key={t.sector}>
              <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={fill} stroke="rgba(231,229,221,0.18)" strokeWidth={1} />
              {t.w > 110 && t.h > 50 && (
                <>
                  <text x={t.x + 10} y={t.y + 22} fill="#e7e5dd" fontSize="13" fontFamily="JetBrains Mono" fontWeight="500">
                    {t.sector.toUpperCase()}
                  </text>
                  <text x={t.x + 10} y={t.y + 40} fill="#b9b6ab" fontSize="11" fontFamily="JetBrains Mono">
                    {t.weight.toFixed(1)}% · {t.symbols.length} pos
                  </text>
                  <text x={t.x + 10} y={t.y + t.h - 12} fill={t.pl >= 0 ? '#3fcf8e' : '#ff5d5d'} fontSize="11" fontFamily="JetBrains Mono">
                    {fmtPct(plPct)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
        {tiles.map((t) => (
          <div key={t.sector} className="flex items-center justify-between border-b border-line py-1">
            <span className="text-ink-2">{t.sector}</span>
            <div className="flex items-center gap-3 tabular-nums">
              <span className="text-ink">{t.weight.toFixed(2)}%</span>
              <span className={cls('w-20 text-right', plClass(t.pl))}>{fmtUsd(t.pl)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorTreemap;
