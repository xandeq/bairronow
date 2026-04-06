---
phase: 01-infrastructure-auth
plan: 03
subsystem: auth
tags: [jwt, bcrypt, sha256, refresh-token, fluentvalidation, rate-limiting, cross-origin-cookie]

requires:
  - phase: 01-01
    provides: "EF Core schema with User, RefreshToken entities and AppDbContext"
provides:
  - "Full JWT auth flow: register, login, refresh, logout, forgot/reset password"
  - "AuthController with 7 endpoints at /api/v1/auth/*"
  - "Token rotation with reuse detection"
  - "Account lockout after 5 failed attempts"
affects: [01-02, 01-04]

tech-stack:
  added: [FluentValidation.TestHelper, Microsoft.EntityFrameworkCore.InMemory]
  patterns: [service-interface-DI, SHA256-refresh-token-hashing, BCrypt-password-hashing, cross-origin-partitioned-cookies]

key-files:
  created:
    - src/NossoVizinho.Api/Controllers/v1/AuthController.cs
    - src/NossoVizinho.Api/Services/AuthService.cs
    - src/NossoVizinho.Api/Services/TokenService.cs
    - src/NossoVizinho.Api/Models/DTOs/RegisterRequest.cs
    - tests/NossoVizinho.Api.Tests/Validators/RegisterRequestValidatorTests.cs
    - tests/NossoVizinho.Api.Tests/Services/AuthServiceTests.cs
  modified:
    - src/NossoVizinho.Api/Program.cs
    - tests/NossoVizinho.Api.Tests/NossoVizinho.Api.Tests.csproj

key-decisions:
  - "SHA256 for refresh token storage (fast lookup vs BCrypt per-row scan)"
  - "Partitioned cookie attribute workaround for .NET 8 cross-origin support"
  - "Log-only EmailService stub for development"

patterns-established:
  - "Service pattern: IService interface + Service impl + DI registration in Program.cs"
  - "Controller pattern: versioned route, rate limiting attributes, PT-BR messages"
  - "Token pattern: SHA256 hash stored in DB, raw token in cookie"

requirements-completed: [AUTH-001, AUTH-002, AUTH-003, AUTH-004, AUTH-011, LGPD-01]

duration: 6min
completed: 2026-04-06
---

# Phase 01 Plan 03: Auth Endpoints Summary

**JWT auth with BCrypt passwords, refresh token rotation via SHA256 lookup, account lockout, and FluentValidation with 21 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-06T10:38:07Z
- **Completed:** 2026-04-06T10:44:13Z
- **Tasks:** 3
- **Files modified:** 19

## Accomplishments
- 5 auth DTOs with FluentValidation (PT-BR messages, password strength rules, privacy acceptance)
- TokenService (JWT 15min) + AuthService (register, login with lockout, refresh with rotation, logout, password reset 1h TTL)
- AuthController with 7 endpoints, cross-origin cookies (SameSite=None + Partitioned), rate limiting
- 21 unit tests passing (9 validator + 3 token + 8 auth + 1 uniqueness)

## Task Commits

1. **Task 1: DTOs, validators, validator tests** - `af36b0b` (feat)
2. **Task 2: TokenService, AuthService, EmailService, service tests** - `970cdae` (feat)
3. **Task 3: AuthController with all endpoints** - `5341d50` (feat)

## Files Created/Modified
- `src/NossoVizinho.Api/Models/DTOs/*.cs` - 5 auth request/response DTOs
- `src/NossoVizinho.Api/Validators/*.cs` - RegisterRequest and LoginRequest validators
- `src/NossoVizinho.Api/Services/*.cs` - ITokenService, TokenService, IAuthService, AuthService, IEmailService, EmailService
- `src/NossoVizinho.Api/Controllers/v1/AuthController.cs` - 7 auth endpoints
- `src/NossoVizinho.Api/Program.cs` - DI registration for auth services
- `tests/NossoVizinho.Api.Tests/Validators/RegisterRequestValidatorTests.cs` - 9 validator tests
- `tests/NossoVizinho.Api.Tests/Services/TokenServiceTests.cs` - 3 token service tests
- `tests/NossoVizinho.Api.Tests/Services/AuthServiceTests.cs` - 8 auth service tests
- `tests/NossoVizinho.Api.Tests/NossoVizinho.Api.Tests.csproj` - Fixed TFM net9.0->net8.0, added InMemory EF

## Decisions Made
- SHA256 for refresh token storage instead of BCrypt (BCrypt too slow for per-row lookup)
- .NET 8 Partitioned cookie attribute applied via Set-Cookie header string replacement workaround
- EmailService is log-only stub (actual SMTP deferred to deployment)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test project target framework mismatch**
- **Found during:** Task 1 (validator tests)
- **Issue:** Test project targeted net9.0 while API targets net8.0, causing build incompatibility
- **Fix:** Changed test project TFM to net8.0
- **Files modified:** tests/NossoVizinho.Api.Tests/NossoVizinho.Api.Tests.csproj
- **Committed in:** af36b0b

**2. [Rule 3 - Blocking] FluentValidation.TestHelper package does not exist separately**
- **Found during:** Task 1 (validator tests)
- **Issue:** FluentValidation.TestHelper is not a separate NuGet package; test helper is included in FluentValidation itself
- **Fix:** Removed the separate package reference; TestValidate available via project reference chain
- **Files modified:** tests/NossoVizinho.Api.Tests/NossoVizinho.Api.Tests.csproj
- **Committed in:** af36b0b

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for test infrastructure. No scope creep.

## Known Stubs
- `src/NossoVizinho.Api/Services/EmailService.cs` line 16-17: Log-only stub, no actual email sending. Intentional for MVP dev; real SMTP will be configured at deployment.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth endpoints ready for frontend integration (Plan 02)
- Plan 04 can test CORS + cookie flow end-to-end
- EmailService stub logs tokens to console for development testing

---
*Phase: 01-infrastructure-auth*
*Completed: 2026-04-06*
