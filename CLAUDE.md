# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Live Portfolio Tracker & AI Alert System** — A React-based portfolio dashboard powered by Gemini AI. Users upload CSV portfolio data to analyze holdings, track market movements, and receive AI-driven portfolio analysis and market news updates.

**Stack**: React 19, TypeScript, Vite, Tailwind CSS, Recharts (charting), Google Gemini API

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production (dist/)
npm run preview      # Preview production build locally
```

## Architecture

### Application Flow

1. **Landing Page** (`App.tsx:115-156`)
   - File upload trigger for CSV portfolio data
   - Particle background animation
   - Routes to dashboard on successful CSV parse

2. **Dashboard** (`App.tsx:159-527`)
   - Sidebar: API key input, live price toggle, AI analysis panel
   - Main grid: KPI cards → charts → data table
   - Modal: Full AI analysis report display

### Key Features

#### 1. **CSV Parsing & Data Enrichment** (`utils/helpers.ts`)
   - Flexible CSV header mapping (handles "Qty" → "Quantity", "Price" variants)
   - Currency conversion for SAR assets (symbol '4280' → USD at 1:3.75)
   - Sector inference from ticker symbols (hardcoded mapping, defaults to 'Crypto')
   - Live price simulation (±2% random fluctuation when toggle enabled)

#### 2. **AI Integration** (`services/geminiService.ts`)
   - **Portfolio Analysis**: Deep-dive risk assessment (concentration, performance, limits)
   - **Market News**: Real-time top gainers/losers via Gemini + Google Search
   - Model: `gemini-3-flash-preview`
   - Custom prompts: Supports user-defined questions about portfolio

#### 3. **State Management** (React hooks in `App.tsx`)
   - `data[]`: Raw portfolio items from CSV
   - `processedData`: Calculated metrics (market value, P&L, cost basis)
   - `activeTab`: Toggle between HOLDINGS (Qty > 0) and WATCHLIST (Qty = 0)
   - `isLive`: Enables simulated price fluctuations
   - `analysis`: Cached AI analysis result

### Data Structures

**PortfolioItem** (`types.ts`)
```typescript
Symbol, Quantity, CurrentPrice, PurchasePrice, HighLimit, LowLimit
Date, Time, Change, Open, High, Low, Volume, TradeDate
Commission, Comment, TransactionType
// Computed:
Sector, MarketValue, CostBasis, UnrealizedPL
```

### Key Calculations (`utils/helpers.ts:47-63`)

```
MarketValue = Quantity × EffectivePrice
CostBasis = Quantity × PurchasePrice
UnrealizedPL = MarketValue - CostBasis
EffectivePrice = CurrentPrice × (1 + liveMultiplier) when isLive=true
```

## UI Components & Layout

### Glass-Morphism Theme
- Dark background (#050505, #0A0A0A)
- Backdrop blur + semi-transparent backgrounds
- Accent colors: Blue, Amber, Green (gains), Rose (losses)

### Component Areas
| Section | Purpose | Conditional |
|---------|---------|------------|
| Sidebar | Settings, API key, analysis input | md: breakpoint |
| KPI Cards | Net Liquidation Value, P&L, Position count | Always visible |
| Charts (3) | Sector, Asset allocation, Market news | Holdings only |
| Data Table | Holdings/Watchlist rows | Always visible |
| Modal | Full AI analysis report | Expandable |

### Responsive Breakpoints
- Mobile: Charts hidden, sidebar hidden
- md (768px): Sidebar visible, single-column charts
- lg (1024px): 3-column chart layout

## Environment & Configuration

**Required**: `GEMINI_API_KEY` in `.env.local`
```
GEMINI_API_KEY=your_key_here
```

**Vite Config** (`vite.config.ts`)
- Port: 3000
- Host: 0.0.0.0
- React plugin enabled
- Path alias: `@/*` → root directory
- Environment variable injection at build time

## Common Development Tasks

### Adding a New Chart
1. Create derived data from `holdings` or `processedData` using `useMemo()`
2. Import from `recharts` (BarChart, LineChart, PieChart, etc.)
3. Add as new grid item in Row 2 section
4. Style with `glassCard` class

### Modifying CSV Headers
1. Update `parseCSV()` in `utils/helpers.ts` line 88-116
2. Add header variations to `floatFields` or `intFields` as needed
3. Map custom headers to `PortfolioItem` keys using the if/else chain (lines 109-115)

### Changing Sector Mappings
1. Update `deriveSector()` map in `utils/helpers.ts` line 26-42
2. Add new ticker → sector pairs to the record
3. Default sector changes on line 41

### Customizing AI Prompts
1. Edit `analyzePortfolio()` or `fetchMarketNews()` in `services/geminiService.ts`
2. Adjust `finalPrompt` or `prompt` variables
3. Consider token efficiency (data is pre-summarized on line 10-18)

### Handling New Price Data Format
1. Check `parseCSV()` header mapping first
2. If format unrecognized, update parsing logic in lines 80-106
3. Test with `generateMockData()` to verify calculations

## Important Implementation Details

### Live Price Simulation
- Enabled via "REAL-TIME FEED" toggle in sidebar
- Applies ±2% random fluctuation to all prices (line 49)
- Affects all calculations downstream (MarketValue, UnrealizedPL)
- **Note**: Not actual live market data; recalculated on each render

### API Key Handling
- Stored in component state (not persisted)
- Required for both Gemini analysis and market news fetch
- Password field for security (line 198)
- Required for analyze button (line 228)

### Modal Overlay
- Auto-opens after analysis completion (line 104)
- Click backdrop or [ESC] button to close
- "Report Ready" docked card shows in sidebar if analysis cached (lines 242-255)

### Empty State Handling
- CSV parse fails gracefully (alert message)
- Watchlist: Shows no data if all holdings have Qty > 0
- Market news: Shows loading skeletons while fetching
- Charts hidden if holdings.length = 0

## Performance Considerations

### Memoization
- `processedData`: Recalculates on data or isLive change
- `allocationData`: Top 10 holdings sorted by market value
- `sectorData`: Aggregated sector totals

### Data Efficiency
- CSV data simplified before Gemini (10-18 fields reduced to 7)
- Market news cached after fetch (won't re-request on rerender)
- Images/particles: CSS animations, no canvas performance cost

## Type Safety

- Full TypeScript enabled (`noEmit: true`)
- Interfaces: `PortfolioItem`, `AnalysisResponse`, `MarketNewsResponse`, `Tab` enum
- React.FC for all components
- useMemo/useCallback for performance

## Git & Deployment Notes

- `dist/` folder created by `npm run build`
- `.env.local` should NOT be committed (contains API key)
- Referenced in AI Studio: https://ai.studio/apps/drive/1AkWI_LnjidyUo8T63hMyoO0eAL_BbBUy
