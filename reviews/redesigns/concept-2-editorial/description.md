# Concept 2 — The Editorial Brief

> A detailed specification of the design, written so that an engineer or model can recreate the entire dashboard from this document alone. Read the whole spec before building. Where this conflicts with personal taste, follow the spec — every choice is load-bearing.

---

## 1 · Thesis & posture

Build a portfolio dashboard for one reader, generated daily, that resembles a **private morning broadsheet** rather than a cockpit. The reader is a capital allocator who values *judgement over telemetry*. The dashboard reads like:

- 70% *Financial Times* Weekend / FT Money
- 20% Stripe Press / Apple Annual Report
- 10% the morning brief a private banker would slide across a desk

The discipline is **print, translated to screen**. Numbers are given the dignity of pull-quotes. AI analysis is typeset as a memorandum, not a chat bubble. News reads like a wire service. Earnings verdicts are written in italic ("cleared", "disappointed", "awaiting"), not stamped with badges.

**Posture:** opened once a day with coffee. A position taken, not a screen monitored. If a day-trader would prefer this, you've designed it wrong.

**The single non-negotiable:** every typographic decision must be defensible. If a designer at Stripe or Linear opened this, they should be able to point to any element and have you justify the size, weight, tracking, and color.

---

## 2 · Page geometry

| Property | Value |
|---|---|
| Primary breakpoint | **1440px desktop** (no mobile) |
| Max content width | **1440px**, centered |
| Outer padding | **28px top, 56px sides, 96px bottom** |
| Vertical rhythm | Section-to-section margin: **56px**. Section title to first row: **24px**. Row internal gap: **56px**. |
| Grid system | **12-col asymmetric**, broken intentionally per section. No global gutter — each section declares its own grid. |

Specific row ratios used (each is a `display: grid` with 56px gap):

- **Lede band:** `grid-template-columns: 7fr 5fr` (Letter from the Desk : Summary definition list)
- **Row 1 — Ledger:** `grid-template-columns: 8fr 4fr` (Holdings table : Concentration column)
- **Row 2 — Sector + Memo:** `grid-template-columns: 5fr 7fr` (Sector + 6mo line : Two-column AI memo)
- **Row 3 — Wire + Earnings:** `grid-template-columns: 6fr 6fr` (Wire feed : Earnings calendar)
- **KPI strip:** `grid-template-columns: 2.4fr 1fr 1fr 1fr 1fr` (hero NLV cell wider, four supporting cells equal)

---

## 3 · Color system

Always use CSS custom properties. No raw hex in component code.

```css
:root {
  --bone:       #F4EFE6;  /* ground / page background */
  --bone-2:     #EAE3D6;  /* memo background, subtle elevation */
  --bone-3:     #DCD3C0;  /* track of weight bars */
  --rule:       #C7BBA3;  /* 0.5px hairline rules between rows */
  --ink:        #1A1612;  /* primary text, never #000 */
  --ink-2:      #2F2A24;  /* body copy, slightly softened ink */
  --ink-soft:   #5C544A;  /* secondary metadata */
  --muted:      #8A8175;  /* labels, kickers, captions */
  --oxblood:    #6E1E26;  /* the voice of consequence — kickers, drop caps, Roman ordinals, "disappointed" verdict, source links */
  --forest:     #1F3A2E;  /* gains — a green that reads like ink, not like a screen */
  --gold:       #8C6B1F;  /* accent in donut palette only */
  --rose-fade:  #B8434F;  /* secondary loss — for nuance, used sparingly */
  --green-fade: #2F6A4F;  /* secondary gain — pulse dot, "Connected" status */
}
```

### Rules
- **Never use `#000`** — `var(--ink)` (`#1A1612`) is the floor. Anything blacker reads as screen, not paper.
- **Never use a pure-saturation green or red.** Gains are forest-green; losses are oxblood. Both are desaturated to read as printed ink, not LED.
- **Oxblood is reserved for editorial weight** — the kicker, the pull-quote, the drop cap, the Roman numerals (i. ii. iii.), the "disappointed" verdict, the source-link underline. Never use it for general body text.
- **Donut palette** uses 7 hues in this exact order: `forest, oxblood, gold, ink-2, ink-soft, muted, rule`. The hierarchy is intentional — Tech gets forest (the largest, most "alive" color), then weight cascades through editorial neutrals. Do not introduce a blue, never use a saturated red.
- **No gradients except** the 6-month NLV chart fill (forest at 18% → forest at 0%, top-to-bottom). Everything else is flat.

---

## 4 · Typography

Three families, three roles. Strict.

```css
--serif: "Fraunces", "GT Sectra", "Tiempos Headline", Georgia, serif;
--sans:  "Inter Tight", "Söhne", "Untitled Sans", -apple-system, system-ui, sans-serif;
--mono:  "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
```

Load via Google Fonts:
```
Fraunces:opsz,wght,SOFT@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800
Inter Tight:wght@300;400;500;600;700
JetBrains Mono:wght@400;500
```

**Variable-axis usage (Fraunces):** when font is set at display sizes, set `font-variation-settings: "opsz" 144, "SOFT" 30–50;`. Lower SOFT for the masthead (30, more cast), higher for the lede headline (50, slightly warmer).

**Global feature settings on body:** `font-feature-settings: "ss01", "ss02", "cv11", "tnum";` — stylistic sets activate Fraunces' alternate apertures; `tnum` ensures tabular figures across the document.

### The rule
Anything **quantified** is mono or Fraunces with `tnum` enabled.
Anything **editorial** is Fraunces.
Anything **systemic UI** (labels, kickers, byline metadata, button text) is Inter Tight.

### Type ramp (exact)

