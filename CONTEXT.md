# CONTEXT.md

The vocabulary canon for this project. Every name in this file is the
authoritative form — in code, in comments, and in review discussion. If
a function or type name conflicts with what's written here, the code is
wrong.

Architecture vocabulary (Module / Seam / Adapter / Depth / etc.) lives
in `~/.claude/skills/improve-codebase-architecture/LANGUAGE.md`.

---

## Architecture map

```
Project root
├── App.tsx              orchestrator: pipeline + hooks + render
├── types.ts             RawHolding ⊂ Holding ⊂ PricedHolding chain
├── utils/               pure pipeline steps
│   ├── parseCSV.ts          CSV text → RawHolding[]
│   ├── convertCurrency.ts   USD-normalize via CurrencyRule[]
│   ├── enrichSector.ts      static map (~250 tickers) + 12-sector vocab
│   ├── priceHolding.ts      compute MarketValue / CostBasis / UnrealizedPL
│   └── format.ts            display helpers (fmtUsd, cls, plClass…)
├── services/            stateful seams
│   ├── gemini/              one gateway, typed Result, useAiQuery, useAiStats
│   ├── priceFeed/           static + simulated price adapters, useSyncExternalStore
│   ├── sectorResolver/      4-tier sector classifier + localStorage cache
│   └── commandRegistry/     keyboard + command-bar single source of truth
└── components/terminal/ presentational UI
```

The data flow is one direction: CSV → pipeline → React hooks → UI.
Every external mutable thing (AI calls, price ticks, sector cache) is
behind a service module with a single seam.

---

## Domain — portfolio data

Holdings flow through a 4-stage pipeline. Each subsequent type is a
strict superset, so TypeScript enforces the lifecycle order at compile
time.

```
CSV text
   ↓ parseCSV
RawHolding[]              structure + numeric coercion only
   ↓ applyCurrencyRules
RawHolding[]              USD-normalized
   ↓ enrichSector + Sector Resolver
Holding[]                 + Sector
   ↓ priceHolding (per row, with PriceFeed)
PricedHolding[]           + MarketValue, CostBasis, UnrealizedPL
```

- **RawHolding** — what `parseCSV` emits. No domain knowledge: just
  Symbol, Quantity, CurrentPrice, PurchasePrice, etc., type-coerced.
  Has an optional `Sector?: string` for CSVs that pre-classify.
- **Holding** — RawHolding with a required `Sector` field. The
  "ready to display" form before pricing.
- **PricedHolding** — Holding plus computed metrics: `MarketValue`,
  `CostBasis`, `UnrealizedPL`. Components that render dollars consume
  PricedHolding.
- **Position** — a PricedHolding with `Quantity > 0`. The user owns it.
- **Watchlist entry** — a PricedHolding with `Quantity === 0`. Tracking
  but not holding.
- **NLV (Net Liquidation Value)** — sum of `MarketValue` across all
  Positions. Excludes cash and watchlist entries.

### Sector — controlled vocabulary

Every ticker resolves to one of 12 labels:
**Technology, Financial, Healthcare, Energy, Industrials, Consumer
Cyclical, Consumer Defensive, Communication, Real Estate, Materials,
Utilities, Crypto.**

Two principles, both load-bearing:

- **No `'Unknown'` sector.** Every ticker is classifiable, by design.
  If the static map and AI both fail to classify, the row renders as
  `'Unclassified'` — a transient error state, never a final value.
- **`'Crypto'` is reserved strictly for tokens.** Public-market tickers
  (e.g. `C` for Citibank) must never be silently bucketed as Crypto.
  The label is only assigned when the static map names the symbol
  explicitly OR the AI classifier returns it after research.

---

## Domain — AI capabilities

The Gemini gateway exposes four named **specs** — each is a distinct
AI capability with its own prompt, schema, and result type.

- **Audit** — portfolio risk analysis. Inspects Positions for
  concentration risk, sector imbalance, drawdown vs. cost, proximity
  to HighLimit / LowLimit. Returns a `PortfolioAnalysis` (riskScore +
  findings + actions). Triggered by the user via the `analyze` /
  `audit` / `ask <prompt>` commands.
- **Movers** — today's top gainers and losers, biased toward symbols
  the user holds. Returns a `MarketNewsResponse`. The UI tab is
  labeled "NEWS" but the capability is movers (not headlines).
- **Earnings** — most recent or upcoming quarterly earnings report
  per position symbol. Returns an `EarningsResponse`.
- **Sector Classifier** — identifies the sector for unknown tickers
  (those not in the static map). Used by the Sector Resolver, fires
  eagerly on CSV upload. Result type is `SectorClassificationResponse`.

---

## Architecture — data pipeline

