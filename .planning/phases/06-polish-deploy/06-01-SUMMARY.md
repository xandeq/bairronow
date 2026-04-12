---
phase: 06-polish-deploy
plan: 01
subsystem: api
tags: [resend, totp, otp-net, google-oauth, lgpd, background-service, ocr, tesseract, magic-link, digest-email]

requires:
  - phase: 05-map-groups
    provides: "Group events, group entities, map entities for digest queries"
  - phase: 01-infrastructure-auth
    provides: "JWT auth, refresh tokens, User entity, AppDbContext, IEmailService"
provides:
  - "ResendEmailService for real email delivery"
  - "AccountService with LGPD export, deletion, anonymization"
  - "DigestSchedulerService weekly email digest"
  - "DocumentRetentionService 90-day proof cleanup"
  - "OcrService for proof document text extraction"
  - "AuthService Google OAuth (web + mobile), magic link, TOTP methods"
  - "MagicLinkToken and VerificationVouch entities + EF migration"
affects: [06-01b, 06-02, 06-03]

tech-stack:
  added: [Otp.NET 1.4.1, Microsoft.AspNetCore.Authentication.Google 8.0, Resend 0.2.2, TesseractOCR 5.5.2]
  patterns: [BackgroundService with daily/weekly guards, IServiceProvider.CreateScope for scoped DI in hosted services, graceful degradation for optional native deps]

key-files:
  created:
    - src/BairroNow.Api/Services/ResendEmailService.cs
    - src/BairroNow.Api/Services/AccountService.cs
    - src/BairroNow.Api/Services/DigestSchedulerService.cs
    - src/BairroNow.Api/Services/DocumentRetentionService.cs
    - src/BairroNow.Api/Services/OcrService.cs
    - src/BairroNow.Api/Models/Entities/MagicLinkToken.cs
    - src/BairroNow.Api/Models/Entities/VerificationVouch.cs
    - src/BairroNow.Api/Migrations/20260412183923_Phase6PolishDeploy.cs
  modified:
    - src/BairroNow.Api/Services/AuthService.cs
    - src/BairroNow.Api/Services/IAuthService.cs
    - src/BairroNow.Api/Services/IEmailService.cs
    - src/BairroNow.Api/Services/EmailService.cs
    - src/BairroNow.Api/Data/AppDbContext.cs
    - src/BairroNow.Api/Program.cs
    - src/BairroNow.Api/Models/Entities/User.cs
    - src/BairroNow.Api/Models/Entities/Verification.cs

key-decisions:
  - "Resend via HttpClient POST (not SDK wrapper) for simplicity and fewer dependencies"
  - "OcrService graceful degradation - returns null if Tesseract native binaries unavailable on SmarterASP"
  - "IssueTokens helper centralizes JWT+refresh creation across Google, magic link, and TOTP flows"
  - "Google mobile sign-in via tokeninfo endpoint (simpler than full library verification)"

patterns-established:
  - "BackgroundService guard pattern: DateOnly field prevents double-fire on same day/week"
  - "Email service never throws: all send failures logged but swallowed to prevent caller crashes"
  - "LGPD anonymization: 30-day grace period then email/name/photo nullified with deleted+uuid@bairronow.com.br"

requirements-completed: [LGPD-02, LGPD-03, LGPD-04, NOTF-01, VER-011, VER-012]

duration: 6min
completed: 2026-04-12
---

# Phase 06 Plan 01: Backend Foundation Summary

**Resend email service, LGPD export/deletion/anonymization, weekly digest scheduler, 90-day document retention, OCR service, and AuthService with Google OAuth + TOTP + magic link**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-12T18:34:36Z
- **Completed:** 2026-04-12T18:40:29Z
- **Tasks:** 1
- **Files modified:** 19

## Accomplishments
- Created ResendEmailService replacing stub EmailService for real email delivery via Resend API
- Implemented AccountService with full LGPD compliance: data export, deletion with 30-day grace period, and automatic anonymization
- Built DigestSchedulerService sending weekly Monday 09:00 BRT digests with top posts and upcoming events
- Created DocumentRetentionService auto-deleting proof documents 90 days after verification approval
- Added OcrService with Tesseract graceful degradation for proof document text extraction
- Extended AuthService with Google OAuth (web + mobile), magic link passwordless login, and TOTP 2FA with backup codes
- Created MagicLinkToken and VerificationVouch entities with EF Core migration
- Registered Google OAuth provider and all new services in Program.cs DI container