| Element | Family | Weight | Size | Line-height | Tracking | Notes |
|---|---|---|---|---|---|---|
| Masthead title `The Brief` | Serif | 600 (em italic 400) | **56px** | 0.88 | -0.02em | `opsz 144, SOFT 30` |
| Lede h1 | Serif | 500 (em italic 400) | **76px** | 0.94 | -0.022em | `opsz 144, SOFT 50`; em italic in oxblood |
| Lede deck | Serif | 300, italic | 19px | 1.45 | — | max-width 56ch, ink-2 |
| KPI hero value (NLV) | Serif | 400 | **84px** | 1 | -0.02em | `tnum lnum`, ink |
| KPI value (other) | Serif | 400 | 38px | 1 | -0.02em | `tnum lnum` |
| KPI label | Sans | 400 | 10px | — | 0.22em uppercase | muted |
| KPI sub | Mono | 400 | 11px | — | 0.04em | ink-soft, with pos/neg span color |
| Section name (`Section I — The Ledger`) | Serif | 500 (em italic 400) | 28px | — | -0.01em | ink |
| Section ordinal (I. II. III. IV.) | Serif | 400, italic | 14px | — | — | oxblood |
| Section meta (right side) | Sans | 400 | 10px | — | 0.22em uppercase | muted |
| Block title (h3) | Serif | 500 (em italic 400) | 21px | — | -0.01em | ink |
| Block deck | Serif | 400, italic | 14px | — | — | ink-soft, max 50ch |
| Table column header | Sans | 500 | 10px | — | 0.22em uppercase | muted, border-bottom 1px ink |
| Table body text | Sans | 400 | 13px | 1.55 | — | ink-2 |
| Table numerics | Mono | 400 | 12.5px | — | — | ink-2, right-aligned, `tnum` |
| Ticker symbol (`sym`) | Serif | 500 | 17px | — | -0.01em | ink |
| Issuer name (under symbol) | Sans | 400 | 11px | — | 0.04em | muted |
| Sector tag pill text | Sans | 400 | 10px | — | 0.18em uppercase | ink-soft |
| Concentration ordinal (i. ii. iii.) | Serif | 300, italic | 14px | — | — | oxblood |
| Concentration label | Serif | 400 | 17px | — | — | ink |
| Concentration small (sector under name) | Sans | 400 | 10px | — | 0.18em uppercase | muted |
| Memo title (h2) | Serif | 500 (em italic 400) | **30px** | — | -0.01em | ink |
| Memo body p | Serif | 400 | **15.5px** | **1.62** | — | ink-2, **`text-align: justify; hyphens: auto`** |
| Memo body **first ::first-letter** | Serif | 500 | **56px** | 0.85 | — | oxblood, `float: left`, padding `6px 10px 0 0` |
| Memo h4 (subsection) | Sans | 400 | 10px | — | 0.24em uppercase | ink, `break-after: avoid` |
| Memo blockquote | Serif | 400, italic | 19px | 1.4 | — | ink, opens with `\201C` (curly quote) at 38px line-height 0 in oxblood, `break-inside: avoid`. Top + bottom 0.5px ink rules. |
| Memo `Memorandum` stamp | Sans | 400 | 9.5px | — | 0.28em uppercase | oxblood, 0.5px oxblood border, padding `4px 8px` |
| Wire dateline (stamp) | Mono | 400 | 11px | 1.4 | 0.04em | muted, two-line: `28 Apr 2026<br/>14:48 EDT` |
| Wire source (under dateline) | Sans | 400 | 9px | — | 0.24em uppercase | oxblood, margin-top 6px |
| Wire headline (h5) | Serif | 500 | 19px | 1.2 | -0.01em | ink |
| Wire body p | Serif | 400 | 14px | 1.5 | — | ink-2, max 70ch |
| Wire ticker tag (`NVDA · +2.4%`) | Sans | 400 | 10px | — | 0.18em uppercase | up: forest; down: oxblood; flat: ink-soft |
| Earnings date | Serif | 400, italic | 16px | — | — | oxblood |
| Earnings issuer name | Serif | 400 | 17px | — | — | ink, with `<small>` ticker · timing in sans 10/0.18em uppercase muted |
| Earnings numerics | Mono | 400 | 13px | — | — | tabular-nums, right-aligned |
| Earnings verdict | Serif | 400, italic | 14px | — | — | pos: forest; neg: oxblood; pending: muted in sans 10/0.2em uppercase |
| Earnings `pending` cell | Sans | 400 | 10px | — | 0.2em uppercase | muted |
| Source line (under wire/earnings) | Sans | 400 | 10px | — | 0.18em uppercase | muted; hyperlinks oxblood with 0.5px oxblood underline |
| Watchlist symbol | Serif | 400 | 17px | — | — | ink |
| Watchlist price | Mono | 400 | 13px | — | — | ink |
| Watchlist change | Mono | 400 | 12px | — | — | pos/neg colored |
| Colophon strong (heading) | Sans | 500 | 10px | — | 0.24em uppercase | ink |
| Colophon body | Serif | 400, italic | 13px | — | — | ink-soft |
| Footnote | Serif | 400, italic | 12px | — | — | ink-soft |
| Section ornament (§ § §) | Serif | 400, italic | 18px | — | 0.4em | ink-soft, centered, margin-top 24px |

### Em italic rule
Across **every** Fraunces headline (masthead, lede, section names, block titles, memo title), the **`<em>` is set in italic at one weight lighter than the surrounding word**. Example: in the lede h1, `font-weight: 500`; the em is `font-weight: 400, font-style: italic, color: var(--oxblood)`. This is the single most distinctive typographic gesture in the design — preserve it exactly.

---

## 5 · Texture & atmosphere

### Paper grain (the only "background")
Apply globally via `body::before`:

