# Concept 2 — The Editorial Brief

**One-line pitch:** A private morning broadsheet for the considered allocator. Numbers given the dignity of pull-quotes; AI analysis typeset like a memo from a desk.

## Design thesis

At this level of capital, the reader does not need more pixels of data — they need a *position*. The Brief argues that a dashboard's job is to deliver judgement, not telemetry. The screen is the medium, but **print is the discipline**. Reference points: Stripe Press, FT Weekend, Bloomberg Magazine.

## Layout (1440px canvas, asymmetric 12-col)

- **Masthead** — 3-col split: locale / wordmark / controls, over a Latin epigraph and Vol/No.
- **Lede band (7/5)** — magazine-cover headline + a definition list of "the three things that matter today."
- **KPI strip** — 5 vertical cells separated by hairline rules. Hero NLV figure set at **84pt Fraunces**; supporting metrics at 38pt. No cards.
- **Section I — Ledger (8/4)** — holdings table left, concentration list right (Roman ordinals i. ii. iii.).
- **Section II — Sector + Memo (5/7)** — donut + sector ledger + 6-month NLV line on the left; **AI memo set in two columns of justified serif body, with drop cap and blockquote** on the right.
- **Section III — Wire + Earnings (6/6)** — wire stories with dateline column; earnings calendar as a typed table with italic verdicts ("cleared", "disappointed", "awaiting").
- **Section IV** — watchlist + colophon (italic serif, signed off with section ornaments).

## Type system

- **Display & memo body:** **Fraunces** (variable, optical-size axis tuned per use; opsz 144 for masthead/KPIs).
- **UI labels & metadata:** **Inter Tight** at 10–11px with 0.18–0.28em tracking, all-caps where it earns it.
- **All numerals:** **JetBrains Mono** with `tnum/lnum` enabled — tabular alignment is non-negotiable for a ledger.
- **Rule:** quantified = mono or Fraunces tnum. Editorial = Fraunces. Systemic UI = Inter Tight.

## Color

- **Bone** `#F4EFE6` ground, **ink** `#1A1612` (never pure black).
- **Oxblood** `#6E1E26` — kickers, pull-quotes, drop caps, the "disappointed" verdict. The voice of consequence.
- **Deep forest** `#1F3A2E` — gains and the NLV line. A green that reads like ink, not screen.
- Muted **gold** and **graphite** round out the donut. SVG paper-grain overlay (multiply, 45%) gives the bone surface its tooth.

## What's novel

1. **KPI strip behaves like a magazine pull-quote**, not a card row — 84pt hero number changes the temperature of the entire interface.
2. **AI analysis as a two-column justified memo** with drop cap — reads like something a private banker would slide across a table.
3. **News dateline column** mimics a wire feed — timestamp, source byline, ticker price-tag in the margin.
4. **Earnings as a typed table** — surprise % is mono, but the *judgement* is editorial-italic.
5. **Latin epigraph + Roman ordinals** signal a register. Capital allocators read FT Weekend; this dashboard knows that.

## Tradeoffs

- **Density vs. dignity** — fewer numbers, weighted heavier, with prose to interpret them. Wrong for a day-trader; right for an allocator who looks at the book once a day.
- **Serif on a dashboard breaks convention** — risks reading "blog" if Fraunces isn't tuned with optical-size axes.
- **Editorial AI output requires a stricter system prompt** — any fallback to a bullet list will break the column layout.

## Reader posture

Once a day. Considered. The book opened with coffee. A position taken, not a screen monitored.
