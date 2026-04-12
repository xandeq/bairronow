---
phase: 06-polish-deploy
plan: 01b
type: execute
wave: 1
depends_on: ["06-01"]
files_modified:
  - src/BairroNow.Api/Controllers/v1/AuthController.cs
  - src/BairroNow.Api/Controllers/v1/AccountController.cs
  - src/BairroNow.Api/Controllers/v1/VerificationController.cs
  - tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs
  - tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs
  - tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs
  - tests/BairroNow.Api.Tests/Account/DataExportTests.cs
  - tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs
  - tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs
  - tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs
  - tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs
  - tests/BairroNow.Api.Tests/Verification/VouchingTests.cs
autonomous: true
requirements:
  - AUTH-009
  - AUTH-013
  - AUTH-014
  - LGPD-02
  - LGPD-03
  - VER-012

must_haves:
  truths:
    - "Admin user with TOTP enabled must provide 6-digit code after password login to get JWT"
    - "User can sign in with Google via web redirect and receive app JWT (auto-link if email matches)"
    - "Mobile app can exchange Google id_token for app JWT via POST /api/v1/auth/google/mobile"
    - "User can request magic link email and authenticate by clicking link"
    - "LGPD account controller exposes export, deletion, and cancellation endpoints"
    - "Vouching endpoint auto-approves verification at 2 vouches"
    - "All 9 unit test files pass"
  artifacts:
    - path: "src/BairroNow.Api/Controllers/v1/AuthController.cs"
      provides: "TOTP gate, Google OAuth web + mobile, magic link endpoints"
      contains: "google/mobile"
    - path: "src/BairroNow.Api/Controllers/v1/AccountController.cs"
      provides: "LGPD endpoints"
      exports: ["Export", "RequestDeletion", "CancelDeletion"]
    - path: "src/BairroNow.Api/Controllers/v1/VerificationController.cs"
      provides: "Vouching endpoint"
      contains: "vouch"
    - path: "tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs"
      provides: "Google OAuth tests including mobile flow"
      contains: "GoogleSignInMobileAsync"
  key_links:
    - from: "AuthController.Login"
      to: "AuthService.LoginAsync"
      via: "TOTP gate check after password success"
      pattern: "requires_totp.*temp_token"
    - from: "AuthController google/mobile"
      to: "AuthService.GoogleSignInMobileAsync"
      via: "POST endpoint accepting idToken"
      pattern: "google/mobile"
    - from: "AccountController"
      to: "AccountService"
      via: "Scoped DI injection"
      pattern: "AccountService"
---

<objective>
Backend controllers and tests: Auth controller extensions (TOTP gate, Google OAuth web + mobile endpoint, magic link), Account controller (LGPD), Vouching endpoint, OCR integration, and all 9 unit test files.

Purpose: Expose all backend API endpoints that Plan 02 (web) and Plan 03 (mobile) consume. The mobile Google OAuth flow specifically requires `POST /api/v1/auth/google/mobile` which accepts an id_token from expo-auth-session.
Output: 3 modified/new controllers, 9 test files. All `dotnet test` green.
</objective>

<execution_context>
@C:/Users/acq20/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/acq20/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@D:/claude-code/bairronow/.planning/PROJECT.md
@D:/claude-code/bairronow/.planning/ROADMAP.md
@D:/claude-code/bairronow/.planning/STATE.md
@D:/claude-code/bairronow/.planning/phases/06-polish-deploy/06-CONTEXT.md
@D:/claude-code/bairronow/.planning/phases/06-polish-deploy/06-RESEARCH.md
@D:/claude-code/bairronow/.planning/phases/06-polish-deploy/06-01-SUMMARY.md

<interfaces>
<!-- From Plan 06-01: AuthService methods now available -->
```csharp
// AuthService.cs (created in Plan 06-01)
Task<AuthResult> GoogleSignInAsync(string email, string googleId);
Task<AuthResult> GoogleSignInMobileAsync(string idToken);  // verifies with Google tokeninfo, upserts user
Task<AuthResult> RequestMagicLinkAsync(string email);
Task<AuthResult> VerifyMagicLinkAsync(string rawTokenBase64);
Task<TotpSetupResult> SetupTotpAsync(Guid userId);
Task<AuthResult> VerifyTotpAsync(string tempToken, string code);
```