```css
body::before {
  content: "";
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 100;
  opacity: 0.45;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

Inline SVG, no asset. Multiply blend at 45% opacity gives the bone surface a subtle tooth without animation. Do not animate the grain — it must read as paper, not video.

### Hairlines
- **2px solid `var(--ink)`** — masthead top, masthead bottom rule under wordmark (only here), section name underline (`border-bottom: 1px solid var(--ink)` for sections, but the masthead gets the heavier 2px). Use 2px **only** in the masthead and the colophon top rule.
- **1px solid `var(--ink)`** — under section names (sec component), under KPI strip, under lede band, table column-header underline, memo head underline, memo blockquote top + bottom rules, prompt-row top rule.
- **0.5px solid `var(--rule)`** — every other dividing line in the document (table rows, concentration rows, sector list rows, wire items, earnings rows, watchlist rows, submast bottom).
- **0.5px dotted `var(--rule)`** — the API key field's underline only.

The **0.5px hairline** is the dominant horizontal element in the design. Browsers may round to 1px on non-Retina screens; that is acceptable. Do not substitute solid 1px — the lightness is intentional.

### Live-quote pill (the only animated element on screen)
Top-right of masthead. A 6px circle (`var(--green-fade)`) inside a bordered button. Animate `opacity` between 1 and 0.35 over 2.4s ease-in-out infinite. Class `breathe`. When toggled off (`.off` class on the pill), the dot becomes `var(--muted)` and animation removed; label text changes from `Live Quotes — Streaming` to `Live Quotes — Paused`. JS uses `textContent` only — never `innerHTML`.

No other animations. No hover scale. No spring physics. The page should feel **still**.

---

## 6 · Section-by-section specification

The page is built top-to-bottom in this order. Each section is rigid in structure but uses the asymmetric grids above.

### 6.1 Masthead

```
[ left meta ]    The Brief    [ right controls ]
                  ↑
        the wordmark, em italic
```

**Wrapper:** `border-top: 2px solid ink; border-bottom: 1px solid ink; padding: 14px 0 10px;`

**Grid:** `1fr auto 1fr` with `gap: 32px`, `align-items: end`.

- **Left:** two spans, `gap: 18px`, in sans 11px / 0.16em uppercase / ink-soft. Content: `Riyadh · New York` and the day of the week (e.g. `Tuesday`). The two metropoles are intentional — they fix the desk geographically.
- **Center title:** `<h1 class="title">The <em>Brief</em></h1>`. Fraunces 600, 56px, line-height 0.88, letter-spacing -0.02em, `opsz 144 SOFT 30`. The `<em>` is italic 400. **Centered.**
- **Right:** `display: flex; gap: 18px; justify-content: flex-end; align-items: baseline`.
  - **`Upload Ledger CSV →`** button: sans 10px / 0.22em uppercase / ink, 0.5px ink border, padding 6px 14px, transparent background, hover inverts (background ink, color bone).
  - **Live Quotes pill:** see §5 above.

### 6.2 Submast (the sentence under the wordmark)

```
[ Latin epigraph (italic) ]  [ Vol VII · No. 112 · April 28, 2026 · Edition Morning ]  [ Prepared for PK / KBW Ventures ]
```

**Grid:** `1fr auto 1fr`, `gap: 24px`, `padding: 8px 0 14px`, `border-bottom: 0.5px solid rule`.

- **Latin epigraph:** Fraunces 300 italic, 13px, ink-soft. Default text: *Patientia opes parit — patience begets capital.* This is non-negotiable register-setting copy. Other appropriate epigraphs: *Pecunia non olet*, *Festina lente*. Always Latin, always italic, always with English gloss after the em-dash.
- **Vol/No/Date/Edition:** sans 10.5px / 0.22em uppercase / ink-soft, **but** `Vol`, `No.`, the date, and `Edition` words are sans/uppercase, and **the values themselves** (`VII`, `112`, `April 28, 2026`, `Morning`) are wrapped in `<em>` and rendered as **Fraunces italic, no letter-spacing, ink, mixed-case**. This typographic alternation is the second most distinctive gesture in the design.
- **Edition (right):** sans 11px / 0.14em uppercase / ink-soft. The reader's name is wrapped in a span at `color: ink, font-weight: 500`. Default copy: `Prepared for PK / KBW Ventures`.

### 6.3 Lede band — the Letter from the Desk

**Grid:** `7fr 5fr`, gap 56px, padding `36px 0 28px`, `border-bottom: 1px solid ink`.

#### Left column (7fr): the lede

1. **Kicker:** sans 10px / 0.28em uppercase / oxblood, prefixed with `§ ` (section sign, also oxblood). Default: `Letter from the Desk — Equities & Digital Assets`.
2. **Headline (h1):** Fraunces 500, 76px, line-height 0.94, tracking -0.022em, `opsz 144 SOFT 50`. The em is italic 400 in oxblood. Default: `A quiet quarter, with <em>two loud holdings</em> doing most of the work.`
3. **Deck:** Fraunces 300 italic, 19px, line-height 1.45, ink-2, max-width 56ch. A 2-3 sentence summary of the day's portfolio story. Should always name the *one or two* facts that matter.
4. **Byline:** sans 11px / 0.16em uppercase / ink-soft. Format: `By <span style="color:ink; font-weight:500;">The Brief Desk</span> · Closing marks April 28, 2026 · 16:02 EDT`. The author span is the only ink-colored text in the byline; everything else is ink-soft.

#### Right column (5fr): the summary `<dl>`

A definition list with `border-left: 0.5px solid rule; padding-left: 32px`.

- **`<dt>`:** sans 10px / 0.22em uppercase / muted, margin-bottom 4px. Three terms exactly: `Net Liquidation`, `Disposition`, `What we will be reading`.
- **`<dd>`:** Fraunces 400, 15px, line-height 1.5, ink-2, margin-bottom 18px. One sentence per dd. Numbers and tickers wrap in `<em>` (Fraunces italic 400 in oxblood). Example: `The book closes at <em>$24.71M</em>, marked at vendor consensus and adjusted for SAR cross.`

These three terms can be rotated daily but the structure and tone is fixed. Always three. Always one-sentence each. Always with one or two italicized oxblood inserts.

### 6.4 KPI strip — the headline figures

**Grid:** `2.4fr 1fr 1fr 1fr 1fr`, gap 0, padding-top 28px, `border-bottom: 1px solid ink`.

Five cells. Each cell:
- `padding: 12px 28px 28px 0` (first cell), `padding-left: 28px` (cells 2+).
- `border-right: 0.5px solid rule` (last cell removes border-right).
- Three stacked elements: **label**, **value**, **sub**.
  - Label: sans 10px / 0.22em uppercase / muted, margin-bottom 14px.
  - Value: Fraunces 400, **84px for the hero cell**, **38px for the rest**, line-height 1, tracking -0.02em, `tnum lnum`, `opsz 144 SOFT 0`. Sign-coloring with `.pos` (forest) / `.neg` (oxblood) classes.
  - Sub: mono 11px / 0.04em / ink-soft, margin-top 10px, with embedded `<span class="pos|neg">` for the percentage.

**The five labels and default content:**
| # | Label | Value | Sub | Class |
|---|---|---|---|---|
| 1 (hero) | `Net Liquidation Value · USD` | `$24,712,408` | `Cost basis $19,847,120 · Unrealised <span class="pos">+24.51%</span>` | hero |
| 2 | `Total P&L` | `+$4.86M` | `+24.51% lifetime` (forest) | pos |
| 3 | `Day P&L` | `−$71,294` | `−0.29% session` (oxblood) | neg |
| 4 | `Cash Weight` | `3.4<span style="font-size:0.55em; color:ink-soft;">%</span>` | `$840,116 dry` | — |
| 5 | `Positions` | `12` | `12 held · 4 watched` | — |

The **`%` sign in the Cash Weight cell is rendered at 55% the value's font-size, in ink-soft.** This is intentional — percentage glyphs at 38pt feel disproportionate; demoting them recovers the magazine cadence.

### 6.5 Section header (`<div class="sec">`)

This component appears four times in the document — once before each numbered section.

**Grid:** `auto 1fr auto`, gap 18px, align-items: end, `border-bottom: 1px solid ink`, padding-bottom 10px, margin-bottom 24px, margin-top 56px.

- **Roman ordinal (left):** Fraunces italic 400, 14px, oxblood. `I.`, `II.`, `III.`, `IV.`. **Always Roman, always with trailing period, always oxblood.**
- **Section name (center, fluid):** Fraunces 500, 28px, tracking -0.01em, ink. The em is italic 400. Examples:
  - `The <em>Ledger</em> — Holdings of Record`
  - `Sectoral <em>Exposure</em> & the Analyst's Brief`
  - `The <em>Wire</em> & the Earnings Calendar`
  - `The <em>Watchlist</em> — names not yet owned`
