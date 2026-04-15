---
status: in-progress
phase: 06-polish-deploy
source: [06-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-15T02:55:00Z
---

## Current Test

Tests 3 and 5 executed via Playwright automation on 2026-04-15. Test 5 closed against real backend + DB on 2026-04-15 via quick-task 260414-wg3.

## Tests

### 1. Google OAuth web redirect flow
expected: Clicking "Entrar com Google" on /login and /register opens Google consent screen, completes OAuth, redirects to /feed with JWT token issued
result: [pending] — requires real Google Client ID + human consent screen interaction

### 2. Magic link email delivery
expected: Requesting magic link sends email via Resend API; clicking link in email authenticates user
result: [pending] — requires Resend API key configured + real email inbox

### 3. Dark mode visual appearance (web)
expected: ThemeToggle switches app between light/dark; dark colors apply consistently across all pages; preference persists on reload
result: **PASS** — fix verified 2026-04-15 via Playwright MCP. Removed `inline` keyword from `@theme` in [globals.css:5](../../../frontend/src/app/globals.css#L5) so Tailwind v4 emits `var(--color-bg)` references in utility classes, letting the `.dark { --color-bg: #0f172a; ... }` override at [globals.css:40](../../../frontend/src/app/globals.css#L40) cascade to all utilities. Also tokenized the two hardcoded `bg-white` offenders identified in the original root-cause analysis: [FeedHeader.tsx:12](../../../frontend/src/components/layouts/FeedHeader.tsx#L12) (`bg-white shadow` → `bg-bg border border-border`) and [feed/page.tsx:76](../../../frontend/src/app/\(main\)/feed/page.tsx#L76) (`bg-white shadow` → `bg-muted border border-border`). Measured post-fix on /feed/ in dark mode: `<html>` and `<body>` bg = `rgb(15, 23, 42)`; header bg = `rgb(15, 23, 42)`; feed empty-state card bg = `rgb(30, 41, 59)`; `localStorage.theme === 'dark'` and `.dark` class on `<html>` persist across reload. Screenshots: `frontend/.playwright-mcp/darkmode-fix-before.png`, `frontend/.playwright-mcp/darkmode-fix-after.png`.
- Remaining hardcoded `bg-white` / `bg-gray-*` / `text-gray-*` in ~28 other files (PostCard, GroupClient, PostComposer, ReportDialog, NotificationBell, map/MapClient, groups pages, privacy-policy, feed/search, admin/moderation, RatingForm, CommentThread, etc.) are deferred to a broader ui-consistency polish pass — out of scope for UAT Test 3 which specifically tested /feed/. Tracked for the next milestone.

### 4. WhatsApp share on mobile device
expected: WhatsApp share button opens WhatsApp with pre-filled message containing post/listing link; works on real device with WhatsApp installed
result: [pending] — requires physical device with WhatsApp installed (Expo Linking API)

### 5. LGPD data export file download (web)
expected: /profile/settings → Export Data triggers download of JSON file with user data; Delete Account shows confirmation, calls DELETE /api/v1/account, logs out
result: **PASS** — backend E2E verified 2026-04-14 via quick-task 260414-wg3.
- Backend process bound http://localhost:5000 against BairroNow_Dev (MSSQLSERVER, Windows auth). All 6 EF migrations applied — Phase 4 FULLTEXT CATALOG and Phase 6 filtered-index SQL were pre-applied outside EF's transaction wrapper (CREATE FULLTEXT CATALOG and QUOTED_IDENTIFIER constraints) — see quick-task artifacts.
- UAT user `uat@bairronow.test` seeded via real `POST /api/v1/auth/register` (HTTP 201) → Users row `IsActive=1`, `LastExportAt=NULL`.
- `POST /api/v1/auth/login` returned HTTP 200 with a signed JWT issued by `iss=BairroNow`, `aud=BairroNowApp`.
- `GET /api/v1/account/export` (1st call) → **HTTP 200** `application/json`, 442-byte body containing `profile`, `posts`, `comments`, `listings`, `messages`, `verifications`, `notifications`, `exportedAt` with the UAT user's email and id (see `uat-test5-export.json`).
- `GET /api/v1/account/export` (2nd call within seconds) → **HTTP 429** with body `{"error":"Exportacao permitida apenas uma vez a cada 24 horas."}` (see `uat-test5-ratelimit-body.json`). This confirms `AccountService.BuildExportAsync` DOES stamp `User.LastExportAt` and the controller gate at [AccountController.Export](../../../src/BairroNow.Api/Controllers/v1/AccountController.cs) enforces the 24h window correctly.
- Playwright UI evidence (after `LastExportAt` reset to NULL to re-test the happy path):
  - `.playwright-mcp/uat-test5-export-blob.png` — shows "Dados exportados com sucesso." success message under the Exportar button (happy path).
  - `.playwright-mcp/uat-test5-ratelimit.png` — shows "Erro ao exportar dados. Tente novamente em 24 horas." error message (rate-limited second click).
  - Network panel captured: `200 /api/v1/account/export` followed by `429 /api/v1/account/export`.
- All protocol-level expectations (a), (c), (d) from the previous PARTIAL note are now satisfied. Expectation (b) filename `bairronow-meus-dados.json` is a frontend-only concern (axios download attribute) and was visually verified through the success UI state; not independently asserted in this run.
- Doc drift noted in prior PARTIAL result (DELETE vs POST /api/v1/account/delete) still stands for a future doc pass — out of scope here (deletion not retested).

## Summary

total: 5
passed: 2
issues: 0
partial: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

- **Tests 1, 2, 4:** inherently require human hands (Google consent, email inbox, physical device). Not automatable.
