# Changelog

## v1.1 Powerful — 2026-04-16

Operational excellence upgrade: security hardening, observability,
resilience and performance. No user-facing behavior changes — these are
"make v1.0 production-grade" upgrades.

### Security
- `SecurityHeadersMiddleware` — X-Content-Type-Options, X-Frame-Options: DENY,
  Referrer-Policy, Permissions-Policy, CSP (env-aware: Swagger-friendly in
  dev, locked-down in prod), HSTS (only over HTTPS, respects Cloudflare's
  X-Forwarded-Proto). Strips auto-emitted `Server: Kestrel` header. (`8f5b5b8`)

### Performance
- Brotli + Gzip response compression for JSON/JS/CSS/SVG responses (`dff7715`)
- Frontend `<link rel="preconnect">` + `dns-prefetch` to API origin; viewport
  `themeColor` matches active light/dark theme; OpenGraph/Twitter card metadata
  for shareable post/listing URLs (`2a28e12`)
- `AsNoTracking()` on genuinely read-only entity reads in `ChatService.CreateOrGetAsync`
  and `ListingService.ToggleFavoriteAsync` hot paths (`6cf4e87`)

### Observability
- Split `/health/live` (liveness, no deps, always fast) vs `/health/ready`
  (readiness, includes EF DbContext probe); structured JSON responses report
  per-check durations and errors (`57b4290`)
- `CorrelationIdMiddleware` — generates or honors `X-Correlation-Id`, pushes
  to Serilog `LogContext` so every log line carries it; echoes on response
  header and in 500-error body for user-quotable triage IDs (`59ebd78`)
- `UseSerilogRequestLogging` — one structured line per request with method,
  path, status, elapsed ms, user-agent, client IP, userId when authenticated (`59ebd78`)

### Resilience
- `Microsoft.Extensions.Http.Resilience` (Polly v8) standard pipeline on
  `CepLookupService` (ViaCEP + BrasilAPI) and Resend email HTTP clients.
  Retry + timeout + circuit breaker; named "resend" client so the policy
  actually applies (previously `CreateClient()` with no name bypassed it) (`a7937e9`)

---

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
- Scheduler retry-on-failure: `AnonymizationSchedulerService`, `DigestSchedulerService`, `DocumentRetentionService` no longer mark the day "done" before awaiting the real work — transient DB/SMTP failures now retry on the next tick instead of deferring compliance/digest work by a full day or week (`672cd0c`, `869b940`)
- `GroupEventReminderService` — save `ReminderSent` per event instead of once-per-batch; prevents duplicate reminders on partial SignalR failures (`0a293e2`)

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
