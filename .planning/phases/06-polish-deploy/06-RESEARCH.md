# Phase 6: Polish + Deploy - Research

**Researched:** 2026-04-12
**Domain:** Advanced auth (TOTP, OAuth, magic link), LGPD compliance, email delivery, dark mode, WhatsApp sharing, OCR/vouching, deployment
**Confidence:** HIGH (core stack verified; OCR on shared hosting is MEDIUM)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** TOTP enforced only for users where `IsAdmin=true` — not for regular users.
- **D-02:** OtpNet library; QR code shown once at setup; backup codes (8 codes, single-use, stored SHA256-hashed).
- **D-03:** TOTP fields to add to `User`: `TotpSecret string?`, `TotpEnabled bool`, `TotpBackupCodes string?` (JSON array).
- **D-04:** Login flow: standard JWT login succeeds → if `IsAdmin && TotpEnabled` → return `requires_totp: true` + temp token → frontend prompts for 6-digit code → verify → issue final JWT.
- **D-05:** Google Sign-In only — Apple Sign-In explicitly excluded.
- **D-06:** Auto-link by email: if Google email matches existing account, silently merge — add `GoogleId` to User, return JWT.
- **D-07:** Fields to add: `GoogleId string?` on User entity. OAuth flow via ASP.NET Core `Microsoft.AspNetCore.Authentication.Google` package.
- **D-08:** Frontend: Google Sign-In button on login + register pages; on mobile: `expo-auth-session` with Google provider.
- **D-09:** Include magic link — low marginal cost since Resend is being wired.
- **D-10:** Flow: user enters email → backend generates single-use token (10min TTL, stored hashed in `MagicLinkTokens` table) → Resend sends link → user clicks → JWT issued and token invalidated.
- **D-11:** Frontend: "Entrar sem senha" option on login page; separate `/auth/magic-link` page to consume the token from URL param.
- **D-12:** Resend is the primary email provider for ALL emails (transactional + digest).
- **D-13:** Replace the stub `EmailService` with a real Resend HTTP implementation using `Resend.Net` SDK or plain `HttpClient`.
- **D-14:** API key stored in `RESEND_API_KEY` environment variable.
- **D-15:** From address: `noreply@bairronow.com.br`.
- **D-16:** Digest content: top 3 most-liked posts from past 7 days + group events starting in next 7 days, scoped to user's bairro.
- **D-17:** Digest opt-out: `DigestOptOut bool` field on User entity (default false). Toggle in notification settings page.
- **D-18:** Delivery: .NET `BackgroundService` polls Monday 09:00 BRT (UTC-3 → 12:00 UTC). Sends only to users with verified email + `DigestOptOut=false`.
- **D-19:** Email template: plain HTML. Subject: "O que aconteceu no {BairroName} essa semana".
- **D-20:** Direct JSON download via `GET /api/v1/account/export` — synchronous, no email delivery.
- **D-21:** JSON payload includes: profile fields, posts, comments, listings, messages (text only), verification status, notifications.
- **D-22:** Endpoint requires authentication. Rate-limited to 1 request per 24h per user.
- **D-23:** Soft anonymization: Email → `deleted+{guid}@bairronow.com.br`, DisplayName → "Usuário removido", PhotoUrl → null, Bio → null. `DeletedAt` set, `IsActive=false`.
- **D-24:** Aggregate data (post bodies, listings) retained with author anonymized.
- **D-25:** Verification documents deleted immediately on account deletion request.
- **D-26:** 30-day grace period before anonymization runs. Immediate JWT revocation on deletion request.
- **D-27:** Verification documents deleted 90 days after approval. `BackgroundService` scans daily.
- **D-28:** Physical file deleted from SmarterASP storage; `Verification.DocumentUrl` set to null; soft-delete marker set.
- **D-29:** Dark mode: `next-themes` with Tailwind `dark:` variant on web; `useColorScheme` hook on mobile.
- **D-30:** Toggle in top navigation bar. Persist in localStorage (web) and AsyncStorage (mobile).
- **D-31:** Claude's discretion for OG meta tag approach — must work with Next.js static export.
- **D-32:** Public preview routes: `/p/[postId]` (posts) and `/m/[listingId]` (marketplace) — no login required, signup CTA.
- **D-33:** WhatsApp share URL: `https://wa.me/?text=Veja+este+post+no+BairroNow:+{url}` (no API key needed).
- **D-34:** VER-011 OCR: prefer Tesseract.NET (free, no external API). VER-012 vouching: simple 2-signature flow in existing verification admin queue.

### Claude's Discretion
- Dark mode CSS approach details (Tailwind `dark:` variant vs CSS variables)
- Email HTML template design
- OG image generation strategy for public preview
- Tesseract.NET integration approach for OCR

