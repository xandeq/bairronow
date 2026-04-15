---
phase: quick
plan: 260414-ue8
subsystem: frontend/theming
tags: [tailwind-v4, dark-mode, css-variables, uat]
one_liner: "Drop @theme inline so Tailwind v4 utility classes emit var(--color-*) refs, letting .dark overrides cascade; tokenize /feed/ hardcoded bg-white offenders."
requires:
  - UAT Test 3 PlaywrightMCP environment, running dev server
provides:
  - Working dark mode across every component using bg-bg / bg-muted / border-border / text-fg token utilities
  - UAT Test 3 PASS (2026-04-15)
affects:
  - Every page that uses Tailwind token-based color utilities (entire app surface)
  - Two files with previously hardcoded bg-white: FeedHeader.tsx, feed/page.tsx
tech-stack:
  added: []
  patterns:
    - "Tailwind v4: use plain @theme (not @theme inline) when tokens must be runtime-overridable via CSS variables"
    - "Dark mode: toggle .dark class on <html>, override --color-* vars inside .dark { ... } block"
key-files:
  created:
    - frontend/.playwright-mcp/validate-darkmode.mjs (local validation harness; dir is gitignored)
    - frontend/.playwright-mcp/darkmode-fix-before.png (UAT evidence; local disk)
    - frontend/.playwright-mcp/darkmode-fix-after.png (UAT evidence; local disk)
  modified:
    - frontend/src/app/globals.css
    - frontend/src/components/layouts/FeedHeader.tsx
    - frontend/src/app/(main)/feed/page.tsx
    - .planning/phases/06-polish-deploy/06-HUMAN-UAT.md
decisions:
  - "[quick/ue8-dark-mode]: Tailwind v4 @theme inline bakes hex into utilities; use plain @theme so .dark { --color-* } overrides cascade. Solo fix for UAT Test 3 on 2026-04-15."
  - "[quick/ue8-dark-mode]: Out-of-scope files (~28 other bg-white / bg-gray-* offenders) deferred to a broader ui-consistency polish pass — not needed for UAT Test 3."
metrics:
  duration: "~25min"
  completed: 2026-04-15
  tasks_completed: 2
  files_touched: 4
---

# Quick Plan 260414-ue8: Fix Dark Mode (Tailwind v4 @theme inline bug) Summary

## One-Liner

Drop the `inline` keyword from the `@theme` block in `globals.css` so Tailwind v4 utility classes emit `var(--color-*)` references (runtime-overridable) instead of baked-in hex literals — and switch the two hardcoded `bg-white` offenders on `/feed/` (FeedHeader card + empty-state card) to token-based classes so they participate in dark mode.

## What Changed

### Edit 1 — `frontend/src/app/globals.css:5`

Removed the `inline` keyword:

```diff
-@theme inline {
+@theme {
   --color-bg: #ffffff;
   ...
 }
```