- **Section meta (right):** sans 10px / 0.22em uppercase / muted. A status line. Examples: `12 positions · sorted by weight`, `Gemini 3.0 · grounded, dated, sourced`.

### 6.6 Section I — The Ledger

Two columns: the holdings table (8fr) and the Concentration column (4fr).

#### 6.6.1 The Ledger table

A clean printed table. No zebra striping. No row dividers heavier than 0.5px.

**Header row:**
- Background transparent, `border-bottom: 1px solid ink`, padding `10px 12px`.
- Headers: `Security`, `Sector`, `Qty`, `Avg. Cost`, `Last`, `Day %`, `Mkt. Value`, `Weight`, `Unrealised P&L`.
- Headers in sans 500, 10px / 0.22em uppercase / muted. Numeric columns get `.num` class for `text-align: right`.

**Body rows:**
- `border-bottom: 0.5px solid rule`.
- `padding: 14px 12px`, `vertical-align: baseline`.
- **Security cell:** two-tier — `<span class="sym">` is Fraunces 500 / 17px / -0.01em / ink, displayed as block. Below it, `<span class="name">` is sans 400 / 11px / 0.04em / muted, margin-top 2px. Example: `NVDA` over `NVIDIA Corp.`, `2222.SR` over `Saudi Aramco · Tadawul`, `BTC` over `Bitcoin`.
- **Sector cell:** sans 400 / 10px / 0.18em uppercase / ink-soft. No background, no border. Just text — read as a tag, not a pill.
- **Numeric cells:** mono 12.5px, ink-2, right-aligned, `font-variant-numeric: tabular-nums`.
- **Day % cell:** mono 12.5px, sign-colored with `pos` (forest) or `neg` (oxblood).
- **Weight cell:** the percentage is in mono inline; **immediately to its right** is a `<span class="weight-bar">` — a 64px × 2px ink-on-bone-3 bar, filled proportionally. The largest holding gets `width: 100%`; smaller holdings get the relative proportion (e.g. a holding at 14% in a portfolio whose top is 25.6% gets `54.7%` of bar width). The bar is `display: inline-block; vertical-align: middle; margin-left: 10px`. The fill (`.weight-bar > span`) is solid `var(--ink)`.
- **Unrealised P&L cell:** the dollar figure on the first line in mono / forest (or oxblood), and **a <small> beneath in mono 10px / ink-soft** showing the lifetime % return. Two pieces of information stacked vertically in one numeric cell. This is critical to the "weight" of the table.
- **Hover:** rows get `background: rgba(199,187,163,0.18)` — a subtle bone-tinted hover, never a full block.

**Footer row (`<tfoot>`):**
- Spans columns 1–6 with an italic Fraunces note: `Marks reflect last vendor print; figures rounded to nearest cent.` (13px, italic, ink-soft, padding-top 18px).
- Last three cells (Mkt Value, Weight, Unrealised P&L) get the totals (`$24,721,850`, `100.0%`, `+$9,428,809`), in the same mono style as body cells but ink-colored, padding-top 18px. **Total P&L is forest.**

**Row count:** show all rows. No pagination. The top-12 fits at 1440px without scroll. If the book is larger, accept the page-length growth — this is a daily document, not a stream.

#### 6.6.2 Where the weight sits — the Concentration block

Right column of Section I.

- **Title (h3):** Fraunces 500 / 21px / -0.01em / ink. `Where the <em>weight</em> sits`.
- **Deck:** Fraunces 400 italic / 14px / ink-soft / max 50ch. Example: `Top five names account for sixty-eight percent of book value. Read this column the way a banker reads exposure.`
- **Concentration list (`<div class="conc">`):** Five rows max. Each row uses a 2-row grid: `28px 1fr auto` columns, two rows. Row 1 holds the ordinal, label, percentage; row 2 holds a thin progress bar spanning columns 2-4.
  - **Ordinal:** Fraunces italic 300 / 14px / oxblood. `i.`, `ii.`, `iii.`, `iv.`, `v.` (lowercase Roman, always with trailing period, always italic, always oxblood). **Lowercase Roman is intentional** — uppercase would be too declarative for a sub-list.
  - **Label:** Fraunces 400 / 17px / ink. The ticker. Followed by `<small>` in sans 400 / 10px / 0.18em uppercase / muted, with `margin-left: 8px`. Example: `NVDA<small>Technology</small>`.
  - **Percentage:** mono 13px / ink. Right-aligned in column 3.
  - **Bar:** 1.5px tall, `bone-3` track, ink fill, scaled relative to the largest holding (so the top entry is at 98%, not 100% — the bar should never *quite* touch the right edge, for typographic breathing room).
