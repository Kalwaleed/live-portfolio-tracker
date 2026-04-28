import React, { useState } from 'react';
import { PortfolioAnalysis, FindingTag } from '../../types';
import { cls } from '../../utils/format';

interface Props {
  analysis: PortfolioAnalysis | null;
  analyzing: boolean;
  hasApiKey: boolean;
  hasHoldings: boolean;
  onRun: (customPrompt?: string) => void;
}

const tagColor: Record<FindingTag, string> = {
  CONCENTRATION: 'text-amber border-amber/40',
  SECTOR: 'text-violet border-violet/40',
  CATALYST: 'text-green border-green/40',
  PERFORMANCE: 'text-red border-red/40',
  LIMIT: 'text-amber border-amber/40',
  LIQUIDITY: 'text-ink-2 border-ink-3',
};

const verbColor: Record<string, string> = {
  BUY: 'text-green',
  SELL: 'text-red',
  TRIM: 'text-red',
  HEDGE: 'text-amber',
  SET: 'text-amber',
  WATCH: 'text-violet',
};

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const color = score < 35 ? 'text-green' : score < 65 ? 'text-amber' : 'text-red';
  const bar = score < 35 ? 'bg-green' : score < 65 ? 'bg-amber' : 'bg-red';
  return (
    <div className="border border-line-2 p-3 bg-bg-2">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[9px] tracking-[0.22em] text-ink-3">RISK SCORE</span>
        <span className={cls('text-[24px] tabular-nums font-medium', color)}>
          {score}<span className="text-ink-4 text-[12px]">/100</span>
        </span>
      </div>
      <div className="h-[3px] bg-bg-3">
        <div className={cls('h-full', bar)} style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
      </div>
    </div>
  );
};

const AiPanel: React.FC<Props> = ({ analysis, analyzing, hasApiKey, hasHoldings, onRun }) => {
  const [prompt, setPrompt] = useState('');

  if (!hasApiKey) {
    return (
      <div className="p-4 text-[11px] text-ink-3 leading-relaxed">
        ▸ <span className="text-amber">SET API KEY</span> in the left rail to enable AI analysis.
      </div>
    );
  }
  if (!hasHoldings) {
    return (
      <div className="p-4 text-[11px] text-ink-3 leading-relaxed">
        ▸ Upload a CSV to analyze holdings.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center justify-between bg-bg-1">
        <span className="text-[9px] tracking-[0.22em] text-ink-3">▸ AI ANALYST</span>
        <span className="text-[9px] tracking-[0.18em] text-violet">GEMINI · GROUNDED</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {analyzing && (
          <div className="text-[11px] text-ink-3 tracking-[0.06em]">
            <span className="text-amber">●</span> analyzing portfolio<span className="caret-blink">…</span>
          </div>
        )}

        {!analyzing && !analysis && (
          <button
            onClick={() => onRun()}
            className="w-full text-left text-[11px] text-violet border border-violet/40 px-3 py-3 hover:bg-violet/5 tracking-[0.06em]"
          >
            ◆ RUN FULL RISK AUDIT →
          </button>
        )}

        {analysis && !analyzing && (
          <>
            <RiskGauge score={analysis.riskScore} />

            <div className="text-[11px] text-ink leading-relaxed border-l-2 border-violet/40 pl-3 italic">
              {analysis.summary}
            </div>

            <div>
              <div className="text-[9px] tracking-[0.22em] text-ink-3 mb-2">FINDINGS · {analysis.findings.length}</div>
              <div className="space-y-2">
                {analysis.findings.map((f, i) => (
                  <div key={i} className="border-l border-line pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cls('text-[9px] tracking-[0.18em] border px-1 py-0.5', tagColor[f.tag])}>
                        [{f.tag}]
                      </span>
                      <span className="text-[10px] text-ink font-medium">{f.title}</span>
                    </div>
                    <div className="text-[10px] text-ink-2 leading-relaxed">{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[9px] tracking-[0.22em] text-ink-3 mb-2">SUGGESTED ACTIONS · {analysis.actions.length}</div>
              <div className="space-y-1.5">
                {analysis.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] border border-line py-1.5 px-2 hover:border-line-2">
                    <span className={cls('font-medium tracking-[0.12em] w-12 flex-shrink-0', verbColor[a.verb] ?? 'text-ink')}>{a.verb}</span>
                    {a.symbol && <span className="text-ink font-medium">{a.symbol}</span>}
                    <span className="text-ink-2 flex-1">{a.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-ink-4 tracking-[0.18em] pt-2">
              GENERATED · {new Date(analysis.generatedAt).toLocaleString()}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-line p-3 bg-bg-1">
        <div className="text-[9px] tracking-[0.22em] text-ink-3 mb-1.5">ASK</div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && prompt.trim()) {
                onRun(prompt);
                setPrompt('');
              }
            }}
            placeholder="am I too long tech?"
            className="flex-1 bg-bg-2 border border-line-2 px-2 py-1 text-[10px] text-ink placeholder:text-ink-4 outline-none focus:border-violet/50"
          />
          <button
            onClick={() => {
              if (prompt.trim()) {
                onRun(prompt);
                setPrompt('');
              }
            }}
            className="text-[10px] text-violet border border-violet/40 px-2 hover:bg-violet/10"
          >
            ⏎
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiPanel;
