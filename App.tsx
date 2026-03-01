import React, { useState, useMemo, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { GL } from './components/gl';
import { Button } from './components/ui/button';
import { Pill } from './components/ui/pill';
import { Tab } from './types';
import { calculateMetrics, formatCurrency, formatNumber, parseCSV } from './utils/helpers';
import { analyzePortfolio, fetchMarketNews, MarketNewsResponse } from './services/geminiService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Color System - Warm Earth Tones
const COLORS = {
  chartColors: [
    '#D4756C', '#E88B5D', '#F4A460', '#DAA520',
    '#CD853F', '#B8860B', '#C47A51', '#CC7A52',
  ]
};

// Error Boundary — prevents white-screen crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Portfolio Tracker Error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-xl font-mono text-[#C96567]">Something went wrong</h2>
            <p className="text-sm font-mono text-[#8A7A6A]">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 border border-[#FF8C00] text-[#FF8C00] rounded-lg text-sm font-mono hover:bg-[#FF8C00]/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // State for Navigation and Data
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [data, setData] = useState<PortfolioItem[]>([]);
  
  // Dashboard State
  const [apiKey, setApiKey] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOLDINGS);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  
  // Market News State
  const [marketNews, setMarketNews] = useState<MarketNewsResponse | null>(null);
  const [loadingNews, setLoadingNews] = useState(false);
  
  // AI Overlay State
  const [showAIModal, setShowAIModal] = useState(false);

  // Landing Page File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Escape handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAIModal) {
        setShowAIModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAIModal]);

  // Recalculate metrics based on Live Toggle
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    return data.map(item => calculateMetrics(item, isLive));
  }, [data, isLive]);

  // Split Data (memoized to avoid recomputing on every render)
  const holdings = useMemo(() => processedData.filter(item => item.Quantity > 0), [processedData]);
  const watchlist = useMemo(() => processedData.filter(item => !item.Quantity || item.Quantity === 0), [processedData]);

  const activeData = activeTab === Tab.HOLDINGS ? holdings : watchlist;

  // --- Derived Chart Data ---

  // 1. Allocation (Symbol) Data (Top 5 + Others)
  const allocationData = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => (b.MarketValue || 0) - (a.MarketValue || 0));
    // For Bar Chart we might just want the top 10
    return sorted.slice(0, 10);
  }, [holdings]);

  // 2. Sector Allocation Data
  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    holdings.forEach(item => {
      const s = item.Sector || 'Crypto'; // Default fallback handled in helper, but strictly mapped here
      sectors[s] = (sectors[s] || 0) + (item.MarketValue || 0);
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  // 3. Portfolio Movers (Top 3 Gainers & Losers from Holdings)
  const portfolioMovers = useMemo(() => {
    const withPL = holdings
      .filter(h => h.UnrealizedPL !== undefined && h.CostBasis && h.CostBasis > 0)
      .map(h => ({
        symbol: h.Symbol,
        changePercent: ((h.UnrealizedPL || 0) / (h.CostBasis || 1)) * 100,
        unrealizedPL: h.UnrealizedPL || 0,
        sector: h.Sector || 'Other',
        marketValue: h.MarketValue || 0
      }));

    const sorted = [...withPL].sort((a, b) => b.changePercent - a.changePercent);

    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse()
    };
  }, [holdings]);

  // Fetch News Effect
  useEffect(() => {
    if (apiKey && view === 'dashboard' && !marketNews && !loadingNews) {
      setLoadingNews(true);
      fetchMarketNews(apiKey)
        .then(res => setMarketNews(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingNews(false));
    }
  }, [apiKey, view, marketNews, loadingNews]);

  // Handle File Upload from Landing Page
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
             setData(parsed);
             setView('dashboard');
          } else {
             alert("Could not parse CSV. Please ensure it has standard headers.");
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async (specificQuestion?: string) => {
    if (!apiKey) return;
    setIsAnalyzing(true);
    const result = await analyzePortfolio(apiKey, holdings, specificQuestion);
    setAnalysis(result);
    setIsAnalyzing(false);
    // Analysis now displays inline in dashboard section
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // --- RENDER LANDING PAGE ---
  if (view === 'landing') {
    return (
      <div className="min-h-screen text-white font-mono relative overflow-hidden flex flex-col items-center justify-center">
        <GL />

        <div className="z-10 text-center px-4 max-w-5xl pb-16">
          <Pill className="mb-6 mx-auto hover:scale-110 transition-transform duration-300">
            SYSTEM ONLINE v2.0
          </Pill>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient mb-8">
            Quantified <br/>
            <i className="font-light">Wealth</i>
          </h1>

          <p className="font-mono text-sm sm:text-base text-foreground/60 mt-8 max-w-[440px] mx-auto">
            Advanced portfolio telemetry powered by Gemini AI.
            Upload your CSV to initialize the dashboard.
          </p>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            className="mt-14"
            onClick={triggerUpload}
          >
            [Initialize System]
          </Button>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen text-gray-200 font-mono relative flex overflow-hidden bg-[#050505]">

      {/* --- AI ANALYST MODAL OVERLAY --- */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500"
            onClick={() => setShowAIModal(false)}
          />
          <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#0F0F0F] border-2 border-[#FF8C00]/40 shadow-[0_0_60px_rgba(255,140,0,0.25)] animate-scale-in flex flex-col">
            <div className="p-6 border-b-2 border-[#3A3028] bg-gradient-to-r from-[#1A1614] to-[#0F0F0F] flex justify-between items-center">
              <h2 className="text-2xl font-serif text-[#FF8C00] flex items-center gap-3">
                <span className="text-2xl">✨</span> Gemini Strategic Report
              </h2>
              <button onClick={() => setShowAIModal(false)} className="text-[#9A8A7A] hover:text-[#FF8C00] transition-colors text-sm font-mono">
                [ESC]
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar prose prose-invert prose-headings:text-[#F4A460] prose-strong:text-[#FF8C00] max-w-none">
              <div className="whitespace-pre-wrap text-base leading-7 text-[#B8A99A]">
                {analysis}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Collapsed / Docked) */}
      <aside className="hidden md:flex flex-col w-72 p-6 z-20 border-r-2 border-[#3A3028] bg-[#0F0F0F]/90 backdrop-blur-xl h-screen sticky top-0">
        <h1 className="text-2xl font-serif text-[#F5F5F5] tracking-wide mb-10">
          Portfolio <span className="text-[#FF8C00] font-normal">OS</span>
        </h1>

        <div className="space-y-6">
          {/* Live status indicator */}
          <div className="flex items-center justify-between p-4 bg-[#1A1614]/40 rounded-xl border border-[#3A3028]">
            <span className="font-bold text-xs tracking-wider text-[#B8A99A]">FEED STATUS</span>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`relative w-12 h-6 flex items-center rounded-full transition-all duration-300 ${isLive ? 'bg-[#4A9E6E]/20 border-2 border-[#4A9E6E]' : 'bg-[#3A3028]/30 border-2 border-[#3A3028]'}`}
            >
              <span className={`w-4 h-4 bg-current rounded-full shadow-lg transform transition-all duration-300 ${isLive ? 'translate-x-6 text-[#4A9E6E]' : 'translate-x-1 text-[#9A8A7A]'}`} />
            </button>
          </div>

          <hr className="border-[#3A3028]" />

          {/* AI Command Center */}
          <div className="space-y-3">
             <label className="text-[10px] text-[#B8A99A] uppercase tracking-widest font-bold">AI Command Center</label>
             <textarea
                className="w-full bg-[#1A1614]/50 border-2 border-[#3A3028] rounded-lg p-3 text-xs focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 focus:outline-none transition-all resize-none h-24 text-[#F5F5F5] placeholder-[#6B5D52]"
                placeholder="Ask specific questions..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
             />
             <button
                onClick={() => handleAnalyze(customQuestion)}
                disabled={isAnalyzing || !apiKey}
                className="w-full py-3 bg-gradient-to-r from-[#D4756C] to-[#FF8C00] hover:from-[#E88B5D] hover:to-[#F4A460] rounded-lg text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#D4756C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
                {isAnalyzing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <span>Execute Analysis</span>
                    <span>→</span>
                  </>
                )}
             </button>

             {/* Docked Analysis Card */}
             {analysis && !showAIModal && (
               <div
                 onClick={() => setShowAIModal(true)}
                 className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#FF8C00]/10 to-transparent border-2 border-[#FF8C00]/20 cursor-pointer hover:bg-[#FF8C00]/20 hover:border-[#FF8C00]/40 transition-all group"
               >
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[#FF8C00] text-xs font-bold uppercase tracking-wider">Report Ready</span>
                   <span className="text-[#FF8C00] text-xs group-hover:translate-x-1 transition-transform">↗</span>
                 </div>
                 <p className="text-[10px] text-[#B8A99A] line-clamp-2">
                   Click to expand the full strategic assessment generated by Gemini.
                 </p>
               </div>
             )}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t-2 border-[#3A3028]">
          <button onClick={() => setView('landing')} className="text-xs text-[#9A8A7A] hover:text-[#FF8C00] transition-colors flex items-center gap-2">
            <span>←</span> Back to Entrance
          </button>
        </div>
      </aside>

      {/* Main Dashboard Grid */}
      <main className="flex-1 z-10 overflow-y-auto h-screen scroll-smooth m-6 md:m-8 border-2 border-[#3A3028] rounded-2xl bg-[#050505] flex flex-col">
        {/* Sticky Header with Controls */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0F0F0F]/95 border-b border-[#3A3028] shadow-lg rounded-t-xl">
          <div className="max-w-7xl mx-auto px-12 md:px-16 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* API Key Input */}
              <div className="flex-1 max-w-md w-full">
                <input
                  type="password"
                  placeholder="Enter Gemini API Key... (Press Enter)"
                  className="w-full bg-[#1A1614]/50 border border-[#3A3028] rounded-lg px-4 py-3 text-sm font-mono text-[#F5F5F5] placeholder-[#6B5D52] focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 transition-all duration-300"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && apiKey && !isAnalyzing) {
                      handleAnalyze();
                    }
                  }}
                />
              </div>

              {/* Live Toggle */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={`relative px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border-2 ${isLive ? 'bg-[#4A9E6E]/10 border-[#4A9E6E] text-[#4A9E6E] shadow-[0_0_15px_rgba(74,158,110,0.2)]' : 'bg-[#3A3028]/30 border-[#3A3028] text-[#9A8A7A]'}`}
              >
                {isLive ? '🟢 LIVE' : '⚪ STATIC'}
              </button>

              {/* Mobile Analyze Button (sidebar hidden below md) */}
              <button
                onClick={() => {
                  if (analysis) { setShowAIModal(true); }
                  else if (apiKey && !isAnalyzing) { handleAnalyze(); }
                }}
                disabled={!apiKey || isAnalyzing}
                className="md:hidden px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border-2 bg-[#FF8C00]/10 border-[#FF8C00]/40 text-[#FF8C00] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : analysis ? 'View Report' : 'Analyze'}
              </button>

              {/* Tab Switcher */}
              <div className="flex bg-[#1A1614]/50 p-1 rounded-lg border border-[#3A3028]">
                {[Tab.HOLDINGS, Tab.WATCHLIST].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/40 shadow-[0_0_10px_rgba(255,140,0,0.2)]' : 'text-[#9A8A7A] hover:text-[#B8A99A]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-12 py-8 md:px-16 md:py-10 space-y-8 pb-20">

          {/* Dashboard Title */}
          <div>
            <h2 className="text-4xl font-serif text-[#F5F5F5]">Portfolio Dashboard</h2>
            <p className="text-[#9A8A7A] text-sm font-mono mt-1">Live Market Telemetry & AI Analysis</p>
          </div>

          {/* Row 1: Enhanced KPI Cards with Warm Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1: Net Liquidation Value */}
            <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#D4756C] hover:shadow-[0_0_30px_rgba(212,117,108,0.2)]">
              <div className="p-6 relative">
                <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-2">Net Liquidation Value</h3>
                <span className="text-3xl text-[#F5F5F5] font-light tracking-tight">
                  {formatCurrency(holdings.reduce((sum, item) => sum + (item.MarketValue || 0), 0))}
                </span>
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4756C] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4756C]/5 blur-3xl rounded-full group-hover:bg-[#D4756C]/10 transition-all" />
              </div>
            </div>

            {/* KPI 2: Unrealized P&L */}
            <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#E88B5D] hover:shadow-[0_0_30px_rgba(232,139,93,0.2)]">
              <div className="p-6 relative">
                <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-2">Unrealized P&L</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-light tracking-tight ${holdings.reduce((sum, item) => sum + (item.UnrealizedPL || 0), 0) >= 0 ? 'text-[#4A9E6E]' : 'text-[#C96567]'}`}>
                    {formatCurrency(holdings.reduce((sum, item) => sum + (item.UnrealizedPL || 0), 0))}
                  </span>
                </div>
                <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent ${holdings.reduce((sum, item) => sum + (item.UnrealizedPL || 0), 0) >= 0 ? 'via-[#4A9E6E]' : 'via-[#C96567]'} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className={`absolute top-0 right-0 w-32 h-32 ${holdings.reduce((sum, item) => sum + (item.UnrealizedPL || 0), 0) >= 0 ? 'bg-[#4A9E6E]/5 group-hover:bg-[#4A9E6E]/10' : 'bg-[#C96567]/5 group-hover:bg-[#C96567]/10'} blur-3xl rounded-full transition-all`} />
              </div>
            </div>

            {/* KPI 3: Active Positions */}
            <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#F4A460] hover:shadow-[0_0_30px_rgba(244,164,96,0.2)]">
              <div className="p-6 relative">
                <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-2">Active Positions</h3>
                <span className="text-3xl text-[#F5F5F5] font-light tracking-tight">{holdings.length}</span>
                <span className="text-xs text-[#9A8A7A] ml-2">Assets</span>
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#F4A460] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4A460]/5 blur-3xl rounded-full group-hover:bg-[#F4A460]/10 transition-all" />
              </div>
            </div>
          </div>

          {/* Row 2: Visualization Grid (6 Responsive Sections) */}
          {holdings.length > 0 && activeTab === Tab.HOLDINGS && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

              {/* Section 1: Sector Allocation (xl:col-span-2) */}
              <div className="xl:col-span-2 group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#E88B5D] hover:shadow-[0_0_30px_rgba(232,139,93,0.2)]">
                <div className="p-6 h-[320px] flex flex-col">
                  <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-4">Sector Allocation</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#6B5D52"
                        tick={{fontSize: 10, fill: '#B8A99A'}}
                        width={80}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{fill: 'rgba(255,140,0,0.05)'}}
                        contentStyle={{backgroundColor: '#0F0F0F', borderColor: '#FF8C00', borderRadius: '8px', color: '#F5F5F5'}}
                        formatter={(val: number) => [formatCurrency(val), 'Value']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % 8]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E88B5D] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Section 2: Top Holdings */}
              <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#F4A460] hover:shadow-[0_0_30px_rgba(244,164,96,0.2)]">
                <div className="p-6 h-[320px] flex flex-col">
                  <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-4">Top Holdings</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allocationData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="Symbol"
                        type="category"
                        stroke="#6B5D52"
                        tick={{fontSize: 10, fill: '#B8A99A'}}
                        width={60}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{fill: 'rgba(255,140,0,0.05)'}}
                        contentStyle={{backgroundColor: '#0F0F0F', borderColor: '#FF8C00', borderRadius: '8px', color: '#F5F5F5'}}
                        formatter={(val: number) => [formatCurrency(val), 'Value']}
                      />
                      <Bar dataKey="MarketValue" radius={[0, 4, 4, 0]}>
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % 8]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F4A460] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Section 3: Portfolio Movers (Top Gainers/Losers from Holdings) */}
              <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#DAA520] hover:shadow-[0_0_30px_rgba(218,165,32,0.2)]">
                <div className="p-6 h-[320px] flex flex-col overflow-y-auto custom-scrollbar">
                  <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider mb-4 sticky top-0">Portfolio Movers</h3>

                  {portfolioMovers.gainers.length > 0 ? (
                    <div className="space-y-4">
                      {/* Gainers */}
                      <div>
                        <h4 className="text-[#4A9E6E] text-xs font-bold uppercase mb-3 flex items-center gap-1">
                          <span>▲</span> Top Gainers
                        </h4>
                        <div className="space-y-2">
                          {portfolioMovers.gainers.map((item, idx) => (
                            <div key={idx} className="group/movers bg-[#0F0F0F]/50 p-3 rounded-lg border-l-4 border-[#4A9E6E]/70 hover:border-[#4A9E6E] hover:bg-[#0F0F0F]/80 transition-all">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-xs text-[#F5F5F5] group-hover/movers:text-[#4A9E6E]">{item.symbol}</span>
                                <span className="text-xs text-[#4A9E6E] font-mono font-bold">+{item.changePercent.toFixed(2)}%</span>
                              </div>
                              <p className="text-[9px] text-[#9A8A7A]">{item.sector}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Losers */}
                      <div>
                        <h4 className="text-[#C96567] text-xs font-bold uppercase mb-3 flex items-center gap-1">
                          <span>▼</span> Top Losers
                        </h4>
                        <div className="space-y-2">
                          {portfolioMovers.losers.map((item, idx) => (
                            <div key={idx} className="group/movers bg-[#0F0F0F]/50 p-3 rounded-lg border-l-4 border-[#C96567]/70 hover:border-[#C96567] hover:bg-[#0F0F0F]/80 transition-all">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-xs text-[#F5F5F5] group-hover/movers:text-[#C96567]">{item.symbol}</span>
                                <span className="text-xs text-[#C96567] font-mono font-bold">{item.changePercent.toFixed(2)}%</span>
                              </div>
                              <p className="text-[9px] text-[#9A8A7A]">{item.sector}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-[#9A8A7A]">
                      <span className="text-sm">No performance data</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Section 4: AI Analysis Section (Inline Display) (xl:col-span-2) */}
              <div className="xl:col-span-2 group relative bg-gradient-to-br from-[#1A1614]/80 to-[#0F0F0F]/60 border-2 border-[#FF8C00]/30 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-[#FF8C00]/50 hover:shadow-[0_0_30px_rgba(255,140,0,0.3)]">
                <div className="p-6 h-[320px] flex flex-col">
                  <h3 className="text-[#FF8C00] text-xs font-bold uppercase tracking-wider mb-4">✨ Gemini Strategic Analysis</h3>

                  {!apiKey ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[#9A8A7A] p-4 border-2 border-dashed border-[#3A3028] rounded-lg">
                      <span className="text-2xl mb-2">🔑</span>
                      <p className="text-sm">Enter API Key above to unlock AI insights</p>
                      <p className="text-xs mt-2 text-[#9A8A7A]">Press Enter to auto-trigger analysis</p>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#FF8C00]">
                      <div className="animate-spin text-2xl mb-2">⚙️</div>
                      <p className="text-sm font-mono">Analyzing portfolio...</p>
                    </div>
                  ) : !analysis ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#9A8A7A]">
                      <span className="text-2xl mb-2">🤖</span>
                      <p className="text-sm">Ready to analyze</p>
                      <p className="text-xs mt-2">API key entered • Press Enter to trigger</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                      <div className="text-sm text-[#B8A99A] whitespace-pre-wrap leading-relaxed mb-4">
                        {analysis.substring(0, 400)}...
                      </div>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="mt-4 px-4 py-2 bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FF8C00]/30 hover:border-[#FF8C00]/60 transition-all"
                      >
                        Expand Full Report ↗
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Market News Feed */}
              <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-[#CD853F] hover:shadow-[0_0_30px_rgba(205,133,63,0.2)]">
                <div className="p-6 h-[320px] flex flex-col overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-[#9A8A7A] text-xs font-bold uppercase tracking-wider">Market News</h3>
                    {loadingNews && <span className="text-xs text-[#FF8C00] animate-pulse">Scanning...</span>}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {!apiKey ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-[#9A8A7A] p-4 border border-dashed border-[#3A3028] rounded-lg">
                        <span className="text-lg">📰</span>
                        <p className="text-xs mt-2">Market news appears here</p>
                      </div>
                    ) : !marketNews ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-10 bg-[#3A3028]/30 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <>
                        {marketNews.gainers.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="bg-[#0F0F0F]/50 p-2 rounded border-l-2 border-[#4A9E6E]/70 hover:border-[#4A9E6E] transition-colors">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-xs text-[#F5F5F5]">{item.symbol}</span>
                              <span className="text-xs text-[#4A9E6E] font-mono">{item.change}</span>
                            </div>
                            <p className="text-[9px] text-[#9A8A7A] leading-tight mt-1 line-clamp-1">{item.reason}</p>
                          </div>
                        ))}
                        {marketNews.losers.slice(0, 1).map((item, idx) => (
                          <div key={idx} className="bg-[#0F0F0F]/50 p-2 rounded border-l-2 border-[#C96567]/70 hover:border-[#C96567] transition-colors">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-xs text-[#F5F5F5]">{item.symbol}</span>
                              <span className="text-xs text-[#C96567] font-mono">{item.change}</span>
                            </div>
                            <p className="text-[9px] text-[#9A8A7A] leading-tight mt-1 line-clamp-1">{item.reason}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CD853F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

            </div>
          )}

          {/* Row 3: Enhanced Data Table with Warm Colors */}
          <div className="group relative backdrop-blur-xl bg-[#1A1614]/60 border-2 border-[#3A3028] rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-[#E88B5D] hover:shadow-[0_0_30px_rgba(232,139,93,0.15)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F0F0F]/80 text-[#9A8A7A] text-xs uppercase tracking-wider border-b border-[#3A3028]">
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Sector</th>
                    <th className="p-4 font-medium text-right">Price</th>
                    {activeTab === Tab.HOLDINGS && (
                      <>
                        <th className="p-4 font-medium text-right">Qty</th>
                        <th className="p-4 font-medium text-right hidden md:table-cell">Cost</th>
                        <th className="p-4 font-medium text-right">Value</th>
                        <th className="p-4 font-medium text-right">P&L %</th>
                      </>
                    )}
                    <th className="p-4 font-medium text-right hidden sm:table-cell">Limits</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#3A3028]/50">
                  {activeData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1A1614]/80 hover:scale-[1.01] transition-all duration-200 group/row">
                      <td className="p-4">
                        <span className="font-bold text-[#F5F5F5] group-hover/row:text-[#FF8C00] transition-colors">{item.Symbol}</span>
                      </td>
                      <td className="p-4 text-xs text-[#9A8A7A] hidden sm:table-cell">
                        {item.Sector || '-'}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-mono ${isLive ? 'text-[#F4A460]' : 'text-[#B8A99A]'}`}>
                          {formatCurrency(item.CurrentPrice)}
                        </span>
                      </td>
                      {activeTab === Tab.HOLDINGS && (
                        <>
                          <td className="p-4 text-right text-[#B8A99A] font-mono">{item.Quantity}</td>
                          <td className="p-4 text-right text-[#9A8A7A] font-mono hidden md:table-cell">{formatCurrency(item.PurchasePrice)}</td>
                          <td className="p-4 text-right text-[#F5F5F5] font-mono font-medium">{formatCurrency(item.MarketValue)}</td>
                          <td className="p-4 text-right font-mono">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              (item.UnrealizedPL || 0) >= 0
                                ? 'bg-[#4A9E6E]/10 text-[#4A9E6E] border border-[#4A9E6E]/20'
                                : 'bg-[#C96567]/10 text-[#C96567] border border-[#C96567]/20'
                            }`}>
                              {((item.UnrealizedPL || 0) / (item.CostBasis || 1) * 100).toFixed(2)}%
                            </span>
                          </td>
                        </>
                      )}
                      <td className="p-4 text-right text-xs text-[#9A8A7A] font-mono hidden sm:table-cell">
                        {formatNumber(item.HighLimit)} / {formatNumber(item.LowLimit)}
                      </td>
                    </tr>
                  ))}
                  {activeData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-[#9A8A7A] italic">
                        Empty data set. Upload a CSV to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E88B5D] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

        </div>
      </main>
    </div>
  );
};

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;