- **Footnote:** Fraunces italic 12px / ink-soft. A sentence that translates the abstraction into a concrete dollar number. Example: `A single 1% move in NVDA equates to roughly $63,300 of book P&L — more than the next three names combined.` Always math the reader can verify.

### 6.7 Section II — Sector + Memo

Two columns: a sector visualization left (5fr), and a two-column AI memo right (7fr).

#### 6.7.1 Sector composition (left)

- **Title:** `Composition by <em>sector</em>` (h3 style).
- **Deck:** italic skepticism. Example: `Read with skepticism — sector tags collapse a 12-name universe into seven buckets.` This is a feature: the design is *self-aware* about the limits of its categorization.
- **Donut + legend grid (`.sector-grid`):** `grid-template-columns: 1fr 1fr; gap: 32px`.
  - **Donut SVG:** 200×200 viewBox, drawn with seven concentric circular `stroke-dasharray` segments at radius 78, stroke-width 22. Center-text: `SECTORS` in Fraunces 500 / 11px / 2px tracking / muted (label) above `seven` in Fraunces italic 22px / ink (count). The count word is spelled out in italic — `seven`, `six`, `eight` — never numerals. Stroke colors in this exact order: `#1F3A2E, #6E1E26, #8C6B1F, #2F2A24, #5C544A, #8A8175, #C7BBA3` (forest, oxblood, gold, ink-2, ink-soft, muted, rule).
  - **Sector list:** Each row has a 4-col grid: `12px 1fr auto auto; gap: 12px`. A `swatch` (10×10 square — never a circle, never rounded) using the same color as the donut segment, the sector name in Fraunces 400 / 15px / ink, the percentage in mono 12px / ink-soft (width 56px right-aligned), and the dollar value in mono 12px / ink (width 100px right-aligned). Border-bottom 0.5px rule per row.
- **6-month NLV line chart:** below the sector grid, margin-top 32px.
  - **Caption row:** flex space-between, baseline-aligned. Left: `Net Liquidation · Trailing 6 months` in sans 10px / 0.22em uppercase / muted. Right: `19.85M → 24.71M` in mono 11px / ink-soft. **Always show start → end values, no axis.**
  - **SVG chart:** 600×140 viewBox, `preserveAspectRatio="none"` (stretches to container width). Three horizontal dashed reference lines at y=35, 70, 105, stroke `rule` color, `stroke-dasharray="1 4"`, 0.5px width. The line itself is a `<path>` with stroke-width 1.4 in forest. Below it, a fill area with a `<linearGradient>` from forest at 0.18 opacity (top) to forest at 0 opacity (bottom).
  - **Annotations:** mark exactly two points. (1) An event annotation mid-chart: a 2.4px oxblood circle on the line at the event date, a vertical 0.5px oxblood dashed line up to a Fraunces italic 11px label in oxblood (e.g. `Feb 14 · NVDA earnings`). (2) The current end-point: a 3px forest circle on the right edge with a mono 10px label in forest above it showing the current NLV (`24.71M`, text-anchor end).
  - **Month axis (below chart):** flex space-between, mono 10px / muted. `Nov '25 · Dec · Jan '26 · Feb · Mar · Apr 28`. Six labels — first and last are the boundaries, middle four are month names.

#### 6.7.2 The Analyst's Memo (right column — the design's centerpiece)

The single most important component. Get this wrong and the design fails.

**Container (`<article class="memo">`):**
- `background: var(--bone-2)` — slightly darker than page, gives memo a "card on the desk" feeling without using a card metaphor.
- `padding: 36px 40px 32px`.
- `border-top: 2px solid ink; border-bottom: 0.5px solid rule`.
- **`column-count: 2; column-gap: 40px; column-rule: 0.5px solid rule;`** — this is the key trick. The memo body flows as a two-column justified text run, with a thin rule between columns.

**Memo head (spans both columns):**
- `column-span: all`, margin-bottom 22px, padding-bottom 12px, `border-bottom: 0.5px solid ink`.
- Three-column grid: `auto 1fr auto`, gap 18px, baseline-aligned.
  - **Stamp (left):** sans 9.5px / 0.28em uppercase / oxblood, 0.5px oxblood border, padding `4px 8px`, no background. Always reads `Memorandum`.
  - **Title (center, fluid):** Fraunces 500 / 30px / -0.01em / ink, no margin. The em is italic 400. Example: `A book that is <em>two stocks pretending to be a portfolio.</em>` This title should be *opinionated*. It is the analyst's verdict in headline form.
  - **Author (right):** Fraunces italic 13px / ink-soft. `— The Analyst` (with em-dash). The desk speaks anonymously.

**Memo body paragraphs:**
- Fraunces 400, 15.5px, **line-height 1.62**, ink-2.
- **`text-align: justify; hyphens: auto`.** Both required. The justified text is the hallmark of "this is a read document, not a UI."
- Margin between paragraphs: `0 0 14px`.
- **Drop cap on first paragraph:** `p:first-of-type::first-letter` is Fraunces 500 / **56px** / line-height 0.85, oxblood, `float: left; padding: 6px 10px 0 0`. The drop cap sits *into* the body of the paragraph, not above it.
- **Inline `<strong>` is permitted** — used to surface a key number (`$24.71M`), a ticker (`NVDA`), a recommendation phrase (`3.5% trim of NVDA`). The strong is rendered at the same family/size, just heavier weight (500-600). No color change.

