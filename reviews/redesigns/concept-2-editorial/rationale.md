# Concept 2 — Editorial Wealth Brief

## Thesis
A portfolio dashboard is almost always rendered as a cockpit. This concept argues the opposite: at this level of capital, the reader does not need more pixels of data — they need a *position*. The Brief is a private morning broadsheet, set for one reader, generated daily from their CSV and a grounded LLM. Numbers are given the dignity of pull-quotes; the AI analysis reads like a memo from a desk, not a chatbot reply; the news wire carries dateline, source, and price-tag in the margin the way a wire service does. The screen is the medium, but print is the discipline.

## Layout grid
Asymmetric 12-column on a 1440px canvas, broken intentionally:
- **Masthead** (3-col split: locale / wordmark / controls) over a Latin epigraph and Vol/No.
- **Lede band** (7/5) — magazine cover headline + a definition list of the three things that matter today.
- **KPI strip** — five vertical cells separated by hairline rules; the hero NLV figure is set 84pt in Fraunces, the rest at 38pt. No cards.
- **Section I — Ledger (8/4):** holdings table left, concentration list right, both governed by hairlines and tabular figures.
- **Section II — Sector + Memo (5/7):** donut + sector ledger + 6-month NLV line on the left; the AI memo set in *two columns of justified serif body, with drop cap, blockquote and section heads* on the right.
- **Section III — Wire + Earnings (6/6):** wire stories with dateline column; earnings calendar as a typed table with italic verdicts.
- **Section IV — Watchlist (2-col list)** + **Colophon** (3-col, italic serif, signed off with section ornaments).

## Type pairing
- **Display & body of memos:** `Fraunces` — variable axes (`opsz`, `SOFT`) tuned per use; `opsz 144` for the masthead and KPIs, `opsz 9` not invoked but available; soft-axis lifted for the wordmark to feel cast, not drawn.
- **UI sans:** `Inter Tight` (Söhne stand-in) for labels, kickers, tags, byline metadata. Set in 10–11px, 0.18–0.28em letter-spacing, all-caps where it earns it.
- **Numerals:** `JetBrains Mono` for table figures and timestamps — tabular alignment is non-negotiable for a ledger; `tnum/lnum` enabled globally.
- **Rule:** any time something is *quantified*, it is mono or Fraunces with `tnum`. Anything *editorial* is Fraunces. Anything *systemic* is Inter Tight.

## Color system
Bone (`#F4EFE6`) ground, ink (`#1A1612`) — never `#000`. Two narrative accents:
- **Oxblood (`#6E1E26`)** — kickers, pull-quotes, the "i, ii, iii" ordinals, drop caps, "disappointed" verdict. The voice of consequence.
- **Deep forest (`#1F3A2E`)** — gains and the NLV line. A green that reads like ink, not screen.
A muted gold (`#8C6B1F`) and a graphite (`#2F2A24`) round out the donut; everything else is a desaturated sand. SVG paper-grain overlay (multiply, 45%) gives the bone surface its tooth without animating anything.

## What's novel
- **The KPI strip behaves like a magazine pull-quote**, not a card row. The hero number is 84pt with optical-sized variable Fraunces; that single decision changes the temperature of the entire interface.
- **The AI analysis is a *two-column justified memo* with drop cap and blockquote** — not a chat bubble, not a card. It reads like something a private banker would slide across a table.
- **News dateline column** mimics a wire feed: timestamp, source byline, ticker price-tag in the margin. Source attribution is a first-class typographic citizen, not a footnote.
- **Earnings calendar as a typed table** with italic-serif verdicts ("cleared", "disappointed", "awaiting") instead of pill badges. Surprise % is mono, but the *judgement* is editorial.
- **Latin epigraph and Roman ordinals (i. ii. iii. for concentration)** are deliberate — they signal a register. Capital allocators read FT Weekend and Stripe Press; this dashboard knows that.

## Top three tradeoffs
1. **Density vs. dignity.** A cockpit fits more data per scroll. This concept trades scan speed for *judgement speed* — fewer numbers, weighted heavier, with prose to interpret them. Wrong call for a day-trader; right call for an allocator who looks at the book once a day.
2. **Serif on a dashboard breaks a convention.** Fraunces at scale risks reading "blog" if not tuned; we mitigate with optical-size variable axes, tabular figures, and Inter Tight wherever a number is acting as UI rather than as content. Still: a junior reader may find this slower to parse than a Geist-on-Zinc cockpit.
3. **Editorial voice in AI output is a commitment.** The memo only works if the prompt produces *prose* — paragraphs, section heads, a blockquote. That requires a stricter system prompt and more tokens than a bulleted summary, and any fallback to a list will visually break the column layout. The discipline must hold end-to-end.