**Why it matters:** Per Tailwind v4 docs (verified 2026-04-14 via https://tailwindcss.com/docs/theme), `@theme inline` "will use the theme variable value instead of referencing the actual theme variable." That means utilities like `.bg-bg`, `.bg-muted`, `.border-border`, `.text-fg` were compiling to literal `background-color: #ffffff` etc. and ignoring any runtime CSS variable override. The `.dark { --color-bg: #0f172a; ... }` block at line 40 had no effect on those utilities. Plain `@theme` emits `background-color: var(--color-bg)` so the `.dark` override cascades correctly.

The `--font-sans: var(--font-outfit), ...` token did NOT require the font-in-variable workaround mentioned in the plan — the build ran green with it still inside `@theme` under the new (non-inline) mode. No font regression.

### Edit 2 — `frontend/src/components/layouts/FeedHeader.tsx:12`

```diff
-<header className="flex items-center justify-between bg-white shadow rounded-lg p-3 mb-4">
+<header className="flex items-center justify-between bg-bg border border-border rounded-lg p-3 mb-4">
```

`bg-white` is a hardcoded literal that never responds to the dark class. Swapped to `bg-bg` (light white / dark slate-900 via token). Dropped `shadow` (globals.css disables box-shadow globally) and added `border border-border` for visual separation that survives both themes.

### Edit 3 — `frontend/src/app/(main)/feed/page.tsx:76`

```diff
-<div className="bg-white rounded-lg shadow p-8 text-center">
+<div className="bg-muted border border-border rounded-lg p-8 text-center">
```

Same rationale — empty-state card now uses `bg-muted` (light `#f3f4f6` / dark `#1e293b` via token).

## Evidence

Playwright validation script `frontend/.playwright-mcp/validate-darkmode.mjs` drove headless Chromium against the running dev server at `http://localhost:3000/feed/`:

**LIGHT (before toggle):**
- `html` bg: `rgb(255, 255, 255)`
- `body` bg: `rgb(255, 255, 255)`
- `header` bg: `rgb(255, 255, 255)`
- empty-state card bg: `rgb(243, 244, 246)` (light muted)

**DARK (after clicking ThemeToggle "Modo escuro" button):**
- `html.classList.contains('dark')`: `true`
- `localStorage.theme`: `"dark"`
- `html` bg: `rgb(15, 23, 42)` — dark slate-900
- `body` bg: `rgb(15, 23, 42)`
- `header` bg: `rgb(15, 23, 42)` — token-based `bg-bg` works
- empty-state card bg: `rgb(30, 41, 59)` — dark slate-800, proves `bg-muted` token resolves at runtime

**RELOAD (full page reload with theme=dark in LS):**
- `html.dark` class preserved, `localStorage.theme === 'dark'`, backgrounds still dark on first paint.

All 12 assertions in the validation harness pass.

Screenshots: `frontend/.playwright-mcp/darkmode-fix-before.png` (light) and `frontend/.playwright-mcp/darkmode-fix-after.png` (dark). The `.playwright-mcp/` directory is gitignored, so these artifacts live on local disk only — not in the commit. Raw measurements serialized to `darkmode-measurements.json` in the same directory.

## Commits

- `02438ac` — `fix(ue8): dark mode - drop @theme inline + token-ize feed/FeedHeader bg-white`
- `91834a6` — `test(ue8): verify dark mode fix on /feed/ + mark UAT Test 3 PASS`

## UAT Doc Update

`.planning/phases/06-polish-deploy/06-HUMAN-UAT.md`:
- Test 3 `result: **FAIL**` → `result: **PASS**` with 2026-04-15 fix note + measured dark RGB values + screenshot paths.
- Summary block: `passed: 0 → 1`, `issues: 1 → 0`.
- Gaps section: removed the `Blocker for Test 3: Tailwind v4 @theme inline bug` bullet (now resolved).
- Frontmatter `updated:` bumped to `2026-04-15T01:05:00Z`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright MCP tools unavailable in this environment**

- **Found during:** Task 2 setup
- **Issue:** The orchestrator prompt specified `mcp__playwright__browser_*` tools, but this execution environment does not expose Playwright MCP tools.
- **Fix:** Wrote a standalone Playwright validation script (`frontend/.playwright-mcp/validate-darkmode.mjs`) using the `playwright` npm package. Installed Playwright into a scratch dir (`/tmp/pw-ue8`) because the frontend workspace's pnpm store didn't ship the `playwright` runtime package in `node_modules` (only the browsers were preinstalled under `%LOCALAPPDATA%/ms-playwright`). Script covers all the semantics the plan required: seed `bairronow-auth` into localStorage, navigate to `/feed/`, screenshot, click the `aria-label="Modo escuro"` toggle button, measure computed backgrounds, assert the 6 gate conditions, screenshot, reload, re-measure to assert persistence.
- **Files modified:** new file `frontend/.playwright-mcp/validate-darkmode.mjs`
- **Commit:** bundled with Task 2 commit `91834a6` (file lives under the gitignored `.playwright-mcp/` dir, so it's not in the commit itself — it's a local breadcrumb)

**2. [Rule 3 - Blocking] Feed empty-state card not rendering without a backend**

- **Found during:** Task 2 first validation run
- **Issue:** `/feed/` calls `loadFirst(bairroId)` which hits `/api/v1/posts?...`. With no backend, the page either hung in `loading=true` (assertion target missing) or the request stalled. The empty-state `<div class="bg-muted ...">` only mounts when `items.length === 0 && !loading`.
- **Fix:** Added a `page.route()` intercept in the validation script to stub `/api/v1/posts*` with `200 { items: [], nextCursor: null }` so the feed settles into the empty-state branch cleanly. Also stubbed `/api/v1/notifications` to avoid spinner-in-header noise. Also updated the seeded auth payload `user.bairroId` from the plan's placeholder string `"bairro-vila-velha"` to the numeric `1` because `feedStore.loadFirst` expects a number.
- **Files modified:** `frontend/.playwright-mcp/validate-darkmode.mjs` (refinement before first green run)
- **Commit:** same as above; not in repo.

**3. [Rule 3 - Blocking] Selector for empty-state card initially matched `hover:bg-muted` nav button**

- **Found during:** Task 2 first validation run
- **Issue:** `document.querySelector('[class*="bg-muted"]')` also matches elements with only the `hover:bg-muted` pseudo class, which has `bg: rgba(0,0,0,0)` in its non-hover state — triggered a false negative.
- **Fix:** Tightened the selector to require all three class fragments `bg-muted`, `border-border`, and `p-8` together (the exact class list of the feed empty-state card) before asserting its computed background.
- **Files modified:** same.

### Out-of-Scope Discoveries

The Tailwind `inline` fix inherently restores dark mode for every utility class across the whole app, but ~28 other files still hardcode `bg-white`, `bg-gray-*`, or `text-gray-*` (PostCard, GroupClient, PostComposer, ReportDialog, NotificationBell, map/MapClient, groups pages, privacy-policy, feed/search, admin/moderation, RatingForm, CommentThread, AuthHeader, MainHeader, Footer subset, etc.). These remain light-only in dark mode. Per the plan's `<scope_limits>`, they are explicitly deferred to a broader ui-consistency polish pass and noted in the UAT doc. Not fixed here.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `frontend/src/app/globals.css` (line 5 now `@theme {`, not `@theme inline {`)
- FOUND: `frontend/src/components/layouts/FeedHeader.tsx` (line 12 uses `bg-bg border border-border`)
- FOUND: `frontend/src/app/(main)/feed/page.tsx` (line 76 uses `bg-muted border border-border`)
- FOUND: `.planning/phases/06-polish-deploy/06-HUMAN-UAT.md` (Test 3 `result: **PASS**`, Summary `passed: 1 / issues: 0`, Gaps bullet removed)
- FOUND: `frontend/.playwright-mcp/darkmode-fix-before.png`
- FOUND: `frontend/.playwright-mcp/darkmode-fix-after.png`
- FOUND: commit `02438ac` (Task 1)
- FOUND: commit `91834a6` (Task 2)
- BUILD: `npm run build` in `frontend/` exit 0 — all 36 static pages generated, no TS/lint errors
- PLAYWRIGHT: all 12 runtime assertions passed (6 dark + 4 reload + 2 light sanity)