### Deferred Ideas (OUT OF SCOPE)
- Apple Sign-In — explicitly excluded (requires Apple Developer Program $99/yr)
- Push notifications (MOB-02) — v2 requirement
- Redis caching (PERF-01) — v2 requirement
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-009 | 2FA for admins via TOTP (Google Authenticator, Authy). Backup codes on activation. | Otp.NET 1.4.1 confirmed. TOTP login gate pattern documented. |
| AUTH-013 | Social login via Google OAuth2. Link with existing account by email. | Microsoft.AspNetCore.Authentication.Google 8.0.x confirmed. Callback→JWT pattern documented. |
| AUTH-014 | Magic link login — passwordless via email link (10min TTL, single-use). | Resend confirmed. MagicLinkTokens table pattern documented. |
| VER-011 | OCR on proof documents — auto-extract name, address, date. | TesseractOCR 5.5.2 viable but requires native binary attention on SmarterASP. |
| VER-012 | Neighbor vouching — 2 verified neighbors vouch for new user. | Simple DB-level flow; no new library needed. |
| LGPD-02 | User can export personal data (JSON download). | Standard EF Core query; rate-limit via custom in-memory tracker pattern. |
| LGPD-03 | User can request account deletion (anonymize data, remove PII). | Soft anonymization pattern. 30-day grace via `DeleteRequestedAt` field. |
| LGPD-04 | Verification documents have retention policy (delete after 90 days post-approval). | BackgroundService pattern established via GroupEventReminderService. |
| SHAR-01 | WhatsApp share button on posts (deep link). | wa.me link pattern confirmed. |
| SHAR-02 | WhatsApp share button on marketplace listings. | Same wa.me pattern. |
| SHAR-03 | Shared links show public preview + CTA to sign up. | Static metadata in generateStaticParams routes confirmed. |
| UXDS-02 | Dark mode support (toggle in settings). | next-themes 0.4.6 + suppressHydrationWarning pattern confirmed. |
| NOTF-01 | Weekly email digest with top posts/events. | BackgroundService + Resend pattern. UTC 12:00 Monday for BRT 09:00. |
</phase_requirements>

---

## Summary

Phase 6 stitches together 13 requirements across 7 technical domains: advanced auth (TOTP/OAuth/magic-link), email delivery via Resend, LGPD data controls, WhatsApp sharing with static OG previews, dark mode, weekly digest, and optional OCR/vouching. All domains are buildable within the established stack — no architecture changes required.

The most critical integration point is the **Google OAuth callback flow**: because the app uses a custom JWT (not cookie sessions), the standard ASP.NET cookie-based OAuth callback must be intercepted and re-issued as a JWT. This is a well-known pattern but requires deliberate wiring. The second constraint is the **Next.js static export + OG metadata** interaction: `generateMetadata` works with dynamic routes only when `generateStaticParams` provides placeholder paths, and the metadata must be static (fetched at build time or hard-coded), not runtime-dynamic.

The rest of the work — BackgroundService patterns, EF migrations, Zustand stores, Tailwind dark variant — follows patterns already established in Phases 1-5.

**Primary recommendation:** Tackle the Google OAuth callback→JWT bridge and the OG metadata constraint first (they have the most surprising failure modes). All other items follow existing project patterns.

---

## Standard Stack

### New Packages Required

#### Backend (.NET 8)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `Otp.NET` (NuGet: `Otp.NET`) | 1.4.1 | TOTP generation + verification for admin 2FA | RFC 6238 compliant, widely used, zero external deps. Confirmed on NuGet 2025. |
| `Microsoft.AspNetCore.Authentication.Google` | 8.0.x (pin to 8.0.*) | Google OAuth middleware | Built-in ASP.NET Core social auth. **Pin to 8.0.x** — latest is 10.0.5 but project targets net8.0. |
| `Resend` (NuGet: `Resend`) | 0.2.2 | Email delivery (replaces stub EmailService) | Official Resend .NET SDK. Registered as `IResend` in DI. HttpClient-based. |
| `TesseractOCR` | 5.5.2 | OCR pre-validation on proof documents (VER-011, Could) | Bundles native binaries, .NET Standard 2.0+ compatible. See pitfalls — SmarterASP native binary risk. |

#### Frontend (Next.js)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next-themes` | 0.4.6 | Dark mode theme provider | Prevents flash-of-unstyled-content; injects blocking script before render; `suppressHydrationWarning` pattern. |

#### Mobile (Expo SDK 54)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-auth-session` | 55.0.13 (bundled with Expo SDK 54) | Google OAuth flow on mobile | Used for Google Sign-In in Expo managed workflow |
| `expo-crypto` | (peer dep of expo-auth-session) | PKCE challenge generation | Required alongside expo-auth-session |
| `@react-native-google-signin/google-signin` | 16.1.2 | Alternative native Google Sign-In | Only if native feel required; expo-auth-session is simpler for managed workflow |

### Installation Commands

```bash
# Backend
cd src/BairroNow.Api
dotnet add package Otp.NET --version 1.4.1
dotnet add package Microsoft.AspNetCore.Authentication.Google --version 8.0.25
dotnet add package Resend --version 0.2.2
# VER-011 OCR (Could — defer if SmarterASP native binary test fails):
dotnet add package TesseractOCR --version 5.5.2

# Frontend
cd frontend
pnpm add next-themes@0.4.6

# Mobile (Expo SDK 54 — expo-auth-session already included via expo, add crypto peer dep if missing)
cd mobile
pnpm add expo-crypto
```

---

## Architecture Patterns

### Pattern 1: Google OAuth → JWT Bridge

**What:** ASP.NET Core's AddGoogle middleware handles the OAuth redirect dance and provides a `ClaimsPrincipal`. Because this app uses custom JWTs (not cookie sessions), the callback handler must extract the Google email, look up or create the user, and return the app's own JWT via redirect to the frontend.

**The problem:** `AddGoogle` defaults to cookie-based `ExternalCookie` scheme. With a SPA frontend that expects JWT, you must handle the `OnTicketReceived` callback, suppress the default cookie sign-in, and issue your own JWT.