**Memo h4 (subsection labels inside the memo):**
- Sans 400 / 10px / 0.24em uppercase / ink, margin `18px 0 6px`.
- `break-after: avoid` — never let a subhead orphan at the bottom of a column.
- Default subsections, in order: `Risk — concentrated & correlated`, `Performance — honest accounting`, `Position limits — one breach, one warning`. The em-dash separates the topic from the qualifier. Always two-part.

**Memo blockquote (the pull-quote inside the memo):**
- Margin `16px 0`, padding `14px 0`, border-top + border-bottom 0.5px solid ink.
- Fraunces italic 19px, line-height 1.4, ink.
- `break-inside: avoid` — never split across columns.
- Opens with a curly `\201C` (left double quote) at 38px line-height 0, vertical-align -0.2em, oxblood, `margin-right: 4px`. **No closing quote.** The blockquote ends with a regular period, not a closing quotation mark.
- Use exactly **one** blockquote per memo. It is the analyst's single sharpest sentence. Example: *The portfolio looks diversified. It is not. It is a leveraged bet on AI compute, with an honest hedge in Saudi banking and a small altar of digital gold.*

**Prompt row (footer of memo, spans both columns):**
- `column-span: all`, margin-top 18px, padding-top 16px, `border-top: 1px solid ink`.
- Two-column grid: `1fr auto`, gap 16px, align-items: stretch.
- **Left:** a text input — no border, no background, only a `border-bottom: 0.5px solid ink`. Fraunces italic 17px, padding `8px 0`, ink, full width. Placeholder: `Ask the desk — e.g., What if NVDA halves overnight?` (italic muted). The placeholder sentence must always offer a *concrete* example question, never a generic "Type a question here…".
- **Right:** a button — solid `ink` background, `bone` text, no border, padding `0 22px`, sans 11px / 0.22em uppercase. Label: `Commission Brief`. **Never** "Submit" or "Ask" — `Commission` is the verb. On `:active`, `transform: translateY(1px)`. No hover state besides cursor.
- **API row (spans full width below):** sans 10px / 0.2em uppercase / muted. Three pieces in a flex row, gap 14px, baseline-aligned: a label `Gemini Key`, a password input (`border: none; border-bottom: 0.5px dotted rule; background: transparent; padding: 4px 0; min-width: 280px; mono 11px / ink`), and a status word — `Connected` in `green-fade`, or `Disconnected` in `oxblood`.

### 6.8 Section III — The Wire & Earnings Calendar

Two columns 6fr / 6fr.

#### 6.8.1 The Wire (left)

- **Title + deck** in standard block style. Examples: `From the <em>wire</em>, this morning.` / `Items selected for portfolio relevance only. No filler, no commodity headlines.`
- **Wire items** (`<article class="wire-item">`): each has a 2-col grid `96px 1fr; gap: 24px; padding: 18px 0; border-bottom: 0.5px solid rule`. Last item removes border-bottom; first item gets `padding-top: 4px` (tighter against the deck).
  - **Stamp column (96px):** mono 11px / 0.04em / muted / line-height 1.4. Two lines: date, then time + timezone (e.g. `28 Apr 2026<br/>14:48 EDT`). Below the time, in a separate block: the source name in sans 9px / 0.24em uppercase / oxblood, margin-top 6px. Examples: `Reuters`, `Bloomberg`, `FT`, `Argaam`, `WSJ`. **Source attribution is a typographic citizen, not a footnote.**
  - **Body column:**
    - **Tag:** `<span class="tag up|down|—">` in sans 10px / 0.18em uppercase. Format: `NVDA · +2.4%`. Color: forest (up), oxblood (down), ink-soft (flat). Inline with `margin-right: 14px` so it can sit on the same baseline as the headline if needed, or on a line above.
    - **Headline (h5):** Fraunces 500 / 19px / 1.2 / -0.01em / ink. Margin `0 0 6px`. **Sentence-case, not title-case.** Example: `Nvidia signs multi-year supply pact with Saudi data-centre venture HUMAIN`.
    - **Body p:** Fraunces 400 / 14px / 1.5 / ink-2 / max 70ch / margin `0 0 6px`. Two-to-four sentences. Should always end with a *read-across*: what this means for the book.
- **Source line (below items):** sans 10px / 0.18em uppercase / muted. Example: `Sources: Gemini grounded search · Reuters, Bloomberg, Financial Times, Argaam, Wall Street Journal · refreshed 16:02 EDT`. The hyperlink (`<a>`) inherits oxblood color and a 0.5px oxblood underline (no other text decoration).

Show **5 wire items maximum.** If Gemini returns more, prioritize portfolio holdings, then watchlist, then macro. No commodity/general-market headlines.

#### 6.8.2 The Earnings Calendar (right)

A typed table — but not styled like the holdings table. The earnings table is **prose-aware**: dates are italic, verdicts are italic, surprise is mono.

- **Title + deck:** `The <em>earnings</em> calendar` / `Names you own, dated. Actuals printed where reported, with surprise relative to consensus.`
- **Calendar grid (`.cal`):** rows are `display: grid; grid-template-columns: 92px 1fr 90px 90px 90px 96px; gap: 12px; padding: 14px 0; border-bottom: 0.5px solid rule; align-items: baseline`.
  - **Head row** (`.cal-row.head`): sans 10px / 0.22em uppercase / muted, `border-bottom: 1px solid ink`. Six columns: `When`, `Issuer`, `EPS Est.`, `EPS Act.`, `Surprise`, `Verdict`.
  - **Body rows:**
    - **Date (col 1):** Fraunces italic 16px / oxblood. Format: `Wed 30 Apr`, `Tue 22 Apr`. Day-of-week + day + month. **No year unless the year crosses.**
    - **Issuer (col 2):** Fraunces 400 / 17px / ink, with a `<small>` block beneath in sans 10px / 0.18em uppercase / muted, `display: block; margin-top: 2px`. Format: `Microsoft<small>MSFT · AMC</small>`. AMC = after market close, BMO = before market open, AH = after-hours.
    - **EPS Est., EPS Act., Surprise (cols 3-5):** mono 13px, tabular-nums, right-aligned. Surprise is sign-colored: forest for `+`, oxblood for `−`. Use a real minus sign (`−`, U+2212), not a hyphen.
    - **Pending values:** for unreported reports, render `pending` in sans 10px / 0.2em uppercase / muted (instead of mono numerics), and `—` (em-dash) in the surprise column.
    - **Verdict (col 6):** Fraunces italic 14px, right-aligned, sign-colored. **Vocabulary is fixed:**
      - `cleared` — beat (forest)
      - `disappointed` — miss (oxblood)
      - `met` — in-line (ink-soft, no italic exaggeration — a quiet word for a quiet outcome)
      - `awaiting` — upcoming (sans 10px / 0.2em uppercase / muted, **not italic** — pending verdicts shed their editorial style and become calendar metadata)
