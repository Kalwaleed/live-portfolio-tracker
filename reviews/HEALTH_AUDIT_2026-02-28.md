# Portfolio Tracker Health Audit

**Date:** 2026-02-28
**Scope:** Full codebase security, code quality, UI/UX, and dependency audit

---

## CRITICAL: Security Issues

### 1. No `.gitignore` file exists
**Severity: CRITICAL**
The project has zero `.gitignore`. Any `.env`, `node_modules/`, `dist/`, `firebase-debug.log`, or secret file can be committed to git. This is the single most urgent fix.

### 2. `firebase-debug.log` committed to repo
**Severity: HIGH**
`firebase-debug.log` contains the authenticated user email (`looods@gmail.com`) and Firebase auth scopes. This file should never be in source control.

**File:** `firebase-debug.log:2`

### 3. API key embedded in production bundle via Vite `define`
**Severity: HIGH**
`vite.config.ts:14-15` injects `GEMINI_API_KEY` from env as a build-time constant:
```typescript
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
If a `.env` file exists at build time, the API key is baked into the production JS bundle in plaintext. Anyone viewing the deployed site can extract it from `dist/assets/*.js`.

**Current risk level:** Low if no `.env` file is present (key is entered manually via UI), but the mechanism is dangerous and should be removed since the app already accepts the key via user input.

### 4. Gemini API key exposed in client-side network requests
**Severity: MEDIUM**
`geminiService.ts` passes the API key directly from the browser to Google's API. Every request is visible in browser DevTools. For a personal/local tool this is acceptable — for any shared deployment it is not. A backend proxy should sit between the client and Gemini.

### 5. `host: '0.0.0.0'` exposes dev server to entire network
**Severity: MEDIUM**
`vite.config.ts:10` — The dev server binds to all interfaces. Anyone on the same network can access the app, potentially including uploaded portfolio data.

### 6. No Content Security Policy (CSP) headers
**Severity: MEDIUM**
`index.html` has no CSP meta tag. The app loads external resources from `fonts.googleapis.com`, `fonts.gstatic.com`, and (via importmap) `esm.sh`. Without CSP, the app is more vulnerable to XSS if any injection vector is found.

### 7. Importmap loads dependencies from `esm.sh` CDN
**Severity: LOW** (supply chain risk)
`index.html:27-37` has an importmap pointing to `esm.sh` for React, Recharts, and Genai. This is likely a leftover from a non-Vite setup. Vite bundles these dependencies during build, so the importmap is only effective when loading the HTML directly. Still, it introduces unnecessary supply chain exposure.

---

## Dependency Vulnerabilities

```
2 high severity vulnerabilities found (npm audit):
- minimatch 9.0.0-9.0.6: ReDoS via wildcards (3 CVEs)
- rollup 4.0.0-4.58.0: Arbitrary file write via path traversal

Fix: npm audit fix
```

---

## Code Quality Issues

### Architecture
| Issue | Severity | Location |
|-------|----------|----------|
| Monolithic `App.tsx` (658 lines) — all state, rendering, and logic in one component | HIGH | `App.tsx` |
| No React Error Boundary — any chart/render crash white-screens the entire app | HIGH | — |
| Zero test files in the entire project | HIGH | — |
| `holdings`/`watchlist` computed outside `useMemo` — recompute every render | MEDIUM | `App.tsx:50-51` |
| `any` type usage bypasses TypeScript safety | MEDIUM | `helpers.ts:85` |
| Bundle size: 1.7MB JS (Three.js + Recharts) — no code splitting | MEDIUM | build output |

### Logic Bugs & Edge Cases
| Issue | Location |
|-------|----------|
| `symbolStr.includes('4280')` matches ANY symbol containing "4280" (e.g., "ABC4280XYZ") | `helpers.ts:125` |
| Division guard `(item.CostBasis \|\| 1)` shows misleading P&L% for watchlist items with zero cost | `App.tsx:629`, `App.tsx:82` |
| Sector default is 'Crypto' for any unrecognized symbol — misleading for bonds, REITs, commodities | `helpers.ts:41` |
| Live toggle applies `Math.random()` on every `useMemo` recalculation — creates jitter, not actual market data | `helpers.ts:49` |
| CSV parser doesn't handle quoted fields with commas inside (e.g., `"Smith, John"`) | `helpers.ts:81` |
| `glassCard` style defined but never used in the dashboard render | `App.tsx:142` |

### Dead Code / Unused
| Item | Location |
|------|----------|
| `generateMockData()` exported but never imported anywhere | `helpers.ts:171` |
| `AnalysisResponse` interface defined but never used | `types.ts:26-28` |
| `px()` utility exported but never used | `components/utils.ts:1` |
| `process.env.API_KEY` / `process.env.GEMINI_API_KEY` defined in Vite but never referenced in code | `vite.config.ts:14-15` |

---

## UI/UX Assessment

### Accessibility
| Issue | Severity |
|-------|----------|
| **Color contrast failure**: `#6B5D52` text on `#050505` background = ~2.7:1 ratio (WCAG AA requires 4.5:1) | HIGH |
| **No keyboard Escape handler** on modal — only a visible [ESC] button, no `onKeyDown` listener | MEDIUM |
| **No ARIA labels** on interactive elements (toggle buttons, file upload) | MEDIUM |
| **No focus management** when modal opens/closes | LOW |

### Mobile Experience
| Issue | Severity |
|-------|----------|
| AI analysis controls only in sidebar — sidebar hidden below `md` breakpoint | HIGH |
| No hamburger menu or mobile alternative to access sidebar features | HIGH |
| API key input is in header (accessible), but "Execute Analysis" button is sidebar-only | MEDIUM |

### General UX
| Issue | Notes |
|-------|-------|
| No loading indicator during CSV parse | Large files will appear to hang |
| No visual confirmation after CSV upload success | User goes directly to dashboard with no transition feedback |
| "REAL-TIME FEED" toggle is misleading — it's random simulation, not actual market data | Should be labeled "Simulated" or removed |
| Market news auto-fetches when API key is present — no user control | Could consume API quota unexpectedly |
| Analysis truncated at 400 chars in inline view with no indication of total length | `App.tsx:521` |

---

## Recommendations (Priority Order)

### P0 — Do Now
1. **Create `.gitignore`** — exclude `node_modules/`, `dist/`, `.env*`, `firebase-debug.log`, `.DS_Store`
2. **Delete `firebase-debug.log`** from the repository
3. **Remove `define` block** from `vite.config.ts` (API key injection) — it serves no purpose since the app uses runtime input
4. **Run `npm audit fix`** to patch the 2 high-severity vulnerabilities
5. **Remove importmap** from `index.html` — Vite handles bundling; the importmap is dead code and a supply chain risk

### P1 — Do Soon
6. Add React Error Boundary wrapping the dashboard
7. Add keyboard Escape handler to the modal overlay
8. Fix color contrast for secondary text (bump `#6B5D52` to at least `#9A8A7A` or similar)
9. Provide mobile access to AI analysis (bottom sheet, floating action button, or inline)
10. Change dev server host from `0.0.0.0` to `localhost`

### P2 — Do When Refactoring
11. Decompose `App.tsx` into separate components (Sidebar, KPICards, ChartsGrid, DataTable, AnalysisModal)
12. Memoize `holdings` and `watchlist` with `useMemo`
13. Add code splitting (lazy-load Three.js/GL component, lazy-load Recharts)
14. Fix the `4280` symbol matching to use exact match: `symbolStr === '4280' || symbolStr.startsWith('4280.')`
15. Replace `any` typing in CSV parser with a proper intermediate type
16. Add basic unit tests for `parseCSV`, `calculateMetrics`, `formatCurrency`
17. Add CSP meta tag to `index.html`

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Security** | 4/10 | No .gitignore, API key injection, exposed debug log, no CSP |
| **Code Quality** | 5/10 | Functional but monolithic, no tests, type safety gaps |
| **Dependencies** | 6/10 | 2 high vulns (fixable), bundle size large but manageable |
| **UI/UX** | 6/10 | Visually polished, but accessibility and mobile gaps |
| **Production Readiness** | 3/10 | Not deployable as-is — security issues must be resolved first |

**Overall Health: 5/10** — Solid prototype with a polished visual layer, but significant security and structural gaps that must be addressed before any deployment beyond local development.