**Flow:**
```
GET /api/v1/auth/google
  → redirects to Google consent screen
  → Google redirects to /api/v1/auth/google/callback
  → OnTicketReceived: extract email, upsert user (set GoogleId), generate JWT
  → redirect to frontend /auth/callback?token={jwt}&refresh={refreshToken}
  → frontend stores JWT in memory, refresh in cookie
```

**Registration in Program.cs:**
```csharp
// After .AddJwtBearer(...)
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Google:ClientId"]
        ?? throw new InvalidOperationException("Google ClientId not configured");
    options.ClientSecret = builder.Configuration["Google:ClientSecret"]
        ?? throw new InvalidOperationException("Google ClientSecret not configured");
    options.CallbackPath = "/api/v1/auth/google/callback";
    options.Events.OnTicketReceived = async ctx =>
    {
        // Suppress default cookie sign-in
        ctx.HandleResponse();
        var email = ctx.Principal!.FindFirstValue(ClaimTypes.Email)!;
        var googleId = ctx.Principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
        // upsert user, issue JWT, redirect to frontend
        var authService = ctx.HttpContext.RequestServices.GetRequiredService<IAuthService>();
        var (jwt, refresh) = await authService.GoogleSignInAsync(email, googleId, ipAddress);
        ctx.Response.Redirect($"{frontendUrl}/auth/callback?token={jwt}");
    };
});
```

**Confidence:** MEDIUM — pattern verified via Microsoft Learn + community tutorials; exact code is illustrative.

---

### Pattern 2: TOTP Admin Gate

**What:** After standard `LoginAsync` succeeds for an admin with `TotpEnabled=true`, return an intermediate response instead of the final JWT. The frontend then prompts for the 6-digit code and calls a second endpoint.

**Two-step endpoints:**
```
POST /api/v1/auth/login
  → if admin && TotpEnabled: 200 { requires_totp: true, temp_token: "<short-lived JWT with claim totp_pending: true>" }
  → else: 200 { access_token, ... }

POST /api/v1/auth/login/totp-verify
  → Body: { temp_token, code }
  → Validates code with Otp.NET, issues final JWT
```

**OtpNet usage:**
```csharp
using OtpNet;

// Setup (generate once, store base32 in TotpSecret):
var key = KeyGeneration.GenerateRandomKey(20);
var totp = new Totp(key);
var base32Secret = Base32Encoding.ToString(key);
// Verification:
var totp = new Totp(Base32Encoding.ToBytes(user.TotpSecret!));
bool valid = totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));
```

**QR Code generation:** Use `otpauth://totp/BairroNow:{email}?secret={secret}&issuer=BairroNow` — the frontend renders this URI as a QR code using a client-side library (e.g., `qrcode.react`) or returns the URI string for the user to manually enter in Authenticator apps.

**Confidence:** HIGH — Otp.NET API verified via GitHub/NuGet.

---

### Pattern 3: Magic Link Flow

**New entity:**
```csharp
public class MagicLinkToken
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;  // SHA256 hash
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**Flow:**
```
POST /api/v1/auth/magic-link/request  { email }
  → Generate 32-byte random token → SHA256 hash → store in MagicLinkTokens
  → Resend: "Clique aqui para entrar: {frontendUrl}/auth/magic-link?token={rawToken}"

GET /api/v1/auth/magic-link/verify?token={rawToken}
  → SHA256 hash input → lookup → check expiry + used
  → Mark Used=true → issue JWT → redirect to frontend
```

**Confidence:** HIGH — standard pattern, no library surprise.

---

### Pattern 4: Resend EmailService Replacement

The stub `EmailService` is wired as `IEmailService` in DI. Replace the implementation; no `Program.cs` DI changes needed for existing methods.

**IEmailService — extended interface:**
```csharp
public interface IEmailService
{
    Task SendConfirmationEmailAsync(string email, string token);
    Task SendPasswordResetEmailAsync(string email, string token);
    Task SendMagicLinkAsync(string email, string magicUrl);
    Task SendVerificationStatusAsync(string email, string status, string? reason);
    Task SendWeeklyDigestAsync(string email, string bairroName, DigestData data);
    Task SendAccountDeletionConfirmationAsync(string email);
}
```

**Resend SDK registration in Program.cs:**
```csharp
builder.Services.AddOptions<ResendClientOptions>()
    .Configure(o => o.ApiToken = builder.Configuration["RESEND_API_KEY"]
        ?? throw new InvalidOperationException("RESEND_API_KEY not configured"));
