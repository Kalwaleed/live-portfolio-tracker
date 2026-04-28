# Concept 1 — Trading Desk Terminal

**Pitch:** A Bloomberg-grade workstation for a capital allocator who lives in the dashboard 8 hours a day. Information-maximalist, keyboard-first, monospace-precise. No gradients, no glass, no rounded cards — every pixel earns its place.

---

## Design thesis

The current app treats portfolio data as something to *decorate* (glassmorphism, oversized rounded cards, particle backgrounds). For a professional, decoration is friction — it pushes data off-screen and replaces signal with chrome. Concept 1 inverts: the chrome is 1px hairlines, the signal is the data, and the workspace is a multi-pane tool, not a "dashboard." The aesthetic reference is Bloomberg / TWS / TradingView Pro — but rebuilt with modern type stack and proper hierarchy so it doesn't feel like 1998.

## Layout grid

- **1440px primary**, 32px topbar + 24px ticker + 30px tab strip + 7-cell KPI strip (single row) + 3-column workspace + 22px status bar.
- Workspace columns: `250px nav | 1fr table | 320px AI/News`, with rows arranged so the holdings book is the visual anchor and earnings/concentration/sector flank it.
- Hairline grid: 1px `--line` dividers separate every pane; 1px `--line-2` for stronger boundaries. No shadows, no rounding.
- Density: 12px base font, ~6px row padding, tabular-nums everywhere. Designed to fit ~14 rows without scrolling at 1440×900.

## Color & type system

- **Palette:** near-black canvas (`#070808`/`#0c0d0d`), warm bone ink (`#e7e5dd`), terminal amber accent (`#ffb000`), green (`#3fcf8e`), red (`#ff5d5d`), violet (`#b48cff` reserved for AI). Sector pills get muted hue-coded borders only.
- **Type:** JetBrains Mono everywhere for fixed-width tabular numerics; IBM Plex Sans loaded as fallback for prose. Letter-spacing dialed up on labels (`0.18–0.22em`) for a CRT/terminal feel without using a pixel font.
- **Atmosphere:** subtle scanline overlay + amber radial glow at top — only visible if you look for it. No grain bombs.

## What's novel vs. the current dashboard

1. **Command-line at the top** (`/>` prompt + visible caret) plus `g h`, `g e`, `g a` keyboard chord hints in the status bar — the dashboard is operable without a mouse.
2. **Holdings book** with weight bars *inside* the table, 5-day inline sparklines per row, and limit-breach red/amber row indicators (NVDA flagged amber = at-limit, COIN flagged red = only loss).
3. **AI Analyst** is a structured panel — risk score (62/100), categorized findings with `[CONCENTRATION]`, `[SECTOR]`, `[CATALYST]` tags, suggested actions with explicit BUY/SELL/SET. Not a wall of paragraph text.
4. **Earnings** shows actuals vs. estimates with surprise %, status badges (BEAT/MISS/UPCOMING), and a per-row `G · N sources · timestamp` provenance stamp — honors the Gemini-grounded constraint and surfaces freshness.
5. **Treemap-style sector grid** sized by weight, P&L baked into each cell — replaces the donut chart that conveys nothing at a glance.
6. **Status bar** with live RUH/NYC clocks, FX rate, Gemini token usage, stream latency, and persistent keyboard hints.

## Top 3 tradeoffs

1. **Density vs. onboarding.** A new user will find this intimidating for ~10 minutes. Mitigation: keyboard-hint footer is always visible, command palette is persistent, tab strip uses F1–F7 affordances. Acceptable for the target persona.
2. **Monospace everywhere reads "tool, not product."** That is the point — but if the user later wants screenshots for marketing/LP decks, this concept is harder to soften. Sister concepts will offer warmer alternatives.
3. **Real-time numerics are simulated.** Live feed is a ±2% jitter and a green flash on cells; without a real WebSocket it's theatrical. Acceptable for a CSV-only product, but the moment a user wants intraday charts, this UI promises more than the data layer can deliver. Should be paired with a clear "SIMULATED / EOD" provenance pill before shipping.