<!-- From Plan 06-01: Services available via DI -->
```csharp
// AccountService.cs
Task<object> BuildExportAsync(Guid userId);
Task RequestDeletionAsync(Guid userId);
Task CancelDeletionAsync(Guid userId);
Task RunAnonymizationAsync();

// OcrService.cs
Task<string?> ExtractTextAsync(string filePath);
```

From src/BairroNow.Api/Controllers/v1/AuthController.cs (existing endpoints):
```
POST Register, POST Login, POST Refresh, POST Logout, POST LogoutAll, POST ForgotPassword, POST ResetPassword
```

Backend API contracts this plan creates:
```
POST /api/v1/auth/login              → MODIFY: adds TOTP gate (requiresTotp + tempToken)
POST /api/v1/auth/login/totp-verify  → NEW: { tempToken, code } → JWT
POST /api/v1/auth/totp/setup         → NEW: [Authorize, admin] → { secret, provisioningUri, backupCodes }
GET  /api/v1/auth/google             → NEW: Challenge redirect to Google
POST /api/v1/auth/google/mobile      → NEW: { idToken } → JWT (for expo-auth-session)
POST /api/v1/auth/magic-link/request → NEW: { email } → 200 always
GET  /api/v1/auth/magic-link/verify  → NEW: ?token={base64} → redirect with JWT
GET  /api/v1/account/export          → NEW: JSON file download
POST /api/v1/account/delete          → NEW: { message, deletionDate }
POST /api/v1/account/delete/cancel   → NEW: 200 or 400
POST /api/v1/verification/{userId}/vouch → NEW: [Authorize, verified user]
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Auth controller extensions (TOTP gate, Google OAuth web + mobile, magic link)</name>
  <read_first>
    - src/BairroNow.Api/Controllers/v1/AuthController.cs
    - src/BairroNow.Api/Services/AuthService.cs (updated from Plan 06-01)
    - src/BairroNow.Api/Models/Entities/User.cs (updated from Plan 06-01)
  </read_first>
  <files>
    src/BairroNow.Api/Controllers/v1/AuthController.cs
  </files>
  <action>
**1. Modify `POST /api/v1/auth/login`** (existing endpoint): After successful `LoginAsync`, check `if (user.IsAdmin && user.TotpEnabled)`. If true, generate a short-lived JWT (5min) with claim `totp_pending: true` and return `{ requiresTotp: true, tempToken }` with status 200. Otherwise return normal JWT response.

**2. Add `POST /api/v1/auth/login/totp-verify`**: Body `{ tempToken, code }`. Calls `AuthService.VerifyTotpAsync`. Returns JWT or 401.

**3. Add `POST /api/v1/auth/totp/setup`** [Authorize, admin only]: Calls `SetupTotpAsync`. Returns `{ secret, provisioningUri, backupCodes }`. ProvisioningUri: `otpauth://totp/BairroNow:{email}?secret={secret}&issuer=BairroNow`.

**4. Add `GET /api/v1/auth/google`**: `return Challenge(new AuthenticationProperties { RedirectUri = "/api/v1/auth/google/callback" }, GoogleDefaults.AuthenticationScheme);`

**5. Add `POST /api/v1/auth/google/mobile`** (CRITICAL for mobile OAuth — expo-auth-session returns id_token, not auth code):
```csharp
[HttpPost("google/mobile")]
public async Task<IActionResult> GoogleMobile([FromBody] GoogleMobileRequest request)
{
    // request.IdToken comes from expo-auth-session on mobile
    var result = await _authService.GoogleSignInMobileAsync(request.IdToken);
    if (!result.Success)
        return Unauthorized(new { error = result.Error });
    return Ok(new { accessToken = result.AccessToken, refreshToken = result.RefreshToken });
}

public record GoogleMobileRequest(string IdToken);
```
This endpoint accepts `{ idToken: string }` from the mobile app, delegates to `AuthService.GoogleSignInMobileAsync` which verifies the token with Google's tokeninfo endpoint, upserts the user, and returns app JWT + refresh token.