## Task Commits

Each task was committed atomically:

1. **Task 1: Entities, migration, NuGet packages, Resend email service, LGPD + account services** - `30e640c` (feat)

## Files Created/Modified
- `src/BairroNow.Api/Services/ResendEmailService.cs` - Real email delivery via Resend API (confirmation, reset, magic link, digest, deletion, verification status)
- `src/BairroNow.Api/Services/AccountService.cs` - LGPD: BuildExportAsync, RequestDeletionAsync, CancelDeletionAsync, RunAnonymizationAsync
- `src/BairroNow.Api/Services/DigestSchedulerService.cs` - BackgroundService for weekly Monday digest emails
- `src/BairroNow.Api/Services/DocumentRetentionService.cs` - BackgroundService for 90-day document cleanup
- `src/BairroNow.Api/Services/OcrService.cs` - Tesseract OCR with graceful degradation
- `src/BairroNow.Api/Models/Entities/MagicLinkToken.cs` - Magic link token entity (hash-based, single-use, 10min expiry)
- `src/BairroNow.Api/Models/Entities/VerificationVouch.cs` - Neighbor vouching entity (vouchee + voucher)
- `src/BairroNow.Api/Services/AuthService.cs` - Added GoogleSignIn(Mobile)Async, RequestMagicLinkAsync, VerifyMagicLinkAsync, SetupTotpAsync, VerifyTotpAsync
- `src/BairroNow.Api/Services/IAuthService.cs` - Interface extended with 6 new method signatures
- `src/BairroNow.Api/Services/IEmailService.cs` - 4 new methods (magic link, verification status, digest, deletion confirmation)
- `src/BairroNow.Api/Services/EmailService.cs` - Stub updated to implement all 6 interface methods
- `src/BairroNow.Api/Data/AppDbContext.cs` - Added MagicLinkTokens, VerificationVouches DbSets + OnModelCreating config
- `src/BairroNow.Api/Program.cs` - DI: ResendEmailService, Google OAuth, DigestScheduler, DocumentRetention, AccountService, OcrService
- `src/BairroNow.Api/Migrations/20260412183923_Phase6PolishDeploy.cs` - EF migration for Phase 6 schema changes

## Decisions Made
- Used Resend via direct HttpClient POST rather than Resend SDK wrapper for simplicity
- OcrService returns null on Tesseract failure (graceful degradation for SmarterASP shared hosting)
- Google mobile sign-in uses tokeninfo endpoint rather than full Google API library
- AuthService.IssueTokens helper centralizes JWT+refresh token creation for all new auth flows
- FindFirst().Value used instead of FindFirstValue extension to avoid missing using directive in Program.cs top-level statements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed FindFirstValue compile error in Program.cs**
- **Found during:** Task 1 (build verification)
- **Issue:** `FindFirstValue` extension method not available without explicit `using System.Security.Claims` in top-level Program.cs
- **Fix:** Replaced with `FindFirst(ClaimTypes.Email)?.Value` pattern
- **Files modified:** src/BairroNow.Api/Program.cs
- **Verification:** `dotnet build` succeeds with 0 errors
- **Committed in:** 30e640c

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor compile fix. No scope creep.

## Issues Encountered
None beyond the FindFirstValue compile error noted above.

## User Setup Required
None - no external service configuration required for build. Resend API key and Google OAuth credentials will need to be configured in appsettings for runtime.

## Known Stubs
None - all services have real implementations. OcrService gracefully degrades but is not a stub.

## Next Phase Readiness
- All services and entities ready for Plan 01b (controllers + tests)
- IAuthService interface fully defined for controller endpoint wiring
- AccountService ready for LGPD controller endpoints
- DigestSchedulerService and DocumentRetentionService will auto-start with the host

---
*Phase: 06-polish-deploy*
*Completed: 2026-04-12*