builder.Services.AddHttpClient<ResendClient>();
builder.Services.AddTransient<IResend, ResendClient>();
// Then EmailService takes IResend in constructor — replace IEmailService registration:
builder.Services.AddScoped<IEmailService, ResendEmailService>();
```

**Confidence:** HIGH — Resend NuGet 0.2.2 confirmed; SDK usage from official GitHub.

---

### Pattern 5: BackgroundService for Digest + Document Retention

Both follow the **exact `GroupEventReminderService` pattern** already in the codebase: `IServiceProvider` → `CreateScope()` → resolve scoped `AppDbContext`.

**DigestSchedulerService — timing check:**
```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var now = DateTime.UtcNow;
        // Monday = DayOfWeek.Monday, 12:00 UTC = 09:00 BRT
        if (now.DayOfWeek == DayOfWeek.Monday && now.Hour == 12 && now.Minute < 5)
        {
            await SendDigests(stoppingToken);
        }
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
    }
}
```

**DocumentRetentionService — daily scan:**
```csharp
// Runs daily; deletes Verification.ProofFilePath where Status == Approved
// AND ApprovedAt < DateTime.UtcNow.AddDays(-90)
// Sets DocumentUrl = null, IsDocumentDeleted = true on Verification
```

Note: `Verification` entity currently has `ProofFilePath` (not `DocumentUrl`). The plan must use the correct field name `ProofFilePath` and add a `DocumentDeletedAt DateTime?` field via migration.

**Confidence:** HIGH — pattern directly observed in GroupEventReminderService.

---

### Pattern 6: LGPD Data Export

```csharp
// GET /api/v1/account/export
// Rate limit: track LastExportAt on User (add field); reject if < 24h ago
[HttpGet("export")]
[Authorize]
public async Task<IActionResult> Export()
{
    var userId = GetUserId();
    var user = await _db.Users.FindAsync(userId);
    if (user!.LastExportAt.HasValue && DateTime.UtcNow - user.LastExportAt.Value < TimeSpan.FromHours(24))
        return StatusCode(429, new { error = "Limite de 1 exportação por 24 horas." });

    user.LastExportAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    var data = await _accountService.BuildExportAsync(userId);
    var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
    return File(Encoding.UTF8.GetBytes(json), "application/json", "bairronow-dados-pessoais.json");
}
```

User fields to add: `LastExportAt DateTime?`, `DeleteRequestedAt DateTime?`, `DeletedAt DateTime?`, `IsActive bool` (default true).

**Confidence:** HIGH — standard EF Core + Controller pattern.

---

### Pattern 7: Dark Mode (next-themes + Tailwind v4)

**Critical constraint:** The project uses **Tailwind v4** (confirmed in `package.json`: `"tailwindcss": "^4"`). Tailwind v4 handles dark mode differently from v3.

In Tailwind v4, the `dark:` variant is controlled via CSS `@variant dark` or `@media (prefers-color-scheme: dark)` — it does NOT use `darkMode: 'class'` in `tailwind.config.js` (there is no config file in v4 by default). To use class-based dark mode with next-themes in Tailwind v4, you must add:

```css
/* In globals.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

This tells Tailwind v4 that `.dark` class on an ancestor activates `dark:` variants. Then next-themes adds `class="dark"` to `<html>` when theme is dark.

**layout.tsx change:**
```tsx
// Add suppressHydrationWarning to <html> and wrap body with ThemeProvider
import { ThemeProvider } from 'next-themes';

<html lang="pt-BR" suppressHydrationWarning className={...}>
  <body ...>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  </body>
</html>
```

ThemeProvider must be a Client Component — either import `next-themes` directly (it's already client-only) or wrap in a `'use client'` providers component.

**Toggle component (nav bar):**
```tsx
'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // Avoid hydration mismatch
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

**Mobile (React Native):** Use `useColorScheme` from `react-native` + `AsyncStorage` for persistence. No library needed.

**Confidence:** MEDIUM-HIGH — next-themes 0.4.6 confirmed; Tailwind v4 custom-variant pattern verified via docs.

---

### Pattern 8: WhatsApp Sharing + Public Preview Routes

**Static export + OG metadata constraint:**

With `output: 'export'`, `generateMetadata` works for dynamic routes **only** if `generateStaticParams` returns pre-known IDs at build time. For a social platform with content created at runtime, this means:

**Option A (Recommended — Client-side metadata injection):** Public preview routes (`/p/[postId]`, `/m/[listingId]`) fetch post/listing data at runtime on the client. Pre-render a static shell with generic OG tags. At share time, use the API to generate a shareable URL pointing to an API endpoint that returns proper OG headers (a thin server-side route). However: SmarterASP API endpoint can serve OG tags for scrapers.

**Option B (Practical for MVP):** Add a dedicated API endpoint `GET /api/v1/preview/post/{id}` that returns OG-friendly HTML (`text/html` with `<meta>` tags). The WhatsApp/Facebook scraper hits this URL. The `wa.me` link points to this preview page (which redirects humans to the frontend app).

**Recommended for static export MVP:** Embed static OG tags in the `/p/[postId]` route with generic content (`BairroNow - Veja este post no seu bairro`) and a fixed OG image (1200x630 PNG, checked into `public/`). This avoids runtime server dependency while still satisfying WhatsApp's scraper. Dynamic per-post OG images require a server component or API route handler — incompatible with `output: 'export'`.

**WhatsApp share button:**
```tsx
const shareUrl = `https://bairronow.com.br/p/${post.id}`;
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Veja este post no BairroNow: ${shareUrl}`)}`;
<a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Compartilhar no WhatsApp</a>
```

**Static OG tags for /p/[postId]/page.tsx (static shell):**
```tsx
export const metadata: Metadata = {
  title: 'BairroNow — Post do Bairro',
  openGraph: {
    title: 'BairroNow — Veja o que está acontecendo no bairro',
    description: 'Conecte-se com seus vizinhos no BairroNow.',
    images: [{ url: 'https://bairronow.com.br/og-default.png', width: 1200, height: 630 }],
    type: 'website',
  },
};
```

**Confidence:** MEDIUM — Next.js static export OG metadata confirmed; WhatsApp preview behavior with static images is well-documented; dynamic per-post images are not feasible with `output: 'export'`.

---

### Pattern 9: VER-011 OCR (Could)

**SmarterASP shared hosting constraint:** Tesseract requires native binaries (`libleptonica-*.dll`, `libtesseract*.dll` on Windows). SmarterASP shared hosting runs IIS with limited permissions. Native DLL loading in a restricted AppPool may be blocked.

**Recommended approach:** Use `TesseractOCR` (v5.5.2) which bundles Windows x64 native binaries. Extract to `wwwroot/tessdata/` on deployment. Test with a minimal smoke test before committing to the plan wave that implements OCR.

**Fallback:** If native binaries fail on SmarterASP, implement OCR as a stub that always returns `null` (pre-validation optional). VER-011 is a Could requirement — admin manual review already works.

**Confidence:** MEDIUM — TesseractOCR 5.5.2 confirmed on NuGet; native binary behavior on SmarterASP is UNTESTED.

---

### Pattern 10: VER-012 Vouching (Could)

No new library. Simple two-row DB table:

```csharp
public class VerificationVouch
{
    public int Id { get; set; }
    public Guid VoucheeId { get; set; }   // user being vouched for
    public Guid VoucherId { get; set; }    // verified neighbor vouching
    public DateTime CreatedAt { get; set; }
}
```

Admin queue shows pending verifications with vouch count. When `VouchCount >= 2`, admin can approve in one click (same approve flow as document-based).

**Confidence:** HIGH — pure application logic, no library dependency.

---

## Recommended Project Structure Additions

```
src/BairroNow.Api/
├── Models/Entities/
│   ├── MagicLinkToken.cs         # AUTH-014
│   └── VerificationVouch.cs      # VER-012
├── Services/
│   ├── ResendEmailService.cs      # replaces EmailService.cs stub
│   ├── DigestSchedulerService.cs  # NOTF-01 BackgroundService
│   ├── DocumentRetentionService.cs # LGPD-04 BackgroundService
│   ├── AccountService.cs          # LGPD-02/03 export + deletion logic
│   └── OcrService.cs              # VER-011 (Could)
└── Controllers/v1/
    └── AccountController.cs       # LGPD-02/03 endpoints

frontend/src/
├── app/
│   ├── p/[postId]/
│   │   ├── page.tsx              # SHAR-03 public post preview (server wrapper)
│   │   └── PostPreviewClient.tsx # client component
│   └── m/[listingId]/
│       ├── page.tsx              # SHAR-03 public listing preview
│       └── ListingPreviewClient.tsx
├── components/
│   ├── ThemeToggle.tsx           # UXDS-02
│   └── providers/
│       └── ThemeProvider.tsx     # next-themes wrapper
└── stores/
    └── settings-store.ts         # DigestOptOut + theme preferences (Zustand)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TOTP code generation/verification | Custom HMAC-SHA1 time window math | `Otp.NET` 1.4.1 | RFC 6238 edge cases: clock drift, ±1 window, byte encoding |
| Google OAuth redirect dance | Custom OAuth2 state + PKCE flow | `Microsoft.AspNetCore.Authentication.Google` | CSRF protection via state param, token exchange, UserInfo fetch already handled |
| Transactional email delivery | Custom SMTP client | `Resend` SDK 0.2.2 | SPF/DKIM alignment, retry, bounce handling |
| Dark mode flash prevention | `localStorage` read in `useEffect` | `next-themes` 0.4.6 | next-themes injects a blocking inline script that runs before React hydration, eliminating the flash |
| OTP backup codes | Custom crypto | `System.Security.Cryptography.RandomNumberGenerator` + SHA256 | Use .NET built-ins; the storage format (JSON array of hashes) is trivial |

---

## Common Pitfalls

### Pitfall 1: Google OAuth Cookie vs. JWT Architecture Mismatch
**What goes wrong:** `AddGoogle` by default issues an `ExternalCookie` and redirects to `/signin-google`. A pure JWT SPA never reads this cookie, leaving the user stuck.
**Why it happens:** The default ASP.NET social auth pipeline assumes cookie-based sessions.
**How to avoid:** Intercept `OnTicketReceived` event, call `ctx.HandleResponse()` to suppress cookie issuance, generate your own JWT, and redirect to the frontend with the token as a query parameter or via a short-lived exchange.
**Warning signs:** `CookieAuthenticationOptions` errors in logs; frontend never receives a JWT after Google redirect.

### Pitfall 2: next-themes Hydration Mismatch on Static Export
**What goes wrong:** Theme flashes or React throws hydration mismatch warnings because the server-rendered HTML has no class on `<html>`, but next-themes adds `dark` or `light` class client-side.
**Why it happens:** Static export has no server runtime to know the user's preferred theme.
**How to avoid:** Add `suppressHydrationWarning` to the `<html>` element. Wrap any UI that reads `useTheme()` in a `mounted` guard (`useEffect(() => setMounted(true), [])`).
**Warning signs:** Console warning "Text content did not match"; visible flash of wrong theme on first load.

### Pitfall 3: Tailwind v4 Dark Mode Class Not Activating
**What goes wrong:** `dark:bg-gray-900` has no effect even though `<html class="dark">` is present.
**Why it happens:** Tailwind v4 does not read `darkMode: 'class'` from tailwind.config.js (v3 pattern). Without an explicit `@custom-variant dark` in CSS, the `dark:` variant uses `prefers-color-scheme` media query, ignoring the class.
**How to avoid:** Add `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css`.
**Warning signs:** Dark styles apply on OS dark mode but not when toggling the class manually.

### Pitfall 4: TesseractOCR Native Binaries on SmarterASP
**What goes wrong:** `System.DllNotFoundException: Unable to load shared library 'libleptonica' or one of its dependencies`.
**Why it happens:** SmarterASP IIS AppPool may run with restricted permissions that prevent loading native DLLs from the deployment directory.
**How to avoid:** Test OCR in a minimal endpoint (`GET /api/v1/admin/ocr-health`) before building the full VER-011 implementation. If it fails, fall back to stub/manual-only. VER-011 is a Could requirement.
**Warning signs:** App starts but OCR endpoint throws DllNotFoundException or AccessDeniedException.

### Pitfall 5: Magic Link Token URL Encoding
**What goes wrong:** Base64 token contains `+`, `/`, `=` which break as URL query parameters.
**Why it happens:** Standard `Convert.ToBase64String()` output is not URL-safe.
**How to avoid:** Use `Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')` (URL-safe Base64) or use `WebEncoders.Base64UrlEncode()` from `Microsoft.AspNetCore.WebUtilities`.
**Warning signs:** 400 errors on magic link verify endpoint; token not found in DB.

### Pitfall 6: DigestScheduler Double-Firing
**What goes wrong:** The BackgroundService fires the digest multiple times on Monday 12:00 UTC because it checks every minute and the condition is true for the entire 12:00 hour.
**Why it happens:** `now.Hour == 12 && now.Minute < 5` window is 5 minutes wide; multiple iterations match.
**How to avoid:** Track `LastDigestSentDate` (static field or DB record). Only send if `LastDigestSentDate != today`.
**Warning signs:** Users receive multiple digest emails on Monday.

### Pitfall 7: LGPD Export Missing Soft-Deleted Records
**What goes wrong:** Export query misses soft-deleted posts/listings because of global query filters.
**Why it happens:** EF Core global query filters that exclude `IsDeleted=true` are applied automatically.
**How to avoid:** Use `.IgnoreQueryFilters()` on the export query so users get their full data history including deleted items (LGPD requires comprehensive export).
**Warning signs:** User reports export is missing their deleted posts.

### Pitfall 8: Public Preview Routes With Static Export — generateStaticParams Required
**What goes wrong:** `/p/[postId]` builds fail with "Dynamic segments must have a generateStaticParams function" error.
**Why it happens:** `output: 'export'` requires all dynamic routes to be pre-rendered.
**How to avoid:** Return at least one placeholder from `generateStaticParams` (established Phase 4 pattern). Public preview pages use client-side fetch for actual content. The page shell is static.
**Warning signs:** `next build` fails with dynamic route error for `/p/[postId]`.

---

## Code Examples

### OtpNet — QR Setup + Verification
```csharp
// Source: github.com/kspearrin/Otp.NET
using OtpNet;

// Generate secret (run once at TOTP setup):
var key = KeyGeneration.GenerateRandomKey(20);
var secret = Base32Encoding.ToString(key);
var otpAuthUri = $"otpauth://totp/BairroNow:{Uri.EscapeDataString(email)}?secret={secret}&issuer=BairroNow";

// Verify code submitted by user:
bool IsValidCode(string secret, string userCode)
{
    var totp = new Totp(Base32Encoding.ToBytes(secret));
    return totp.VerifyTotp(userCode, out _, new VerificationWindow(previous: 1, future: 1));
}
```

### Resend EmailService — Send Method
```csharp
// Source: github.com/resend/resend-dotnet
public class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private const string From = "noreply@bairronow.com.br";

    public ResendEmailService(IResend resend) => _resend = resend;

    public async Task SendMagicLinkAsync(string email, string magicUrl)
    {
        var message = new EmailMessage
        {
            From = From,
            To = [email],
            Subject = "Seu link de acesso ao BairroNow",
            HtmlBody = $"<p>Clique no link abaixo para entrar:</p><a href='{magicUrl}'>{magicUrl}</a><p>Válido por 10 minutos.</p>"
        };
        await _resend.EmailSendAsync(message);
    }
}
```

### next-themes — globals.css (Tailwind v4)
```css
/* Source: Tailwind v4 docs + next-themes README */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