**6. Add `POST /api/v1/auth/magic-link/request`**: Body `{ email }`. Calls `RequestMagicLinkAsync`. Always returns 200 (prevent enumeration).

**7. Add `GET /api/v1/auth/magic-link/verify?token={base64}`**: Calls `VerifyMagicLinkAsync`. On success, redirect to `{frontendUrl}/auth/callback?token={jwt}`. On failure, redirect to `{frontendUrl}/auth/magic-link?error=invalid`.
  </action>
  <verify>
    <automated>cd D:/claude-code/bairronow/src/BairroNow.Api && dotnet build --no-restore 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - grep -q "totp-verify" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "totp/setup" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "magic-link/request" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "magic-link/verify" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "auth/google" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "google/mobile" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "GoogleMobile" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - grep -q "IdToken" src/BairroNow.Api/Controllers/v1/AuthController.cs
    - dotnet build succeeds with 0 errors
  </acceptance_criteria>
  <done>AuthController has all new endpoints: TOTP gate on login, TOTP verify, TOTP setup, Google OAuth web redirect, Google OAuth mobile id_token exchange, magic link request, magic link verify. Build succeeds.</done>
</task>

<task type="auto">
  <name>Task 2: Account controller, vouching endpoint, OCR integration, and all 9 unit test files</name>
  <read_first>
    - src/BairroNow.Api/Controllers/v1/AuthController.cs (from Task 1)
    - src/BairroNow.Api/Services/AccountService.cs (from Plan 06-01)
    - src/BairroNow.Api/Services/OcrService.cs (from Plan 06-01)
    - src/BairroNow.Api/Controllers/v1/VerificationController.cs
    - tests/BairroNow.Api.Tests (any existing test for pattern reference)
  </read_first>
  <files>
    src/BairroNow.Api/Controllers/v1/AccountController.cs,
    src/BairroNow.Api/Controllers/v1/VerificationController.cs,
    tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs,
    tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs,
    tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs,
    tests/BairroNow.Api.Tests/Account/DataExportTests.cs,
    tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs,
    tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs,
    tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs,
    tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs,
    tests/BairroNow.Api.Tests/Verification/VouchingTests.cs
  </files>
  <action>
**1. Create `AccountController.cs`** (LGPD-02/03, per D-20 through D-26):

`[ApiController] [Route("api/v1/account")] [Authorize]`

`GET /api/v1/account/export` (per D-20, D-21, D-22): Check `user.LastExportAt` — reject with 429 if < 24h ago. Call `AccountService.BuildExportAsync`. Return `File(...)` with content-type `application/json`, filename `bairronow-dados-pessoais.json`.

`POST /api/v1/account/delete` (per D-23 through D-26): Call `AccountService.RequestDeletionAsync`. Send confirmation email via `IEmailService.SendAccountDeletionConfirmationAsync`. Return 200 with `{ message: "Conta marcada para exclusao. Voce tem 30 dias para cancelar.", deletionDate }`.

`POST /api/v1/account/delete/cancel`: Call `AccountService.CancelDeletionAsync`. Return 200 or 400 if grace period expired.

**2. Add vouching endpoint** to `VerificationController.cs` (VER-012):

`POST /api/v1/verification/{userId}/vouch` [Authorize]: Caller must be verified (`IsVerified == true`). Cannot vouch for self. Cannot vouch twice for same user. Create `VerificationVouch { VoucheeId = userId, VoucherId = callerId }`. If vouch count for userId reaches 2, auto-set `Verification.Status = "approved"` and set `User.IsVerified = true, VerifiedAt = UtcNow`.

**3. Add OCR integration** to verification flow:
In the existing verification submission flow (wherever proof file is uploaded), after saving the file, call `OcrService.ExtractTextAsync(filePath)`. If text is returned, save to `Verification.OcrText`. This provides pre-extracted text for admin review — purely informational, no decision-making.

