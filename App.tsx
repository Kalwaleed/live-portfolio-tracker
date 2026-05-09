import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PricedHolding, RawHolding, TabKey, PortfolioAnalysis, MarketNewsResponse, EarningsResponse } from './types';
import { parseCSV } from './utils/parseCSV';
import { applyCurrencyRules, SAUDI_RIYAL_RULE } from './utils/convertCurrency';
import { priceHolding } from './utils/priceHolding';
import { useSectorResolver } from './services/sectorResolver';
import {
  auditSpec,
  moversSpec,
  earningsSpec,
  useAiQuery,
} from './services/gemini';
import {
  createStaticFeed,
  createSimulatedFeed,
  usePriceFeed,
} from './services/priceFeed';
import {
  Command,
  matchByName,
  useKeyboardCommands,
} from './services/commandRegistry';

import TopBar from './components/terminal/TopBar';
import Ticker from './components/terminal/Ticker';
import TabStrip from './components/terminal/TabStrip';
import KpiStrip from './components/terminal/KpiStrip';
import NavRail from './components/terminal/NavRail';
import HoldingsBook from './components/terminal/HoldingsBook';
import AiPanel from './components/terminal/AiPanel';
import NewsFeed from './components/terminal/NewsFeed';
import EarningsTable from './components/terminal/EarningsTable';
import SectorTreemap from './components/terminal/SectorTreemap';
import StatusBar from './components/terminal/StatusBar';
import UploadGate from './components/terminal/UploadGate';
import HelpOverlay from './components/terminal/HelpOverlay';

const STORAGE_API_KEY = 'desk:apiKey';
const STORAGE_CSV = 'desk:lastCsv';

