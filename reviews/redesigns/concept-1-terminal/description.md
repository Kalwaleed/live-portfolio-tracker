# Concept 1 — The Trading Desk Terminal

**One-line pitch:** A Bloomberg-grade workstation. Information-maximalist, keyboard-first, monospace-precise. No gradients, no glass, no rounded cards — every pixel earns its place.

## Design thesis

The current app *decorates* portfolio data (glass, oversized rounded cards, particles). For a professional, decoration is friction — it pushes data off-screen and replaces signal with chrome. The Terminal inverts: chrome is 1px hairlines, signal is the data, workspace is a multi-pane *tool*, not a "dashboard." Reference points: Bloomberg, Interactive Brokers TWS, TradingView Pro — but rebuilt with a modern type stack so it doesn't feel like 1998.

## Layout (1440px primary)

Stacked horizontal bands:

1. **32px topbar** — wordmark + command-line input (`/>` with visible caret) + session/RUH-NYC clocks
2. **24px scrolling ticker**
3. **30px tab strip** — F1–F7 affordances (Holdings · Earnings · News · Sectors · AI · Watchlist · Settings)
4. **7-cell KPI strip** — Net Liq, Total P&L, Day P&L, Cash %, Positions, **Beta, VaR**
5. **3-column workspace:** `250px nav | 1fr holdings book | 320px AI/News`
6. **22px status bar** — live clocks, FX, Gemini token usage, stream latency, persistent keyboard chord hints (`g h` · `g e` · `g a` · `/`)

**Density:** 12px base font, ~6px row padding, tabular-nums everywhere. Fits ~14 holdings rows without scrolling at 1440×900.

## Type system

- **JetBrains Mono everywhere** for fixed-width tabular numerics.
- **IBM Plex Sans** as fallback for prose blocks.
- Letter-spacing dialed up on labels (0.18–0.22em) for a CRT/terminal feel **without** using a pixel font.

## Color

- **Canvas:** near-black `#070808` / `#0c0d0d`
- **Ink:** warm bone `#e7e5dd` (never pure white)
- **Accents:** terminal **amber** `#FFB000`, **green** `#3FCF8E`, **red** `#FF5D5D`, **violet** `#B48CFF` reserved exclusively for AI/ML output
- **Sector pills:** muted hue-coded **borders only** (no fill — keeps the table calm)
- **Atmosphere:** subtle scanline overlay + amber radial glow at top — only visible if you look for it. No grain bombs.

## What's novel

1. **Command-line at the top** with visible caret and live keyboard-chord hints in the status bar — the dashboard is operable without a mouse (`g h` for holdings, `g e` for earnings, `/` for command).
2. **Holdings book with weight bars *inside* the table**, 5-day inline sparklines per row, and **limit-breach row indicators** (NVDA flagged amber = at-limit, COIN flagged red = only loss in book). Weight % isn't a separate chart — it's a hairline bar baked into the row.
3. **AI Analyst as a structured panel** — risk score `62/100`, categorized findings tagged `[CONCENTRATION]` `[SECTOR]` `[CATALYST]`, suggested actions with explicit `BUY` / `SELL` / `SET` verbs. Not a wall of paragraph text.
4. **Earnings table** shows actuals vs. estimates with surprise %, status badges (`BEAT` / `MISS` / `UPCOMING`), and a per-row provenance stamp `G · N sources · timestamp` — honors the Gemini-grounded constraint and surfaces data freshness.
5. **Treemap-style sector grid** sized by weight, P&L baked into each cell — replaces the donut chart, which conveys nothing at a glance.
6. **Live feed simulation** — green/red cell-flash animation every 1.6s when toggle is on; visual jitter is theatrical but deliberate.

## Tradeoffs

- **Density vs. onboarding** — a new user will find this intimidating for the first ~10 minutes. Mitigation: persistent keyboard-hint footer + command palette. Acceptable for the target persona, painful for an LP demo.
- **Monospace everywhere reads "tool, not product"** — that's the point, but harder to soften for screenshots in a marketing deck.
- **"Live" is theatrical** — without a real WebSocket, the green-flash is a ±2% jitter. Should be paired with a clear `SIMULATED / EOD` provenance pill before shipping.

## Reader posture

Eight hours a day. Working. Multi-monitor. Hands on keyboard, eyes on the book.