Each step is pure, independently testable, and bug-contained: bugs
about Saudi prices live behind `convertCurrency`; bugs about
classification live behind `enrichSector` / Sector Resolver; bugs
about CSV header parsing live behind `parseCSV`. Nothing leaks across.

- **`parseCSV(text) → RawHolding[]`** (`utils/parseCSV.ts`) — pure
  tokenizer + numeric coercion. Knows nothing about currencies or
  sectors. Honors common CSV header variants (`Qty` → `Quantity`,
  `Last`/`Price` → `CurrentPrice`, `Cost`/`AvgCost` → `PurchasePrice`).
- **`applyCurrencyRules(rows, rules) → RawHolding[]`**
  (`utils/convertCurrency.ts`) — pure. Each rule is
  `{ symbolMatches, toUsd }`. Today only `SAUDI_RIYAL_RULE` (matches
  '4280' and '4280.*' suffixes, divides by 3.75). Future GCC currencies
  (AED, KWD, QAR) slot in as additional rules without changing the
  function.
- **`enrichSector(rows, map?) → Holding[]`** (`utils/enrichSector.ts`)
  — pure. Default map is `DEFAULT_SECTOR_MAP` with `defaultSector:
  'Unclassified'` (the transient state for tier-4 AI resolution). Strips
  `.SR` / `.SE` suffixes before lookup. The static map covers ~250
  tickers (S&P 500 top names, sector ETFs, top 30 crypto, Tadawul).
- **`priceHolding(holding, currentPrice) → PricedHolding`**
  (`utils/priceHolding.ts`) — pure metric calculator. Computes
  MarketValue, CostBasis, UnrealizedPL deterministically. The
  `currentPrice` argument comes from a Price Feed; this function never
  touches `Math.random()` or wall-clock time.

---

## Architecture — Price Feed

The seam where "what's the current price for this symbol?" gets
answered. Lives in `services/priceFeed/`. Single interface
(`getPrice`, `subscribe`, `version`). Adapters implement it; callers
never touch `Math.random()` or set their own intervals.

- **Static Feed** — returns the CSV price unchanged. Used in EOD mode.
  `subscribe` is a no-op; `version` stays at 0.
- **Simulated Feed** — returns CSV ± 2% jitter, recomputed every
  1.6s. Used in LIVE · SIM mode. Reference-counted: starts the
  `setInterval` on first subscribe and clears it on last unsubscribe.
  No leak when the feed is replaced (e.g. on `isLive` toggle) or when
  components unmount.
- **`usePriceFeed(feed)`** — React hook backed by
  `useSyncExternalStore`. Returns the feed's current `version` so
  consumers use it as a `useMemo` dependency to recompute derived data
  on each tick.

A future Real Feed adapter (Yahoo / Polygon / etc.) slots in without
touching `priceHolding` or `App.tsx`.

---

## Architecture — Sector Resolver

A 4-tier resolver that classifies every ticker without ever falling
back to `'Unknown'`. Lives in `services/sectorResolver/`.

**Resolution order (per row, per upload):**

1. **CSV-provided Sector** — if the user's CSV has a Sector column for
   this row, use it. Always wins.
2. **Static map** (`DEFAULT_SECTOR_MAP` in `utils/enrichSector.ts`) —
   curated list of ~250 tickers. Treat as authoritative.
3. **AI cache** (localStorage, key `desk:sectorCache`) — populated by
   prior Gemini classifier calls. Stores `{ sector, source: 'ai',
   classifiedAt, confidence?, reasoning? }` per symbol.
4. **AI classifier** (`sectorClassifierSpec`) — for symbols still
   unresolved after tiers 1-3. Fires eagerly on CSV upload with
   `useWebSearch: true` so Gemini verifies against real exchange
   listings, not just memory. Result merges into the cache and
   persists to localStorage.

**Cache lifetime: permanent until manual clear.** Sectors don't change
meaningfully on month timescales. The Settings tab has a `CLEAR AI
CLASSIFICATIONS` button. Clearing only wipes AI-derived entries; static
map and CSV-provided values are unaffected.

**`useSectorResolver(rawRows, apiKey)`** — orchestrating React hook.
Returns `{ holdings, classifying, classifierError, unclassifiedSymbols,
retry, clearAiCache }`.

---

## Architecture — Gemini Gateway

The single seam where every Gemini call flows. Lives in
`services/gemini/`. No caller imports the Gemini SDK directly.

- **`callGemini(apiKey, spec)`** — gateway entry point. Owns the SDK
  client (cached per `apiKey`), the model constant, JSON parsing,
  schema validation, error normalization, and call statistics.
- **Gemini Spec** — declarative: `{ prompt, schema, useWebSearch? }`.
  Specs are pure data — they don't make network calls. The four specs
  (`auditSpec`, `moversSpec`, `earningsSpec`, `sectorClassifierSpec`)
  live in `specs.ts`. Their zod schemas live in `schemas.ts`.