**4. Create all 9 unit test files** using `[Trait("Category", "Unit")]` xUnit pattern + Moq + FluentAssertions:

- `TotpServiceTests.cs`: Test `SetupTotpAsync` returns valid base32 secret + 8 backup codes. Test `VerifyTotpAsync` accepts valid TOTP code. Test `VerifyTotpAsync` rejects invalid code. Test backup code redemption removes used code.
- `GoogleOAuthTests.cs`: Test `GoogleSignInAsync` creates new user when email not found. Test `GoogleSignInAsync` links GoogleId to existing user. Test `GoogleSignInAsync` returns JWT. **Test `GoogleSignInMobileAsync` verifies id_token and returns JWT.** Test `GoogleSignInMobileAsync` rejects invalid id_token.
- `MagicLinkTests.cs`: Test `RequestMagicLinkAsync` creates hashed token. Test `VerifyMagicLinkAsync` succeeds with valid token. Test expired token fails. Test used token fails.
- `DataExportTests.cs`: Test `BuildExportAsync` returns all user data sections. Test export rate limit (429 within 24h).
- `AccountDeletionTests.cs`: Test `RequestDeletionAsync` sets `DeleteRequestedAt` and revokes tokens. Test `CancelDeletionAsync` within grace period. Test `RunAnonymizationAsync` anonymizes after 30 days.
- `DocumentRetentionTests.cs`: Test service deletes documents older than 90 days. Test service skips documents already deleted.
- `DigestSchedulerTests.cs`: Test `SendDigests` queries correct users (opted in, verified email, active). Test digest content includes top 3 posts. Test `_lastDigestDate` guard prevents double-fire.
- `OcrServiceTests.cs`: Test graceful failure when Tesseract native binary not found (returns null). Test successful extraction returns text.
- `VouchingTests.cs`: Test vouch creation. Test duplicate vouch rejected. Test auto-approval at 2 vouches.
  </action>
  <verify>
    <automated>cd D:/claude-code/bairronow && dotnet test tests/BairroNow.Api.Tests --filter Category=Unit --no-restore 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - grep -q "class AccountController" src/BairroNow.Api/Controllers/v1/AccountController.cs
    - grep -q "account/export" src/BairroNow.Api/Controllers/v1/AccountController.cs
    - grep -q "account/delete" src/BairroNow.Api/Controllers/v1/AccountController.cs
    - grep -q "vouch" src/BairroNow.Api/Controllers/v1/VerificationController.cs
    - test -f tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs
    - test -f tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs
    - test -f tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs
    - test -f tests/BairroNow.Api.Tests/Account/DataExportTests.cs
    - test -f tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs
    - test -f tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs
    - test -f tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs
    - test -f tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs
    - test -f tests/BairroNow.Api.Tests/Verification/VouchingTests.cs
    - grep -q "GoogleSignInMobileAsync" tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs
    - dotnet test --filter Category=Unit passes with 0 failures
  </acceptance_criteria>
  <done>AccountController (LGPD export/delete/cancel), vouching endpoint, OCR integration, and all 9 unit test files pass. Backend API contracts fully exposed and tested, including mobile Google OAuth flow.</done>
</task>

</tasks>

<verification>
```bash
# Build
cd D:/claude-code/bairronow/src/BairroNow.Api && dotnet build --no-restore

# All unit tests
cd D:/claude-code/bairronow && dotnet test tests/BairroNow.Api.Tests --filter Category=Unit

# Verify mobile OAuth endpoint exists
grep -q "google/mobile" src/BairroNow.Api/Controllers/v1/AuthController.cs && echo "PASS: google/mobile endpoint exists" || echo "FAIL"
```
</verification>

<success_criteria>
- `dotnet build` succeeds with 0 errors
- All unit tests pass (filter Category=Unit)
- AuthController has `google/mobile` endpoint accepting `{ idToken }`
- AccountController has export, delete, cancel endpoints
- VerificationController has vouch endpoint
- All 9 test files exist and pass
</success_criteria>

<output>
After completion, create `.planning/phases/06-polish-deploy/06-01b-SUMMARY.md`
</output>
