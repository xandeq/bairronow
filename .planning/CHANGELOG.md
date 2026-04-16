# Changelog

## v1.0 Honest — 2026-04-16

Post-ship stabilization addressing deploy blockers, concurrency bugs,
LGPD compliance gaps, and frontend dark mode inconsistencies.

### Deploy Blockers Fixed
- `suppressTransaction: true` on FULLTEXT CATALOG migration DDL (`5cd9656`)

### Security / Concurrency
- Atomic UPDATE WHERE for magic link consumption (prevents double-use) (`a8fb458`)
- Atomic UPDATE WHERE for verification approval (prevents double-approval) (`a8fb458`)

### Data Integrity
- Idempotency middleware (`IdempotentAttribute`) + axios `Idempotency-Key` header on POST requests (`730757d`)
- Applied to: PostsController.Create, ListingsController.Create, ChatController.Send

### LGPD Compliance
- Global query filter on User entity (`IsActive`) — soft-deleted users excluded from all queries (`52668ab`)
- Global query filter on Message entity (`DeletedAt`) — deleted messages excluded (`52668ab`)
- Fixed `AccountService.CancelDeletionAsync` and `RunAnonymizationAsync` to use `IgnoreQueryFilters()` (`52668ab`)
- `AnonymizationSchedulerService` — daily BackgroundService that actually calls `RunAnonymizationAsync` (previously unreachable, users stuck in indefinite grace period) (`dc82d2d`)

### Frontend
- Dark mode codemod: 65+ hardcoded `bg-white`/`text-gray-*`/`border-gray-*` classes replaced with design tokens across 19 files (`735a3c1`)
- Added `--color-muted-fg` token (light: #6b7280, dark: #94a3b8) and `--color-card` token
- Created global `error.tsx` and `not-found.tsx` error boundaries (`735a3c1`)
- `.htaccess` rewrite rules for 7 dynamic routes — prevents 404 on shared/refreshed listing/post/chat/group URLs under HostGator Apache (`7065998`)

### UAT
- Test 5 (LGPD export) re-verified end-to-end via Playwright browser: login → export → JSON download → 429 rate limit
- Test 3 (dark mode) supplementary: codemod closes deferred hardcoded-color gap

---

## v1.0 MVP — 2026-04-12

Initial release. 6 phases covering auth, verification, feed, marketplace,
chat, map, groups, and deploy polish. See `.planning/milestones/v1.0-ROADMAP.md`.