### BackgroundService Digest Timing Guard
```csharp
// Prevent double-fire with a tracked date
private DateOnly _lastDigestDate = DateOnly.MinValue;

protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        if (now.DayOfWeek == DayOfWeek.Monday
            && now.Hour == 12 && now.Minute < 5
            && _lastDigestDate != today)
        {
            _lastDigestDate = today;
            await SendDigests(stoppingToken);
        }
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
    }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: 'class'` in tailwind.config.js | `@custom-variant dark` in CSS | Tailwind v4 (2025) | Must add CSS line; no config file needed |
| `AddGoogle` → Cookie → ASP.NET Identity | `OnTicketReceived` intercept → custom JWT | Ongoing (SPA pattern) | Deliberate wiring required; not "just works" |
| Resend via raw HttpClient | Official `Resend` NuGet SDK 0.2.2 | 2024 | SDK simplifies DI registration and typed response |
| expo-auth-session for all OAuth | `@react-native-google-signin/google-signin` preferred for native UX | Expo recommendation 2025 | expo-auth-session still works; native signin has better UX but extra setup |

---

## Open Questions

1. **TesseractOCR on SmarterASP**
   - What we know: TesseractOCR 5.5.2 bundles Windows x64 native DLLs. SmarterASP runs IIS.
   - What's unclear: Whether the AppPool has permission to load native binaries from the deployment directory.
   - Recommendation: Add a Wave 0 smoke-test step (`GET /api/v1/admin/ocr-health`) that is executed before the full VER-011 implementation wave. If it fails, mark VER-011 as deferred.

