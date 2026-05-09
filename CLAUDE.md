# CLAUDE.md

Guidance for Claude Code (and other AI coding tools) working on this
repository.

## Project Overview

**Live Portfolio Tracker & AI Alert System** — a React + TypeScript +
Vite single-page app. Users upload a CSV of their portfolio; the app
displays a Bloomberg-Terminal-style trading desk with KPIs, charts,
sector breakdowns, and Gemini-powered AI analysis.

**No backend.** Everything runs in the browser. Persistence is
`localStorage`. The Gemini API key is user-supplied at runtime — never
bundled, never injected at build time.

**Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 ·
Recharts · zod · `@google/genai`.

## Source of truth for architecture

Read [`CONTEXT.md`](./CONTEXT.md) before making non-trivial changes. It
documents:

- The 4-stage data pipeline (`parseCSV` → `applyCurrencyRules` →
  `enrichSector` → `priceHolding`) and the strict-superset type chain
  (`RawHolding ⊂ Holding ⊂ PricedHolding`)
- The four service modules:
  `services/gemini/` (gateway, specs, hooks),
  `services/priceFeed/` (static + simulated price adapters),
  `services/sectorResolver/` (4-tier sector classifier with localStorage cache),
  `services/commandRegistry/` (keyboard + command-bar single source of truth)
- Conventions: pinned model, `kind: 'ok' | 'err'` discriminator (string
  literal — boolean is a footgun in this project's non-strict tsconfig),
  React patterns (`useSyncExternalStore` for external mutable state)

When you add or rename anything that introduces new vocabulary, update
`CONTEXT.md` in the same change.

## Development commands

```bash
npm install
npm run dev          # dev server at localhost:3000
npm run build        # production bundle in dist/
npm run typecheck    # tsc --noEmit
npm run preview      # preview the production build
```

There is no test runner configured yet. Each pipeline step and each
service is structured to be testable (pure functions in `utils/`,
mockable adapters in `services/`), so adding Vitest is a clean
follow-on if you want to start a test suite.

## Environment & configuration

**No `.env` file is required and none is read.** The Gemini API key is
entered at runtime through the sidebar input field and stored only in
the browser's `localStorage` (key: `desk:apiKey`).

`vite.config.ts` does not inject any environment variables — the build
output never contains secrets.

The three `localStorage` keys in use:
- `desk:apiKey` — user's Gemini API key
- `desk:lastCsv` — most recently uploaded CSV text
- `desk:sectorCache` — AI-derived sector classifications

All three have a "clear" affordance in the Settings tab.

## Common development tasks

### Adding a new pipeline step

Pipeline steps are pure functions in `utils/`. Each one takes the
output of the previous step plus optional config, and returns the next
type in the chain. Add a new file (e.g. `utils/myStep.ts`), define the
function, then chain it in `App.tsx` between the appropriate steps.
Update the type chain in `types.ts` if the step adds new fields.

### Adding a new AI capability

1. Add a zod schema in `services/gemini/schemas.ts`
2. Add a spec builder in `services/gemini/specs.ts`
3. Re-export both from `services/gemini/index.ts`
4. In the consumer, wrap with `useAiQuery(buildSpec, apiKey)` — the
   hook absorbs the data/loading/error/run/reset state machine

### Adding a new sector to the static map

Edit `DEFAULT_SECTOR_MAP.bySymbol` in `utils/enrichSector.ts`. The
sector label must be one of the 12 controlled values defined in
`SECTORS` in the same file. If you need a brand-new sector, add it to
the `SECTORS` tuple AND to the `SECTOR_ENUM` zod enum in
`services/gemini/schemas.ts` so AI classification stays in sync.

### Adding a new command (keyboard shortcut + command-bar verb)

Add one entry to the `commands` array in `App.tsx`. The keyboard
handler, command bar, and help overlay all auto-pick it up.

### Adding a new currency conversion

Add a `CurrencyRule` to `utils/convertCurrency.ts` (e.g. `AED_RULE`
matching UAE tickers, `KWD_RULE` for Kuwaiti, etc.) and pass it in the
rules array in `App.tsx` where `applyCurrencyRules` is called.

## Performance notes

- The data pipeline runs in a single `useMemo` chain triggered by CSV
  changes. Cheap.
- The simulated price feed uses reference-counted `setInterval` —
  starts on first subscribe, clears on last unsubscribe. No leaks.
- The sector resolver de-duplicates AI calls per session via a ref;
  symbols already classified (in static map or cache) trigger no
  network call.
- The Gemini gateway caches the SDK client per `apiKey` — no
  reconstruction per call.

## Git & deployment notes

- `dist/` is the build output; gitignored.
- `.env*` files are gitignored (none are required, but the gitignore
  keeps any local experimentation safe).
- The `@google/genai` SDK is the only network destination at runtime.
  No telemetry, no analytics, no other API calls.

## License

MIT — see [LICENSE](./LICENSE).