- **Source line:** as in the wire. Example: `Consensus: Visible Alpha via Gemini grounded search · last refreshed 28 Apr 2026 16:02 EDT · <a>view sources</a>`.

Show **all holdings**, even unreported ones. The calendar's job is to make the next print visible to the reader.

### 6.9 Section IV — The Watchlist

A two-column grid of names not yet owned. `display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px`.

Each item:
- 3-col grid `1fr auto auto; gap: 14px; padding: 12px 0; border-bottom: 0.5px solid rule`.
- **Symbol column:** Fraunces 400 / 17px / ink, with a `<small>` block beneath: sans 10px / 0.18em uppercase / muted. Format: `ASML<small>ASML Holding · Semis</small>`.
- **Price column:** mono 13px / ink. Currency-aware — `$1,042.18` for USD, `SAR 76.40` for Tadawul names.
- **Change column:** mono 12px, sign-colored.

Default contents (rotate based on actual watchlist): `ASML / Semis`, `BRK.B / Cong.`, `SOL / Digital Asset`, `2010.SR / SABIC · Materials · KSA`. The watchlist's role is to show **discipline** — names being patient about, not names being hyped about.

### 6.10 Colophon

Footer. The design's *signature* — a final note that makes clear this is an authored document.

- **Wrapper:** `margin-top: 80px; padding-top: 28px; border-top: 2px solid ink; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px`. Three columns, each italic.
- **Strong (heading):** sans 500 / 10px / 0.24em uppercase / ink, `display: block; margin-bottom: 6px`.
- **Body:** Fraunces italic 13px / ink-soft.
- **Three sections, fixed copy:**
  1. **About this Brief** — what the document is and how it's generated.
  2. **Methodology** — exactly how holdings are parsed, how SAR is converted, how the AI grounds its claims.
  3. **Disclaimer** — that this is not investment advice, and that the desk holds no view of its own.

Default copy is in the existing dashboard.html — preserve it verbatim unless the methodology actually changes.

### 6.11 Section ornament (the very last element)

```
<p class="rule-ornament">§      §      §</p>
```

Three section signs (`§`), separated by **6 non-breaking spaces each**, centered, Fraunces italic 18px / 0.4em letter-spacing / ink-soft, `margin-top: 24px`. This is the printed-document equivalent of a final period. Nothing else after it.

---

## 7 · Microcopy bank

The voice is non-negotiable. Use these phrasings, and write new copy in the same register.

| Surface | Default phrasing |
|---|---|
| Latin epigraph | *Patientia opes parit — patience begets capital.* |
| Lede kicker | `§ Letter from the Desk — Equities & Digital Assets` |
| Lede deck closer (always last sentence) | `…the watchlist has begun to look less like aspiration and more like patience.` |
| KPI label `Cash Weight` | (never `Cash %`) |
| KPI label `Day P&L` | (never `Today's Change`) |
| Section names | `The <em>Ledger</em> — Holdings of Record`, `Sectoral <em>Exposure</em> & the Analyst's Brief`, `The <em>Wire</em> & the Earnings Calendar`, `The <em>Watchlist</em> — names not yet owned` |
| Memorandum stamp | `Memorandum` (never "AI Analysis", never "Risk Report") |
| Memorandum byline | `— The Analyst` (em-dash + The Analyst, always) |
| Earnings verdict — beat | `cleared` |
| Earnings verdict — miss | `disappointed` |
| Earnings verdict — in-line | `met` |
| Earnings verdict — upcoming | `awaiting` |
| Live pill | `Live Quotes — Streaming` / `Live Quotes — Paused` |
| Submit button (memo prompt) | `Commission Brief` |
| CSV upload button | `Upload Ledger CSV →` (with arrow) |
| Footer ornament | `§      §      §` |

**Style rules for new copy:**
- Use **em-dash (`—`, U+2014)** liberally. Hyphens (`-`) only for compound words.
- Use the **mathematical minus sign (`−`, U+2212)** for negative numbers, never a hyphen.
- Numbers in prose are italicized in oxblood when they are the *fact* of the sentence. Plain when they are decoration.
- **Passive voice is permitted** for desk authority. ("The desk recommends a 3.5% trim.") Active voice is fine. **First person ("I", "we") is forbidden** — the desk speaks of itself in third person or impersonally.
- One blockquote per memo. The memo earns it.
- Sentence-case for headlines. Title-Case is for trade publications, not for this one.

---

## 8 · Interaction behavior

The design is **mostly still**. Interactions are minimal and considered.

- **Live-quote pill:** click toggles `Streaming` ↔ `Paused` and the dot animation. JS uses `textContent` only.
- **Memo prompt input:** Enter submits to Gemini. Result replaces the memo body (stamp, title, paragraphs, h4s, blockquote — full re-render in the same shape). The two-column justified layout MUST hold across re-renders. If Gemini returns a bullet list, the AI-side prompt must coerce it back to prose; the renderer should not apologize for this with a fallback list.
- **Commission Brief button:** same as Enter on the input.
- **Upload Ledger CSV:** opens file picker. Reads CSV, repopulates the page. Only the holdings, KPI strip, sectors, concentration, watchlist, and earnings list change — the masthead, latin epigraph, colophon are stable.
- **Hover states:** table rows get a 0.18-opacity bone-3 background. Source links get an opacity dim, no underline change. Buttons invert on hover (CSV upload), or `:active` translateY only (Commission Brief).
- **No tooltips.** If a number needs explanation, the explanation goes inline as a footnote (Fraunces italic 12px ink-soft).
- **No modals.** If something needs more space than its block, it gets its own section.