2. **Resend domain verification for bairronow.com.br**
   - What we know: Resend requires adding DNS records (SPF, DKIM) to the sending domain. Cloudflare DNS is configured.
   - What's unclear: Whether `noreply@bairronow.com.br` is already verified on the Resend account.
   - Recommendation: Wave 0 task to verify domain in Resend dashboard + add DNS records via Cloudflare API.

3. **Google OAuth Authorized Redirect URIs**
   - What we know: Google Cloud Console must have `https://api.bairronow.com.br/api/v1/auth/google/callback` in authorized redirect URIs.
   - What's unclear: Whether the Google project and OAuth credentials already exist.
   - Recommendation: Wave 0 task to configure Google Cloud Console OAuth credentials.

---

## Validation Architecture

> `workflow.nyquist_validation: true` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | xUnit 2.9.2 + Moq 4.20.72 + FluentAssertions 8.9.0 + InMemory EF |
| Backend config | `BairroNow.Api.Tests.csproj` (exists) |
| Backend quick run | `dotnet test tests/BairroNow.Api.Tests/ --filter "Category=Unit" --no-build` |
| Backend full suite | `dotnet test tests/BairroNow.Api.Tests/ --no-build` |
| Frontend framework | Jest 29 + @testing-library/react 16 (jest-environment-jsdom) |
| Frontend config | `frontend/package.json` scripts.test |
| Frontend quick run | `pnpm --filter @bairronow/frontend test -- --passWithNoTests` |
| Mobile framework | Jest 29 + jest-expo + testEnvironment:node |
| Mobile quick run | `pnpm --filter @bairronow/mobile test -- --passWithNoTests` |

