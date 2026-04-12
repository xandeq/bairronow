---
phase: 06-polish-deploy
plan: 01b
subsystem: api
tags: [dotnet, controllers, totp, google-oauth, magic-link, lgpd, vouching, ocr, xunit, moq]

# Dependency graph
requires:
  - phase: 06-01
    provides: "AuthService extensions, AccountService, OcrService, DigestSchedulerService, DocumentRetentionService, entities, migrations"
provides:
  - "AuthController: TOTP gate, Google OAuth web+mobile, magic link endpoints"
  - "AccountController: LGPD export, delete, cancel endpoints"
  - "VerificationController: Vouching endpoint with auto-approval"
  - "9 unit test files covering all Phase 6 backend features"
affects: [06-02, 06-03]

# Tech tracking
tech-stack:
  added: [Otp.NET (test project)]
  patterns: [TOTP temp token pattern, mobile OAuth id_token exchange, LGPD data export as JSON file download, vouching auto-approval threshold]

key-files:
  created:
    - src/BairroNow.Api/Controllers/v1/AccountController.cs
    - tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs
    - tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs
    - tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs
    - tests/BairroNow.Api.Tests/Account/DataExportTests.cs
    - tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs
    - tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs
    - tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs
    - tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs
    - tests/BairroNow.Api.Tests/Verification/VouchingTests.cs
  modified:
    - src/BairroNow.Api/Controllers/v1/AuthController.cs
    - src/BairroNow.Api/Controllers/v1/VerificationController.cs
    - tests/BairroNow.Api.Tests/BairroNow.Api.Tests.csproj
    - tests/BairroNow.Api.Tests/Services/AuthServiceTests.cs
    - tests/BairroNow.Api.Tests/Map/MapControllerTests.cs

key-decisions:
  - "TOTP gate uses short-lived JWT (5min) with totp_pending claim as temp token"
  - "Google mobile OAuth accepts id_token directly (not auth code) for expo-auth-session compatibility"
  - "Vouching auto-approval threshold set at 2 vouches"
  - "LGPD export rate limited to once per 24h via LastExportAt check"

patterns-established:
  - "TOTP temp token pattern: login returns tempToken instead of full JWT when TOTP required"
  - "Mobile OAuth pattern: POST endpoint accepting id_token for native app Google sign-in"

requirements-completed: [AUTH-009, AUTH-013, AUTH-014, LGPD-02, LGPD-03, VER-012]

# Metrics
duration: 13min
completed: 2026-04-12
---

# Phase 06 Plan 01b: Backend Controllers and Tests Summary

**Auth controller with TOTP gate + Google OAuth mobile + magic link, LGPD account controller, vouching endpoint, and 9 unit test files all passing (49 tests total)**

## Performance

- **Duration:** 13 min
- **Started:** 2026-04-12T18:45:28Z
- **Completed:** 2026-04-12T18:58:09Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- AuthController extended with 7 new endpoints: TOTP gate on login, TOTP verify, TOTP setup, Google OAuth web redirect + callback, Google mobile id_token exchange, magic link request + verify
- AccountController created with LGPD-compliant data export (JSON download), deletion request (30-day grace), and cancellation endpoints
- VerificationController extended with vouching endpoint that auto-approves at 2 vouches
- 9 unit test files created covering TOTP, Google OAuth (including mobile), magic link, data export, account deletion, document retention, digest scheduler, OCR, and vouching
- All 49 unit tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth controller extensions** - `8d40b4b` (feat)
2. **Task 2: Account controller, vouching, and 9 test files** - `b1e3d5b` (feat)