---

## 9 · Edge & empty states

Even an empty book should feel typeset. The design must not become a spinner-and-message dialog.

- **No CSV uploaded yet:**
  - Render the masthead and submast with today's date.
  - Lede headline becomes `An empty book — and a question of where to begin.` (italic em on `where to begin`).
  - Lede deck: a one-sentence invitation to upload. Italic. Oxblood-tinted CTA in the deck pointing to the Upload button.
  - KPI strip renders with em-dashes (`—`) for all values, in `ink-soft` instead of ink. Labels stay.
  - Section I-IV render their headers but with italic ink-soft "no rows" sentences in the body. Example: `Section I — The Ledger awaits your CSV.`
- **AI key not connected:**
  - Memo body renders the stamp and head, but the body becomes a single italic paragraph: `The Analyst is awaiting credentials. Provide a Gemini API key below to commission today's brief.` The prompt row stays visible, with the API field highlighted (oxblood underline instead of dotted rule).
- **Earnings/news not yet fetched:**
  - Show italic ink-soft single line: `Wire and earnings load on first request. Click "Commission Brief" to begin.` Border-bottom rule still drawn.
- **A holding's sector is unknown:**
  - Sector cell renders `—` in the same sector-tag style. Donut treats unknown as the 7th color (`rule`).
- **A number is genuinely unavailable (e.g., Day P&L without intraday data):**
  - Render `—` in the value, and a sub-line in muted: `intraday feed unavailable`. **Never invent the number.** This is the one rule the design will not bend on.

---

## 10 · Hard rules — do not violate

1. **Never use `#000`.** Floor is `var(--ink)` = `#1A1612`.
2. **Never use a saturated screen-green or screen-red.** Gains are `--forest`. Losses are `--oxblood`. There is no exception.
3. **Never use a sans-serif for a headline.** Headlines are Fraunces, always.
4. **Never use Inter Tight for a number.** Numbers are mono or Fraunces tnum.
5. **Never animate the page background, the type, the rules, or the layout.** The only animated element on screen is the live-quote pill's pulsing dot.
6. **Never use a card with a shadow.** Elevation is communicated with `bone-2` background and a heavier border-top.
7. **Never use rounded corners**, except by the runtime's default form-control rendering. Swatches are squares. Bars are rectangles. Buttons are rectangles.
8. **Never use emojis.** Not in copy, not as icons. The only glyphs permitted are `§`, `§`, `—`, `·`, `→`, `↑`, `↓`, `±`, curly quotes, and Roman numerals.
9. **Never round numbers asymmetrically.** Show two decimals for percentages; match the precision of the underlying. `+24.51%`, not `+24.5%`.
10. **Never use the word "Dashboard".** This is a Brief.

---

## 11 · Asset & dependency list

- **Fonts:** Google Fonts CDN — Fraunces (variable, opsz + wght + SOFT axes), Inter Tight, JetBrains Mono. No bundled font files.
- **Charts:** all hand-rolled inline SVG. No charting library. Recharts/Chart.js will compromise the typographic discipline; do not use.
- **Icons:** none. The design uses glyphs from the typeface.
- **JS:** ~10 lines for the live toggle. Use plain DOM APIs (`textContent`, `classList.toggle`). Never use `innerHTML`.

---

## 12 · A worked example — the lede headline + deck

To demonstrate the voice, here is a complete example as the design intends it:

```html
<section class="lede">
  <div>
    <div class="kicker">Letter from the Desk — Equities & Digital Assets</div>
    <h1>A quiet quarter, with <em>two loud holdings</em> doing most of the work.</h1>
    <div class="deck">
      Concentration is again the story. Eighty-one cents of every dollar of unrealised gain
      this month sat in two positions — one chip, one chain. The book is otherwise composed,
      cash is light, and the watchlist has begun to look less like aspiration and more like patience.
    </div>
    <div class="byline">By <span>The Brief Desk</span> · Closing marks April 28, 2026 · 16:02 EDT</div>
  </div>
  <dl class="summary">
    <dt>Net Liquidation</dt>
    <dd>The book closes at <em>$24.71M</em>, marked at vendor consensus and adjusted for SAR cross.</dd>
    <dt>Disposition</dt>
    <dd>Long-only, twelve names, three currencies, no leverage. <em>Aramco</em> remains the single largest non-USD exposure.</dd>
    <dt>What we will be reading</dt>
    <dd>Microsoft prints Wednesday after the bell — the only Q-call that materially moves the book this week.</dd>
  </dl>
</section>
```

Read this aloud. It should sound like print. If it sounds like a CMS template, you have not yet built the design.

---

## 13 · Build order (recommended, if recreating)

1. Set the page geometry, color tokens, and font loading. Verify the paper-grain overlay.
2. Build the masthead + submast. Get the typographic alternation in `Vol VII · No. 112` exactly right — this is the hardest piece.
3. Build the lede band. The 76px headline with italic-em + oxblood is the test of the type setup.
4. KPI strip. The 84pt hero NLV figure should already feel correct if the type is loaded right.
5. Section header component (used 4×). Lock in the `I.` Roman ordinal in italic oxblood.
6. The Ledger table. Rows must hover-tint, weight bars must size proportionally, P&L cells must double-stack.
7. Concentration column. Lowercase Roman ordinals.
8. Sector donut + list + 6-month line. The line must be hand-rolled SVG with the two annotations.
9. **The memo.** Two-column justified body, drop cap, blockquote, prompt row, API row. This is the single most distinctive component — spend disproportionate effort here.
10. The wire (5 items max).
11. The earnings calendar (italic verdicts).
12. The watchlist (2-col).
13. The colophon (3-col italic).
14. The section ornament (`§ § §`).
15. Live-quote pill JS. Nothing else.

---

## 14 · A final note on register

This dashboard's job is to make the reader feel that someone *prepared* something for them. Not generated, not synthesized — *prepared.* If the design successfully impersonates a printed brief, the reader will read it differently than they read a screen. They will sit with it. They will trust it more. They will trust it less. Both of those reactions are productive.

Build accordingly.