### Per-Requirement Test Strategy

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-009 | TOTP code verification returns true for valid code | unit | `dotnet test --filter "FullyQualifiedName~TotpServiceTests"` | ❌ Wave 0 |
| AUTH-009 | TOTP gate: admin login with TotpEnabled=true returns requires_totp | unit | `dotnet test --filter "FullyQualifiedName~AuthServiceTests.Login_AdminWithTotp"` | ❌ Wave 0 |
| AUTH-009 | Backup code single-use: second use returns invalid | unit | `dotnet test --filter "FullyQualifiedName~TotpServiceTests.BackupCode_SecondUse"` | ❌ Wave 0 |
| AUTH-013 | GoogleSignInAsync creates new user when email not found | unit | `dotnet test --filter "FullyQualifiedName~AuthServiceTests.Google_NewUser"` | ❌ Wave 0 |
| AUTH-013 | GoogleSignInAsync links GoogleId when email matches existing | unit | `dotnet test --filter "FullyQualifiedName~AuthServiceTests.Google_ExistingUser_Links"` | ❌ Wave 0 |
| AUTH-014 | Magic link token is stored hashed, not plain | unit | `dotnet test --filter "FullyQualifiedName~MagicLinkServiceTests.Token_StoredHashed"` | ❌ Wave 0 |
| AUTH-014 | Expired magic link returns error | unit | `dotnet test --filter "FullyQualifiedName~MagicLinkServiceTests.Expired_Returns_Error"` | ❌ Wave 0 |
| AUTH-014 | Used magic link returns error | unit | `dotnet test --filter "FullyQualifiedName~MagicLinkServiceTests.Used_Token_Returns_Error"` | ❌ Wave 0 |
| LGPD-02 | Export endpoint returns 429 when called twice within 24h | unit | `dotnet test --filter "FullyQualifiedName~AccountServiceTests.Export_RateLimit"` | ❌ Wave 0 |
| LGPD-02 | Export JSON includes all required data categories | unit | `dotnet test --filter "FullyQualifiedName~AccountServiceTests.Export_ContainsAllData"` | ❌ Wave 0 |
| LGPD-03 | Anonymization sets email to deleted+guid@bairronow.com.br | unit | `dotnet test --filter "FullyQualifiedName~AccountServiceTests.Delete_Anonymizes_Email"` | ❌ Wave 0 |
| LGPD-03 | 30-day grace: user can cancel deletion before anonymization | unit | `dotnet test --filter "FullyQualifiedName~AccountServiceTests.Delete_Grace_Cancel"` | ❌ Wave 0 |
| LGPD-04 | DocumentRetentionService deletes proofs > 90 days post-approval | unit | `dotnet test --filter "FullyQualifiedName~DocumentRetentionServiceTests"` | ❌ Wave 0 |
| NOTF-01 | DigestSchedulerService only sends on Monday UTC 12:00 | unit | `dotnet test --filter "FullyQualifiedName~DigestSchedulerTests.Only_Sends_Monday"` | ❌ Wave 0 |
| NOTF-01 | DigestSchedulerService does not double-fire same day | unit | `dotnet test --filter "FullyQualifiedName~DigestSchedulerTests.No_Double_Fire"` | ❌ Wave 0 |
| UXDS-02 | ThemeToggle renders without hydration error | unit | `pnpm --filter @bairronow/frontend test -- ThemeToggle` | ❌ Wave 0 |
| SHAR-01/02 | WhatsApp share URL encodes post/listing URL correctly | unit | `pnpm --filter @bairronow/frontend test -- ShareButton` | ❌ Wave 0 |
| SHAR-03 | /p/[postId] generateStaticParams returns placeholder path | unit | `pnpm --filter @bairronow/frontend test -- PostPreview` | ❌ Wave 0 |
| VER-011 | OCR health endpoint returns 200 (smoke — manual) | smoke | manual — `GET /api/v1/admin/ocr-health` | ❌ Wave 0 |
| VER-012 | Two vouches mark verification as vouchable | unit | `dotnet test --filter "FullyQualifiedName~VouchServiceTests"` | ❌ Wave 0 |