## Files Created/Modified
- `src/BairroNow.Api/Controllers/v1/AuthController.cs` - Extended with TOTP gate, Google OAuth web+mobile, magic link (7 new endpoints)
- `src/BairroNow.Api/Controllers/v1/AccountController.cs` - NEW: LGPD export, delete, cancel endpoints
- `src/BairroNow.Api/Controllers/v1/VerificationController.cs` - Extended with vouching endpoint
- `tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs` - 4 tests: setup, verify valid, reject invalid, backup code redemption
- `tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs` - 5 tests: new user, link existing, JWT return, mobile verify, mobile reject
- `tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs` - 4 tests: create token, verify valid, expired, used
- `tests/BairroNow.Api.Tests/Account/DataExportTests.cs` - 2 tests: all sections, LastExportAt update
- `tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs` - 4 tests: request, cancel within grace, cancel expired, anonymization
- `tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs` - 2 tests: delete expired, skip already deleted
- `tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs` - 3 tests: correct users, top 3 posts, double-fire guard
- `tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs` - 2 tests: Tesseract graceful failure, file not found
- `tests/BairroNow.Api.Tests/Verification/VouchingTests.cs` - 3 tests: creation, duplicate detection, auto-approval at 2
- `tests/BairroNow.Api.Tests/BairroNow.Api.Tests.csproj` - Added Otp.NET package reference
- `tests/BairroNow.Api.Tests/Services/AuthServiceTests.cs` - Fixed constructor for Phase 6 AuthService params
- `tests/BairroNow.Api.Tests/Map/MapControllerTests.cs` - Fixed Verification namespace collision

## Decisions Made
- TOTP gate uses short-lived JWT (5min) with `totp_pending` claim as temp token -- simpler than session-based approach
- Google mobile OAuth accepts `idToken` directly via POST (not auth code exchange) -- matches expo-auth-session flow
- Vouching auto-approval threshold is 2 vouches -- low enough for usability, high enough to prevent single-user abuse
- LGPD export is rate-limited to 24h via `LastExportAt` timestamp check in controller

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed AuthServiceTests constructor for Phase 6 params**
- **Found during:** Task 2 (build phase)
- **Issue:** Existing AuthServiceTests used old 4-param constructor; Phase 6 added IConfiguration and IHttpClientFactory params
- **Fix:** Updated constructor call to include all 6 params with mocks
- **Files modified:** tests/BairroNow.Api.Tests/Services/AuthServiceTests.cs
- **Verification:** Build succeeds, all existing tests still pass
- **Committed in:** b1e3d5b (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed Verification namespace collision in MapControllerTests**
- **Found during:** Task 2 (build phase)
- **Issue:** New `BairroNow.Api.Tests.Verification` namespace caused `Verification` type to be ambiguous in MapControllerTests
- **Fix:** Fully qualified `BairroNow.Api.Models.Entities.Verification` in 3 locations
- **Files modified:** tests/BairroNow.Api.Tests/Map/MapControllerTests.cs
- **Verification:** Build succeeds, no namespace ambiguity
- **Committed in:** b1e3d5b (Task 2 commit)

**3. [Rule 3 - Blocking] Fixed Otp.NET package name and Bairro/PostCategory types in tests**
- **Found during:** Task 2 (build phase)
- **Issue:** Package is `Otp.NET` not `OtpNet`; Bairro uses `Cidade` not `Municipio`; PostCategory is enum not string
- **Fix:** Corrected package reference, property names, and enum usage
- **Files modified:** tests/BairroNow.Api.Tests/BairroNow.Api.Tests.csproj, tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs
- **Verification:** Build succeeds
- **Committed in:** b1e3d5b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking)
**Impact on plan:** All fixes necessary for compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed blocking issues documented above.

## Known Stubs
None -- all endpoints are fully wired to their backing services.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend API endpoints are exposed and tested for Plan 02 (web) and Plan 03 (mobile) consumption
- The `POST /api/v1/auth/google/mobile` endpoint is ready for expo-auth-session integration
- LGPD compliance endpoints are available for the account settings UI
- Vouching endpoint ready for community verification UI

## Self-Check: PASSED

All 12 created files verified present. Both task commits (8d40b4b, b1e3d5b) verified in git log.

---
*Phase: 06-polish-deploy*
*Completed: 2026-04-12*