- **Result** — discriminated union returned by every gateway call:
  `{ kind: 'ok', data, generatedAt } | { kind: 'err', error }`.
- **GeminiErrorKind** — typed failure modes:
  `'NO_API_KEY' | 'NETWORK' | 'MALFORMED_JSON' | 'SCHEMA_MISMATCH' | 'SDK_ERROR'`.
  The UI may render different copy per kind. `MALFORMED_JSON` = model
  returned non-JSON. `SCHEMA_MISMATCH` = JSON parsed but failed zod.
- **AI Stats** — `{ calls, errorsByKind }` tracked inside the gateway,
  exposed via `useAiStats()`. The status bar reads from this hook.
  No caller increments a counter — the gateway owns observability.
- **`useAiQuery(buildSpec, apiKey)`** — generic hook that absorbs the
  `data / loading / error / run / reset` state-trio for one-shot
  AI calls (audit, movers, earnings). `buildSpec(...args)` returns a
  `GeminiSpec<T>` or `null` (the skip guard, e.g. for missing apiKey
  or empty positions). Token-based cancellation drops stale results.

The Sector Resolver does **not** use `useAiQuery` — it has its own
auto-fire + caching + dedup pattern. Two distinct hook shapes is
honest: each is the right shape for its job.

---

## Architecture — command registry

Single source of truth for the keyboard handler AND the command bar.
Adding a new action = one entry in the `commands` array in `App.tsx`.
Lives in `services/commandRegistry/`.

- **`Command`** — `{ id, aliases?, keys?, category, description, run }`.
  `id` is the canonical command-bar name; `aliases` are alternates;
  `keys` are keyboard invocations (single keys like `'F1'` or chords
  like `'g h'`); `category` (`nav` / `ai` / `system`) groups the help
  overlay; `run(args?)` does the work (`args` only for parameterized
  commands like `ask <prompt>`).
- **`matchByName(input, commands)`** — pure dispatcher for the command
  bar. Two-pass: full-input match first (handles `g h`, `analyze`),
  then first-word + rest-as-args (handles `ask <prompt>`).
- **`matchByKey(key, chordFirst, commands)`** — pure dispatcher for
  the keyboard. Honors active chord state, falls through to direct
  key match, reports `startsChord` if the key is a possible chord
  prefix.
- **`useKeyboardCommands(commands)`** — React hook owning chord state
  and `window.keydown`. Ignores keystrokes while focus is in an
  `INPUT` / `TEXTAREA`. Chord timeout is 1.5s.
- **`HelpOverlay`** — modal listing all commands grouped by category,
  triggered by the `?` key (also a registry command). Auto-generated
  from the registry — never goes stale. Esc to close.

---

## Conventions

### Model

- **Pinned model:** `gemini-3.1-flash-lite` (stable). Defined as a
  single constant in `services/gemini/gateway.ts`. Used for all four
  specs.
- **Upgrade path:** change the constant when newer Flash-family models
  ship (3.2, 3.3, etc.).
- **Web search tool** is enabled per-spec via `useWebSearch: true`.
  Movers, Earnings, and Sector Classifier use it; Audit does not.

### Persistence (localStorage keys)

- `desk:apiKey` — Gemini API key
- `desk:lastCsv` — most recently uploaded CSV text
- `desk:sectorCache` — AI-derived sector classifications

All three have a "clear" affordance in the Settings tab.

### React patterns

- **External mutable state → `useSyncExternalStore`.** Both
  `useAiStats()` (gateway) and `usePriceFeed()` (price feed) follow
  this pattern. Same idiom across the codebase.
- **Async fetch state → `useAiQuery`** (or, for the cache-heavy sector
  case, `useSectorResolver`). Don't roll a hand-built
  data/loading/error trio.
- **Discriminated unions use `kind: 'ok' | 'err'`, not `ok: true | false`.**
  Project tsconfig is non-strict, which causes TypeScript to widen
  boolean literals and break union narrowing. String literals stay
  narrow. (Real footgun hit during the initial Gemini gateway rollout
  — preserved here to spare the next person.)

### Currency rules

The `CurrencyRule` interface is the seam for adding new conversions.
Each rule is `{ symbolMatches, toUsd }`. Today only `SAUDI_RIYAL_RULE`
exists; AED / KWD / QAR rules can be added without modifying the
pipeline step that applies them.

### Sector map

Curated, hand-edited. When you find an unfamiliar ticker classifying as
`'Crypto'` (or seeing AI calls fire repeatedly for the same names),
extend `DEFAULT_SECTOR_MAP.bySymbol` rather than living with the wrong
label. The static map is authoritative and free; the AI classifier is
the safety net.