**Manual-only items:**
- AUTH-013: Google OAuth redirect flow (requires real browser + Google account)
- AUTH-014: Magic link email delivery (requires Resend + real email inbox)
- NOTF-01: Weekly digest delivery (requires waiting until Monday or mocking time in integration test)
- SHAR-03: WhatsApp preview rendering (requires WhatsApp client + published URL)

### Sampling Rate
- **Per task commit:** `dotnet test tests/BairroNow.Api.Tests/ --filter "Category=Unit" --no-build`
- **Per wave merge:** `dotnet test tests/BairroNow.Api.Tests/ --no-build && pnpm --filter @bairronow/frontend test -- --passWithNoTests && pnpm --filter @bairronow/mobile test -- --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

All test files for Phase 6 are new — none exist yet.

- [ ] `tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs` — covers AUTH-009 TOTP logic
- [ ] `tests/BairroNow.Api.Tests/Auth/MagicLinkServiceTests.cs` — covers AUTH-014 token lifecycle
- [ ] `tests/BairroNow.Api.Tests/Auth/GoogleAuthTests.cs` — covers AUTH-013 upsert logic
- [ ] `tests/BairroNow.Api.Tests/Account/AccountServiceTests.cs` — covers LGPD-02, LGPD-03
- [ ] `tests/BairroNow.Api.Tests/Services/DocumentRetentionServiceTests.cs` — covers LGPD-04
- [ ] `tests/BairroNow.Api.Tests/Services/DigestSchedulerTests.cs` — covers NOTF-01 timing
- [ ] `tests/BairroNow.Api.Tests/Verification/VouchServiceTests.cs` — covers VER-012
- [ ] `frontend/src/components/__tests__/ThemeToggle.test.tsx` — covers UXDS-02
- [ ] `frontend/src/components/__tests__/ShareButton.test.tsx` — covers SHAR-01/02
- [ ] `frontend/src/app/p/__tests__/PostPreview.test.tsx` — covers SHAR-03 static params

---

## Sources

### Primary (HIGH confidence)
- [NuGet: Otp.NET 1.4.1](https://www.nuget.org/packages/Otp.NET) — TOTP implementation confirmed
- [NuGet: Microsoft.AspNetCore.Authentication.Google](https://www.nuget.org/packages/Microsoft.AspNetCore.Authentication.Google) — version 8.0.x available
- [NuGet: Resend 0.2.2](https://www.nuget.org/packages/resend) — official SDK confirmed
- [NuGet: TesseractOCR 5.5.2](https://www.nuget.org/packages/TesseractOCR) — native-binary Tesseract wrapper confirmed
- [npm: next-themes 0.4.6](https://www.npmjs.com/package/next-themes) — confirmed current version
- [GitHub: resend/resend-dotnet](https://github.com/resend/resend-dotnet) — SDK usage patterns
- [GitHub: kspearrin/Otp.NET](https://github.com/kspearrin/Otp.NET) — API usage
- Project codebase: `GroupEventReminderService.cs`, `AuthServiceTests.cs`, `Program.cs` — existing patterns

### Secondary (MEDIUM confidence)
- [Microsoft Learn: Google external login setup in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/social/google-logins) — OAuth flow documentation
- [next-themes GitHub README](https://github.com/pacocoursey/next-themes) — suppressHydrationWarning pattern
- [Next.js: generateMetadata discussion #55476](https://github.com/vercel/next.js/discussions/55476) — static export + metadata limitation confirmed
- [Expo AuthSession docs](https://docs.expo.dev/versions/latest/sdk/auth-session/) — expo-auth-session for Google on mobile
- [WhatsApp OG preview guide](https://medium.com/@eduardojs999/how-to-use-whatsapp-open-graph-preview-with-next-js-avoiding-common-pitfalls-88fea4b7c949) — WEBP format + 1200x630 requirement

### Tertiary (LOW confidence — needs validation)
- TesseractOCR on SmarterASP shared IIS hosting — no authoritative source found; requires smoke test

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified against NuGet/npm registries (April 2026)
- Architecture patterns: HIGH for TOTP/Resend/BackgroundService (direct code evidence); MEDIUM for Google OAuth bridge (pattern documented, exact code needs testing)
- Pitfalls: HIGH for Tailwind v4 dark mode class variant (version confirmed); MEDIUM for TesseractOCR native binary on SmarterASP (untested)
- Static export OG: MEDIUM — behavior confirmed via Next.js discussions; static-only OG approach is pragmatic but means no per-post dynamic images

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable libraries; Tailwind v4 is shipping fast — re-check if dark mode behavior is unexpected)
