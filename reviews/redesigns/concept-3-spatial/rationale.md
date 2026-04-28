# Concept 3 — Spatial Canvas

## Design thesis
A portfolio is a *landscape*, not a list. The hero is a live, weight-sized treemap where every holding is a tile — sized by portfolio weight, colored by day P&L (toggleable to total P&L or sector), embedded with micro-sparklines. Everything else orbits as deliberate peripheral tiles. Navigation is keyboard-first via `⌘K`. Detail surfaces through a right-side **lens**, not a modal, so context is never lost.

This wins on **interaction novelty**. A capital allocator with 12+ positions sees concentration, momentum, and sector skew in a single glance — pre-attentively. Rebalancing decisions ("trim NVDA") are visible before they are spoken.

## IA novelty (vs. current dashboard)
- **Treemap-as-home** replaces the KPI-card → chart-row → table waterfall. The first thing the eye lands on is the *shape* of the portfolio, not a number you have to read.
- **Command palette is primary navigation.** Every action — jumping to a ticker, asking AI, switching color modes, filtering, uploading — is one chord away. No nested menus.
- **Lens replaces modal.** Click any tile, table row, or earnings card → right-side panel slides in with breakdown, earnings (with grounded actuals/estimates + timestamp), and tagged news. Backdrop dim, escape to close. Browsing 5 tickers is 5 clicks, not 5 modal cycles.
- **Hover provenance.** Every load-bearing number carries its source on hover (e.g. NLV → "As of 2026-04-28 14:23 ET · CSV + live sim"). Bloomberg-grade discipline, no surprises.
- **Async pills.** Gemini state ("Gemini · 4.2s", "grounded") surfaced as live status pills, never silent spinners.

## Interaction model
1. Land → see canvas. Treemap renders < 200ms after data hydrate.
2. Hover tile → gold hairline highlights, sparkline visible. Context preserved in periphery.
3. Click tile → lens opens. Detail without navigation. Esc to dismiss.
4. `⌘K` → palette. Type "tech", "concentration", "ask AI rebalance". Enter executes.
5. Color toggle changes meaning of the canvas in one click (Day / Total / Sector).

## Color & type system
- **Canvas:** `#0E0C0A` (warm-tinted near-black, not flat). Tile bg `#161310 → #1C1815`. This warmth is the visual difference between "spreadsheet" and "landscape".
- **Hairlines:** `#2A241F`. 1px, never 2. No glassmorphism, no rounded canvas — sharp, deliberate edges around the treemap (rectangular tiles with inner shadow + 1px border). Peripheral tiles are 14px-rounded for hierarchy.
- **Accent:** Gold `#E8C26A` — used for selection, command-palette highlight, focus, and never decoration. One color, one meaning.
- **Bipolar P&L gradient:** red `#7F1D1D` → neutral `#1C1815` → green `#15803D`. Not pure red/green — desaturated at extremes, near-invisible at neutral. Eye is drawn to *signal*, not noise.
- **Type:** Inter for labels (sans, neutral). JetBrains Mono for all numerics — tabular figures, tight letter-spacing. The mono/sans split is structural: prose and numbers are different cognitive loads.
- **Contrast:** body text `#EFE9E0` on `#0E0C0A` = 14.8:1. Secondary `#A89F92` = 7.1:1. WCAG AA+ throughout.

## Top 3 tradeoffs
1. **Treemap learning curve.** First-time users may not immediately know "size = weight, color = P&L". Mitigated by always-visible legend + chip controls naming the encoding ("tile size = weight · color = day p&l %"). Loss: 5–10s onboarding. Gain: minutes saved daily on portfolio scan.
2. **Command palette is power-user-first.** A non-technical user might miss `⌘K` discovery. Mitigated by always-visible search bar in header (literally a button styled as input, with `⌘K` chip). The bar IS the discovery.
3. **Lens vs. table detail density.** Lens is rich but takes 560px on the right. On 1440px displays this is fine; on 1280px it overlaps the right rail. Mitigated for now by desktop-primary scope (1440px+); tablet would collapse rail under canvas. We chose richness over universality — this is a desktop tool for an allocator at a 27" display.