const App: React.FC = () => {
  const [csvText, setCsvText] = useState<string | null>(() => localStorage.getItem(STORAGE_CSV));
  const [csvError, setCsvError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_API_KEY) ?? '');
  const [isLive, setIsLive] = useState(false);
  const [tab, setTab] = useState<TabKey>('holdings');
  const [command, setCommand] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  // Persist API key + CSV
  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_API_KEY, apiKey);
  }, [apiKey]);
  useEffect(() => {
    if (csvText) localStorage.setItem(STORAGE_CSV, csvText);
  }, [csvText]);

  // Pipeline stage 1+2: parse → currency-normalize. Stage 3 (sector
  // enrichment) is delegated to the resolver hook so AI classification
  // can run for symbols not in the static map.
  const normalizedRaw = useMemo<RawHolding[]>(() => {
    if (!csvText) return [];
    try {
      const raw = parseCSV(csvText);
      return applyCurrencyRules(raw, [SAUDI_RIYAL_RULE]);
    } catch (e) {
      console.error('CSV parse error:', e);
      return [];
    }
  }, [csvText]);

  const sectorState = useSectorResolver(normalizedRaw, apiKey);
  const holdings = sectorState.holdings;

  // Pipeline stage 4: pricing (live or static). Feed picks ticking strategy.
  const basePrices = useMemo(
    () => Object.fromEntries(holdings.map((h) => [h.Symbol, h.CurrentPrice])),
    [holdings]
  );
  const feed = useMemo(
    () => (isLive ? createSimulatedFeed(basePrices) : createStaticFeed(basePrices)),
    [isLive, basePrices]
  );
  const version = usePriceFeed(feed);

  const processed = useMemo<PricedHolding[]>(
    () => holdings.map((h) => priceHolding(h, feed.getPrice(h.Symbol))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holdings, feed, version]
  );

  const positions = useMemo(() => processed.filter((h) => h.Quantity > 0 && h.Symbol !== 'CASH' && h.Symbol !== 'USD'), [processed]);
  const watchlist = useMemo(() => processed.filter((h) => h.Quantity === 0), [processed]);
  const totalNlv = useMemo(() => positions.reduce((s, h) => s + (h.MarketValue ?? 0), 0), [positions]);

  // AI queries — each runs through useAiQuery, which absorbs the
  // data/loading/error state-trio and handles cancellation. buildSpec
  // returning null is the skip guard (no apiKey / empty positions).
  const audit = useAiQuery<[customPrompt?: string], PortfolioAnalysis>(
    (customPrompt?: string) =>
      positions.length > 0 ? auditSpec(positions, customPrompt) : null,
    apiKey
  );
  const movers = useAiQuery<[], MarketNewsResponse>(
    () => moversSpec(positions.map((p) => p.Symbol)),
    apiKey
  );
  const earningsQuery = useAiQuery<[], EarningsResponse>(
    () =>
      positions.length > 0 ? earningsSpec(positions.map((p) => p.Symbol)) : null,
    apiKey
  );

  // CSV upload handler
  const handleCsvLoad = useCallback((text: string) => {
    setCsvError(null);
    try {
      const items = parseCSV(text);
      if (items.length === 0) {
        setCsvError('No rows parsed. Check headers (Symbol, Quantity, CurrentPrice, PurchasePrice required).');
        return;
      }
      setCsvText(text);
      // Reset cached AI outputs since portfolio changed
      audit.reset();
      earningsQuery.reset();
    } catch (e) {
      setCsvError(`Parse error: ${(e as Error).message}`);
    }
  }, [audit, earningsQuery]);

  const triggerUpload = useCallback(() => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.csv,text/csv';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => handleCsvLoad(String(reader.result ?? ''));
      reader.readAsText(f);
    };
    inp.click();
  }, [handleCsvLoad]);

  // Wrapper that switches to the AI tab as a side effect when audit fires.
  const runAnalysis = useCallback(
    async (customPrompt?: string) => {
      setTab('ai');
      await audit.run(customPrompt);
    },
    [audit]
  );
  const refreshNews = movers.run;
  const refreshEarnings = earningsQuery.run;

  // Single source of truth for keyboard shortcuts AND command-bar verbs.
  // Adding a new action = one entry in this array (the keyboard handler
  // and the command bar both dispatch through it).
  const commands = useMemo<Command[]>(
    () => [
      { id: 'holdings',  aliases: ['g h'], keys: ['F1', 'g h'], category: 'nav', description: 'Show holdings book',          run: () => setTab('holdings') },
      { id: 'watchlist', aliases: ['g w'], keys: ['F2', 'g w'], category: 'nav', description: 'Show watchlist',               run: () => setTab('watchlist') },
      { id: 'sectors',   aliases: ['g s'], keys: ['F3', 'g s'], category: 'nav', description: 'Show sector treemap',          run: () => setTab('sectors') },
      { id: 'earnings',  aliases: ['g e'], keys: ['F4', 'g e'], category: 'nav', description: 'Show earnings table + refresh', run: () => { setTab('earnings'); refreshEarnings(); } },
      { id: 'news',      aliases: ['g n'], keys: ['F5', 'g n'], category: 'nav', description: 'Show movers + refresh',         run: () => { setTab('news'); refreshNews(); } },
      { id: 'ai',        aliases: ['g a'], keys: ['F6', 'g a'], category: 'nav', description: 'Show AI analyst',               run: () => setTab('ai') },
      { id: 'settings',                    keys: ['F7'],        category: 'nav', description: 'Show settings',                 run: () => setTab('settings') },

      { id: 'analyze', aliases: ['audit'],  category: 'ai', description: 'Run portfolio audit',                run: () => runAnalysis() },
      { id: 'ask',                          category: 'ai', description: 'Ask a custom audit question (ask <prompt>)', run: (args) => runAnalysis(args) },

      { id: 'live',                         category: 'system', description: 'Enable live price simulator',  run: () => setIsLive(true) },
      { id: 'eod',                          category: 'system', description: 'Disable live price simulator', run: () => setIsLive(false) },
      { id: 'reset',                        category: 'system', description: 'Clear cached CSV',             run: () => { localStorage.removeItem(STORAGE_CSV); setCsvText(null); } },
      { id: 'cmd',                          keys: ['/'], category: 'system', description: 'Focus command bar', run: () => {
        const inp = document.querySelector<HTMLInputElement>('input[placeholder*="ask"]');
        inp?.focus();
      } },
      { id: 'help', aliases: ['?'],         keys: ['?'], category: 'system', description: 'Show all commands', run: () => setHelpOpen(true) },
    ],
    [runAnalysis, refreshNews, refreshEarnings]
  );

  useKeyboardCommands(commands);

  const handleCommandSubmit = useCallback(() => {
    const runner = matchByName(command, commands);
    runner?.();
    setCommand('');
  }, [command, commands]);

  const tabHint = useMemo(() => {
    const map: Record<TabKey, string> = {
      holdings: 'F1 · HOLDINGS',
      watchlist: 'F2 · WATCHLIST',
      sectors: 'F3 · SECTORS',
      earnings: 'F4 · EARNINGS',
      news: 'F5 · NEWS',
      ai: 'F6 · AI ANALYST',
      settings: 'F7 · SETTINGS',
    };
    return map[tab];
  }, [tab]);

  // Empty state — no CSV yet
  if (!csvText || holdings.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-bg-0">
        <TopBar command={command} onCommand={setCommand} onSubmit={handleCommandSubmit} />
        <UploadGate onLoad={handleCsvLoad} error={csvError} />
        <StatusBar isLive={isLive} hasApiKey={!!apiKey} positions={0} tabHint="UPLOAD CSV TO BEGIN" />
        <HelpOverlay open={helpOpen} commands={commands} onClose={() => setHelpOpen(false)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-0 overflow-hidden">
      <TopBar command={command} onCommand={setCommand} onSubmit={handleCommandSubmit} />
      <Ticker holdings={positions} />
      <TabStrip active={tab} onChange={setTab} />
      <KpiStrip holdings={processed} isLive={isLive} />

      <div className="flex-1 flex overflow-hidden">
        <NavRail
          apiKey={apiKey}
          setApiKey={setApiKey}
          isLive={isLive}
          setIsLive={setIsLive}
          onUploadClick={triggerUpload}
          onAnalyze={() => runAnalysis()}
          analyzing={audit.loading}
          totalNlv={totalNlv}
          positions={positions}
        />

        <div className="flex-1 overflow-hidden bg-bg-0 flex flex-col">
          {tab === 'holdings' && <HoldingsBook holdings={positions} totalNlv={totalNlv} mode="holdings" />}
          {tab === 'watchlist' && <HoldingsBook holdings={watchlist} totalNlv={totalNlv} mode="watchlist" />}
          {tab === 'sectors' && <SectorTreemap holdings={positions} totalNlv={totalNlv} />}
          {tab === 'earnings' && (
            <EarningsTable
              earnings={earningsQuery.data}
              loading={earningsQuery.loading}
              onFetch={refreshEarnings}
              hasApiKey={!!apiKey}
              hasHoldings={positions.length > 0}
            />
          )}
          {tab === 'news' && (
            <NewsFeed news={movers.data} loading={movers.loading} onRefresh={refreshNews} hasApiKey={!!apiKey} variant="full" />
          )}
          {tab === 'ai' && (
            <AiPanel
              analysis={audit.data}
              analyzing={audit.loading}
              hasApiKey={!!apiKey}
              hasHoldings={positions.length > 0}
              onRun={runAnalysis}
            />
          )}
          {tab === 'settings' && (
            <div className="p-6 text-[11px] text-ink-2 leading-relaxed space-y-3 max-w-[640px]">
              <div className="text-[10px] tracking-[0.22em] text-ink-3">▸ SETTINGS</div>
              <div>
                <div className="text-ink-3 mb-1">CSV CACHE</div>
                <button
                  onClick={() => { localStorage.removeItem(STORAGE_CSV); setCsvText(null); }}
                  className="text-red border border-red/40 px-2 py-1 text-[10px] tracking-[0.18em] hover:bg-red/10"
                >
                  CLEAR & RELOAD
                </button>
              </div>
              <div>
                <div className="text-ink-3 mb-1">API KEY</div>
                <button
                  onClick={() => { localStorage.removeItem(STORAGE_API_KEY); setApiKey(''); }}
                  className="text-amber border border-amber/40 px-2 py-1 text-[10px] tracking-[0.18em] hover:bg-amber/10"
                >
                  FORGET KEY
                </button>
              </div>
              <div>
                <div className="text-ink-3 mb-1">SECTOR CACHE</div>
                <button
                  onClick={sectorState.clearAiCache}
                  className="text-amber border border-amber/40 px-2 py-1 text-[10px] tracking-[0.18em] hover:bg-amber/10"
                >
                  CLEAR AI CLASSIFICATIONS
                </button>
                <div className="text-ink-4 text-[10px] mt-2">
                  Wipes the localStorage of AI-derived sector classifications.
                  Static map and CSV-provided sectors are unaffected. Symbols
                  reset to 'Unclassified' until the next AI call lands.
                </div>
              </div>
              <div className="text-ink-4 text-[10px] pt-4">
                Beta and VaR are not shown in the KPI strip — these require historical price data
                we do not currently source. Day P&L is also blank unless live mode is on, in which
                case it reflects ±2% simulator jitter (clearly tagged SIMULATED).
              </div>
            </div>
          )}
        </div>

        {/* Right column — AI/News always visible alongside main view (except when AI/News is the main tab) */}
        {tab !== 'ai' && tab !== 'news' && (
          <div className="w-[340px] border-l border-line-2 bg-bg-1 flex flex-col">
            <div className="flex-1 overflow-hidden border-b border-line-2">
              <AiPanel
                analysis={audit.data}
                analyzing={audit.loading}
                hasApiKey={!!apiKey}
                hasHoldings={positions.length > 0}
                onRun={runAnalysis}
              />
            </div>
            <div className="h-[260px] flex-shrink-0 overflow-hidden">
              <NewsFeed news={movers.data} loading={movers.loading} onRefresh={refreshNews} hasApiKey={!!apiKey} />
            </div>
          </div>
        )}
      </div>

      <StatusBar isLive={isLive} hasApiKey={!!apiKey} positions={positions.length} tabHint={tabHint} />
      <HelpOverlay open={helpOpen} commands={commands} onClose={() => setHelpOpen(false)} />
    </div>
  );
};

export default App;
