# Phase 6: Polish + Deploy - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Platform reaches production-ready state: LGPD-compliant data controls, WhatsApp sharing with public previews, dark mode toggle, weekly email digest, and advanced auth (admin TOTP, Google OAuth, magic link). Final deployment to bairronow.com.br.

Requirements in scope: AUTH-009, AUTH-013, AUTH-014, VER-011, VER-012, LGPD-02, LGPD-03, LGPD-04, SHAR-01, SHAR-02, SHAR-03, UXDS-02, NOTF-01.

</domain>

<decisions>
## Implementation Decisions

### Advanced Auth — TOTP (AUTH-009)
- **D-01:** TOTP enforced only for users where `IsAdmin=true` — not for regular users.
- **D-02:** Implementation: Google.Authenticator or OtpNet library; QR code shown once at setup; backup codes (8 codes, single-use, stored SHA256-hashed).
- **D-03:** TOTP fields to add to `User`: `TotpSecret string?`, `TotpEnabled bool`, `TotpBackupCodes string?` (JSON array).
- **D-04:** Login flow: standard JWT login succeeds → if `IsAdmin && TotpEnabled` → return `requires_totp: true` + temp token → frontend prompts for 6-digit code → verify → issue final JWT.

### Advanced Auth — Google OAuth (AUTH-013)
- **D-05:** Google Sign-In only — Apple Sign-In explicitly excluded (requires Apple Developer Program $99/yr).
- **D-06:** Auto-link by email: if Google email matches existing account, silently merge — add `GoogleId` to User, return JWT. No user friction.
- **D-07:** Fields to add: `GoogleId string?` on User entity. OAuth flow via ASP.NET Core `Microsoft.AspNetCore.Authentication.Google` package.
- **D-08:** Frontend: Google Sign-In button on login + register pages; on mobile: `expo-auth-session` with Google provider.

### Advanced Auth — Magic Link (AUTH-014)
- **D-09:** Include magic link — low marginal cost since Resend is being wired for other reasons.
- **D-10:** Flow: user enters email → backend generates single-use token (10min TTL, stored hashed in `MagicLinkTokens` table) → Resend sends link → user clicks → JWT issued and token invalidated.
- **D-11:** Frontend: "Entrar sem senha" option on login page; separate `/auth/magic-link` page to consume the token from URL param.

### Email Provider (all transactional + marketing)
- **D-12:** Resend is the primary email provider for ALL emails (transactional + digest).
- **D-13:** Replace the stub `EmailService` with a real Resend HTTP implementation using `Resend.Net` SDK or plain `HttpClient` to `https://api.resend.com/emails`.
- **D-14:** API key stored in `RESEND_API_KEY` environment variable (already in `~/.claude/.secrets.env`).
- **D-15:** From address: `noreply@bairronow.com.br` (Resend domain must be verified for production; use sandbox in dev).

### Weekly Digest (NOTF-01)
- **D-16:** Content: top 3 most-liked posts from the past 7 days + group events starting in the next 7 days, scoped to user's bairro.
- **D-17:** Digest opt-out: `DigestOptOut bool` field on User entity (default false = subscribed). Toggle in notification settings page.
- **D-18:** Delivery: .NET `BackgroundService` polls Monday 09:00 BRT (UTC-3 → 12:00 UTC). Sends only to users with verified email + `DigestOptOut=false`.
- **D-19:** Email template: plain HTML email (no heavy template engine needed). Subject: "O que aconteceu no {BairroName} essa semana".

### LGPD Data Export (LGPD-02)
- **D-20:** Direct JSON download via `GET /api/v1/account/export` — synchronous, no email delivery needed.
- **D-21:** JSON payload includes: profile fields, posts, comments, listings, messages (text only), verification status, notifications.
- **D-22:** Endpoint requires authentication. Rate-limited to 1 request per 24h per user.

### LGPD Account Deletion (LGPD-03)
- **D-23:** Soft anonymization, not hard delete: PII fields set to null/anonymized (Email → deleted+{guid}@bairronow.com.br, DisplayName → "Usuário removido", PhotoUrl → null, Bio → null), `DeletedAt` set, `IsActive=false`.
- **D-24:** Aggregate data (post bodies, listings) retained with author anonymized — preserves community thread integrity.
- **D-25:** Verification documents deleted immediately on account deletion request (LGPD-04 compliance).
- **D-26:** 30-day grace period before anonymization runs (user can cancel). Immediate JWT revocation on deletion request.

### LGPD Document Retention (LGPD-04)
- **D-27:** Verification documents (proof images) deleted 90 days after approval. `BackgroundService` scans daily.
- **D-28:** Physical file deleted from SmarterASP storage; `Verification.DocumentUrl` set to null; soft-delete marker set.

