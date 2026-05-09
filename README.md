<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Live Portfolio Tracker & AI Alert System

A React-based portfolio dashboard powered by Google's Gemini API. Upload a
CSV of your holdings, get a live trading-desk view with KPIs, sector
breakdowns, and AI-driven risk analysis. Built with a Bloomberg-Terminal
aesthetic and keyboard-first navigation.

**Everything runs in your browser.** Your portfolio data and API key
never leave your machine — there is no backend, no telemetry, no tracking.

---

## Features

- **CSV upload** — drop in your holdings (Symbol, Quantity, CurrentPrice,
  PurchasePrice, plus optional HighLimit / LowLimit / Sector columns).
  Saudi Tadawul tickers (e.g. `4280`) are auto-converted SAR → USD.
- **AI portfolio audit** — Gemini analyzes concentration risk, sector
  imbalance, drawdown vs. cost, and proximity to your stop-loss /
  take-profit limits. Returns a structured risk score + findings + actions.
- **AI sector classifier** — every ticker (including obscure ones) gets
  classified into one of 12 sector labels via Gemini + web search.
  Results cached in localStorage so you don't pay for the same lookups twice.
- **Live price simulator** — toggle "LIVE" for ±2% jitter every 1.6s
  (clearly tagged SIMULATED — not real market data).
- **Movers & earnings** — top gainers/losers and upcoming earnings
  reports for your symbols, via Gemini + Google Search grounding.
- **Keyboard-first UX** — F1-F7 for tabs, `g h` / `g a` chord
  navigation, `/` to focus the command bar, `?` for the full command list.

---

## Quick start

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/Kalwaleed/live-portfolio-tracker.git
cd live-portfolio-tracker
npm install
npm run dev
```

Then open <http://localhost:3000> and:

1. **Click "UPLOAD CSV"** (or use the sample at `public/sample-portfolio.csv`)
2. **Paste your Gemini API key** in the sidebar (left column, top)
3. **Click ANALYZE** to run a portfolio audit, or use `/` then type
   `analyze`, `news`, `earnings`, etc. Press `?` for the full command list.

### Get a Gemini API key

Free at <https://aistudio.google.com/apikey>. The app uses
`gemini-3.1-flash-lite` by default — generous free tier, low cost per call.

---

## API key handling — your data stays yours

There is **no default API key** bundled with this project. You must paste
your own. Once entered:

- The key is stored only in your browser's `localStorage`
  (key: `desk:apiKey`).
- It is sent only to Google's Gemini API via the official
  `@google/genai` SDK.
- It is never transmitted to any other server, never logged, never
  collected. There is no backend.
- You can wipe it any time via Settings → "FORGET KEY".

The same applies to your CSV (`desk:lastCsv`) and AI sector
classifications (`desk:sectorCache`) — all stored locally, all clearable.

---

## Architecture

The codebase is organized around small, named seams. See
[`CONTEXT.md`](./CONTEXT.md) for the full vocabulary and architecture
walkthrough. Quick map:

```
App.tsx                          orchestrator
types.ts                         RawHolding ⊂ Holding ⊂ PricedHolding
utils/                           pure data pipeline
  parseCSV.ts                      CSV → RawHolding[]
  convertCurrency.ts               USD-normalize via rules
  enrichSector.ts                  static sector map
  priceHolding.ts                  metric calculator
services/                        stateful seams
  gemini/                          one gateway, typed Result, hooks
  priceFeed/                       static + simulated price adapters
  sectorResolver/                  4-tier classifier with localStorage cache
  commandRegistry/                 keyboard + command-bar dispatch
components/terminal/             presentational UI
```

**Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts,
zod, Google Gemini API.

---

## Development

```bash
npm run dev          # dev server at localhost:3000
npm run build        # production bundle in dist/
npm run typecheck    # tsc --noEmit
npm run preview      # preview the production build
```

---

## License

MIT — see [LICENSE](./LICENSE).
