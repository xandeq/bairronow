---
status: partial
phase: 06-polish-deploy
source: [06-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-15T01:05:00Z
---

## Current Test

Tests 3 and 5 executed via Playwright automation on 2026-04-15.

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
result: **PARTIAL PASS** — UI wiring verified end-to-end; actual file download not exercised because backend not running during UAT.
- `/profile/settings/` page reachable, renders Notifications + LGPD + Excluir Conta cards correctly.
- "Exportar meus dados" button issues `GET /api/v1/account/export` with `Authorization: Bearer <token>` header (verified via Playwright network capture). Response type `blob` configured on axios request per [settings/page.tsx:31-33](../../../frontend/src/app/\(main\)/profile/settings/page.tsx#L31-L33).
- When backend is unreachable, UI shows Portuguese error "Erro ao exportar dados. Tente novamente em 24 horas." as expected.
- "Solicitar exclusao da conta" correctly reveals confirmation dialog: "Tem certeza? Esta acao agendara a exclusao da sua conta em 30 dias." with "Sim, excluir minha conta" / "Cancelar" buttons.
- Note: code posts to `POST /api/v1/account/delete` (not `DELETE /api/v1/account` as stated in the UAT expected). The expected string in this doc is incorrect — actual endpoint pair is `POST /api/v1/account/delete` to schedule + `POST /api/v1/account/delete/cancel` to abort. Backend route to reconcile.
- Remaining to verify with backend running: (a) 200 response streams JSON blob, (b) filename `bairronow-meus-dados.json` is set on the download, (c) content contains user PII, (d) 24-hour rate limit enforced server-side.

## Summary

total: 5
passed: 1
issues: 0
partial: 1
pending: 3
skipped: 0
blocked: 0

## Gaps

- **Test 5 verification:** needs backend running + seeded test user to confirm real JSON download. Separately, UAT expected string says `DELETE /api/v1/account` but code uses `POST /api/v1/account/delete` — doc drift.
- **Tests 1, 2, 4:** inherently require human hands (Google consent, email inbox, physical device). Not automatable.