### Dark Mode (UXDS-02)
- **D-29:** Claude's discretion for implementation — use `next-themes` with Tailwind `dark:` variant on web; `useColorScheme` hook on mobile.
- **D-30:** Toggle in top navigation bar (not buried in settings). Persist preference in localStorage (web) and AsyncStorage (mobile).

### WhatsApp Sharing + Public Preview (SHAR-01/02/03)
- **D-31:** Claude's discretion for OG meta tag approach — must work with Next.js static export (`output: 'export'`).
- **D-32:** Public preview routes: `/p/[postId]` (posts) and `/m/[listingId]` (marketplace) — accessible without login, show content + signup CTA.
- **D-33:** WhatsApp share URL: `https://wa.me/?text=Veja+este+post+no+BairroNow:+{url}` (no API key needed).

### VER-011 (OCR) + VER-012 (Vouching)
- **D-34:** Claude's discretion — VER-011 is Could, VER-012 is Could. Planner decides implementation approach. OCR: prefer Tesseract.NET (free, no external API). Vouching: simple 2-signature flow in existing verification admin queue.

### Claude's Discretion
- Dark mode CSS approach details (Tailwind `dark:` variant vs CSS variables)
- Email HTML template design
- OG image generation strategy for public preview
- Tesseract.NET integration approach for OCR

</decisions>

<specifics>
## Specific Ideas

- Digest subject line: "O que aconteceu no {BairroName} essa semana"
- Magic link login: "Entrar sem senha" (not "Magic link" — keeps it natural in PT-BR)
- LGPD export: anonymized email format `deleted+{guid}@bairronow.com.br` — parseable but clearly removed
- WhatsApp share does NOT need WhatsApp Business API — `wa.me` deep link works for any user

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth + User entity
- `src/BairroNow.Api/Models/Entities/User.cs` — Current User fields; Phase 6 adds TotpSecret, TotpEnabled, TotpBackupCodes, GoogleId, DigestOptOut
- `src/BairroNow.Api/Services/AuthService.cs` — Existing login/register flow; TOTP gate added to login path
- `src/BairroNow.Api/Services/IEmailService.cs` — Interface to expand with new email methods

### Email
- `src/BairroNow.Api/Services/EmailService.cs` — **STUB** — replace with real Resend HTTP implementation

### Frontend patterns
- `frontend/src/app/layout.tsx` — Root layout with Outfit font + `bg-bg text-fg` CSS vars; dark mode adds `suppressHydrationWarning` + next-themes provider here
- `frontend/src/app/(auth)/login/page.tsx` — Login page to extend with Google button + magic link option
- `frontend/src/stores/notification-store.ts` — Existing notification Zustand store; digest opt-out setting goes in a new `settings-store.ts`

### Backend program
- `src/BairroNow.Api/Program.cs` — Service registrations; Google OAuth middleware added here

### No external specs
No external specs beyond requirements file — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EmailService` + `IEmailService`: Stub already wired in DI — just replace implementation, no Program.cs changes needed for basic emails
- `BackgroundService` pattern: `GroupEventReminderService` (Phase 5) is the exact pattern for both the digest scheduler and the document retention cleaner
- `NotificationHub`: SignalR hub already has user-scoped notifications — TOTP verification step can use existing patterns
- `getHubConnection()` singleton: already shared between Phase 3 bell and Phase 4 chat — Phase 6 adds no new hub methods

### Established Patterns
- `[Trait("Category", "Unit")]` xUnit pattern for all tests
- Zustand stores per feature domain (`notification-store.ts`, `chat-store.ts`) — settings store follows same pattern
- `page.tsx` (server) → `*Client.tsx` (`use client`) pattern for dynamic routes (established Phase 4)
- `generateStaticParams` must return at least one placeholder for static export dynamic routes

### Integration Points
- TOTP login gate: inject between `LoginAsync()` success and JWT issuance in `AuthController.cs`
- Google OAuth: new `GET /api/v1/auth/google` + `GET /api/v1/auth/google/callback` endpoints in `AuthController.cs`
- Public preview routes (`/p/[postId]`, `/m/[listingId]`): new route group in frontend, no auth middleware
- Digest `BackgroundService`: same scope pattern as `GroupEventReminderService` — `IServiceProvider` → scoped `AppDbContext`

</code_context>

<deferred>
## Deferred Ideas

- Apple Sign-In — explicitly excluded (requires Apple Developer Program $99/yr). Defer to post-launch if iOS audience warrants it.
- Push notifications (MOB-02) — v2 requirement, not Phase 6.
- Redis caching (PERF-01) — v2 requirement.

</deferred>

---

*Phase: 06-polish-deploy*
*Context gathered: 2026-04-12*
