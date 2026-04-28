import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PortfolioItem, TabKey, PortfolioAnalysis, MarketNewsResponse, EarningsResponse } from './types';
import { calculateMetrics, parseCSV } from './utils/helpers';
import { analyzePortfolio, fetchEarningsCalendar, fetchMarketNews } from './services/geminiService';

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

const STORAGE_API_KEY = 'desk:apiKey';
const STORAGE_CSV = 'desk:lastCsv';

const App: React.FC = () => {
  const [csvText, setCsvText] = useState<string | null>(() => localStorage.getItem(STORAGE_CSV));
  const [csvError, setCsvError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_API_KEY) ?? '');
  const [isLive, setIsLive] = useState(false);
  const [tab, setTab] = useState<TabKey>('holdings');
  const [command, setCommand] = useState('');

  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [news, setNews] = useState<MarketNewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [geminiCalls, setGeminiCalls] = useState(0);

  // Persist API key + CSV
  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_API_KEY, apiKey);
  }, [apiKey]);
  useEffect(() => {
    if (csvText) localStorage.setItem(STORAGE_CSV, csvText);
  }, [csvText]);

  // Parse CSV → PortfolioItem[]
  const data = useMemo<PortfolioItem[]>(() => {
    if (!csvText) return [];
    try {
      return parseCSV(csvText);
    } catch (e) {
      console.error('CSV parse error:', e);
      return [];
    }
  }, [csvText]);

  // Apply live multiplier + computed fields. Re-render every 1.6s when live.
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    if (!isLive) return;
    const t = setInterval(() => setLiveTick((n) => n + 1), 1600);
    return () => clearInterval(t);
  }, [isLive]);

  const processed = useMemo<PortfolioItem[]>(
    () => data.map((d) => calculateMetrics(d, isLive)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, isLive, liveTick]
  );

  const positions = useMemo(() => processed.filter((h) => h.Quantity > 0 && h.Symbol !== 'CASH' && h.Symbol !== 'USD'), [processed]);
  const watchlist = useMemo(() => processed.filter((h) => h.Quantity === 0), [processed]);
  const totalNlv = useMemo(() => positions.reduce((s, h) => s + (h.MarketValue ?? 0), 0), [positions]);

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
      setAnalysis(null);
      setEarnings(null);
    } catch (e) {
      setCsvError(`Parse error: ${(e as Error).message}`);
    }
  }, []);

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

  // AI Analysis
  const runAnalysis = useCallback(async (customPrompt?: string) => {
    if (!apiKey || positions.length === 0) return;
    setAnalyzing(true);
    setTab('ai');
    try {
      const result = await analyzePortfolio(apiKey, positions, customPrompt);
      setAnalysis(result);
      setGeminiCalls((n) => n + 1);
    } finally {
      setAnalyzing(false);
    }
  }, [apiKey, positions]);

  // News
  const refreshNews = useCallback(async () => {
    if (!apiKey) return;
    setNewsLoading(true);
    try {
      const result = await fetchMarketNews(apiKey, positions.map((p) => p.Symbol));
      setNews(result);
      setGeminiCalls((n) => n + 1);
    } finally {
      setNewsLoading(false);
    }
  }, [apiKey, positions]);

  // Earnings
  const refreshEarnings = useCallback(async () => {
    if (!apiKey || positions.length === 0) return;
    setEarningsLoading(true);
    try {
      const result = await fetchEarningsCalendar(apiKey, positions.map((p) => p.Symbol));
      setEarnings(result);
      setGeminiCalls((n) => n + 1);
    } finally {
      setEarningsLoading(false);
    }
  }, [apiKey, positions]);

  // Keyboard chords (g h, g e, g a, /)
  const chordRef = useRef<{ key: string; expires: number } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (e.key === '/' && !inField) {
        e.preventDefault();
        const cmdInput = document.querySelector<HTMLInputElement>('input[placeholder*="ask"]');
        cmdInput?.focus();
        return;
      }
      if (inField) return;
      const now = Date.now();
      if (chordRef.current && now < chordRef.current.expires) {
        if (chordRef.current.key === 'g') {
          if (e.key === 'h') setTab('holdings');
          if (e.key === 'w') setTab('watchlist');
          if (e.key === 'e') setTab('earnings');
          if (e.key === 'n') setTab('news');
          if (e.key === 's') setTab('sectors');
          if (e.key === 'a') setTab('ai');
        }
        chordRef.current = null;
      } else if (e.key === 'g') {
        chordRef.current = { key: 'g', expires: now + 1500 };
      } else if (e.key === 'F1') { e.preventDefault(); setTab('holdings'); }
        else if (e.key === 'F2') { e.preventDefault(); setTab('watchlist'); }
        else if (e.key === 'F3') { e.preventDefault(); setTab('sectors'); }
        else if (e.key === 'F4') { e.preventDefault(); setTab('earnings'); }
        else if (e.key === 'F5') { e.preventDefault(); setTab('news'); }
        else if (e.key === 'F6') { e.preventDefault(); setTab('ai'); }
        else if (e.key === 'F7') { e.preventDefault(); setTab('settings'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCommandSubmit = useCallback(() => {
    const c = command.trim().toLowerCase();
    if (!c) return;
    if (c.startsWith('g ')) {
      const sub = c.slice(2);
      if (sub === 'h' || sub === 'holdings') setTab('holdings');
      else if (sub === 'w' || sub === 'watchlist') setTab('watchlist');
      else if (sub === 'e' || sub === 'earnings') setTab('earnings');
      else if (sub === 'n' || sub === 'news') setTab('news');
      else if (sub === 's' || sub === 'sectors') setTab('sectors');
      else if (sub === 'a' || sub === 'ai') setTab('ai');
    } else if (c === 'analyze' || c === 'audit') {
      runAnalysis();
    } else if (c.startsWith('ask ')) {
      runAnalysis(command.trim().slice(4));
    } else if (c === 'news') {
      setTab('news'); refreshNews();
    } else if (c === 'earnings') {
      setTab('earnings'); refreshEarnings();
    } else if (c === 'live') {
      setIsLive(true);
    } else if (c === 'eod') {
      setIsLive(false);
    } else if (c === 'reset') {
      localStorage.removeItem(STORAGE_CSV);
      setCsvText(null);
    }
    setCommand('');
  }, [command, runAnalysis, refreshNews, refreshEarnings]);

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
  if (!csvText || data.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-bg-0">
        <TopBar command={command} onCommand={setCommand} onSubmit={handleCommandSubmit} />
        <UploadGate onLoad={handleCsvLoad} error={csvError} />
        <StatusBar isLive={isLive} hasApiKey={!!apiKey} positions={0} tabHint="UPLOAD CSV TO BEGIN" geminiCalls={geminiCalls} />
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
          analyzing={analyzing}
          totalNlv={totalNlv}
          positions={positions}
        />

        <div className="flex-1 overflow-hidden bg-bg-0 flex flex-col">
          {tab === 'holdings' && <HoldingsBook holdings={positions} totalNlv={totalNlv} mode="holdings" />}
          {tab === 'watchlist' && <HoldingsBook holdings={watchlist} totalNlv={totalNlv} mode="watchlist" />}
          {tab === 'sectors' && <SectorTreemap holdings={positions} totalNlv={totalNlv} />}
          {tab === 'earnings' && (
            <EarningsTable
              earnings={earnings}
              loading={earningsLoading}
              onFetch={refreshEarnings}
              hasApiKey={!!apiKey}
              hasHoldings={positions.length > 0}
            />
          )}
          {tab === 'news' && (
            <NewsFeed news={news} loading={newsLoading} onRefresh={refreshNews} hasApiKey={!!apiKey} variant="full" />
          )}
          {tab === 'ai' && (
            <AiPanel
              analysis={analysis}
              analyzing={analyzing}
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
                analysis={analysis}
                analyzing={analyzing}
                hasApiKey={!!apiKey}
                hasHoldings={positions.length > 0}
                onRun={runAnalysis}
              />
            </div>
            <div className="h-[260px] flex-shrink-0 overflow-hidden">
              <NewsFeed news={news} loading={newsLoading} onRefresh={refreshNews} hasApiKey={!!apiKey} />
            </div>
          </div>
        )}
      </div>

      <StatusBar isLive={isLive} hasApiKey={!!apiKey} positions={positions.length} tabHint={tabHint} geminiCalls={geminiCalls} />
    </div>
  );
};

export default App;
