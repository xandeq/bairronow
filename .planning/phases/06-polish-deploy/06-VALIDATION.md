---
phase: 6
slug: polish-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (backend)** | xUnit 2.9.x + FluentAssertions + Moq |
| **Framework (web)** | Jest 29.x + React Testing Library |
| **Framework (mobile)** | jest-expo (testEnvironment: node) |
| **Config file** | `tests/BairroNow.Api.Tests/`, `frontend/jest.config.js`, `mobile/jest.config.js` |
| **Quick run command** | `cd D:/claude-code/bairronow && dotnet test tests/BairroNow.Api.Tests --filter Category=Unit --no-build 2>&1 \| tail -5` |
| **Full suite command** | `dotnet test tests/BairroNow.Api.Tests --filter Category=Unit && cd frontend && pnpm test -- --passWithNoTests && cd ../mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-T1 | 01 | 1 | AUTH-009 | unit | `dotnet test --filter "Totp"` | ❌ W0 | ⬜ pending |
| 06-01-T2 | 01 | 1 | AUTH-013 | unit | `dotnet test --filter "GoogleOAuth"` | ❌ W0 | ⬜ pending |
| 06-01-T3 | 01 | 1 | AUTH-014 | unit | `dotnet test --filter "MagicLink"` | ❌ W0 | ⬜ pending |
| 06-01-T4 | 01 | 1 | LGPD-02 | unit | `dotnet test --filter "DataExport"` | ❌ W0 | ⬜ pending |
| 06-01-T5 | 01 | 1 | LGPD-03 | unit | `dotnet test --filter "AccountDeletion"` | ❌ W0 | ⬜ pending |
| 06-01-T6 | 01 | 1 | LGPD-04 | unit | `dotnet test --filter "DocumentRetention"` | ❌ W0 | ⬜ pending |
| 06-01-T7 | 01 | 1 | NOTF-01 | unit | `dotnet test --filter "DigestScheduler"` | ❌ W0 | ⬜ pending |
| 06-01-T8 | 01 | 1 | VER-011 | unit | `dotnet test --filter "Ocr"` | ❌ W0 | ⬜ pending |
| 06-01-T9 | 01 | 1 | VER-012 | unit | `dotnet test --filter "Vouching"` | ❌ W0 | ⬜ pending |
| 06-02-T1 | 02 | 2 | AUTH-009,AUTH-013,AUTH-014 | unit | `cd frontend && pnpm test -- --testPathPattern="auth"` | ❌ W0 | ⬜ pending |
| 06-02-T2 | 02 | 2 | UXDS-02 | unit | `cd frontend && pnpm test -- --testPathPattern="dark"` | ❌ W0 | ⬜ pending |
| 06-02-T3 | 02 | 2 | SHAR-01,SHAR-02,SHAR-03 | unit | `cd frontend && pnpm test -- --testPathPattern="share\|preview"` | ❌ W0 | ⬜ pending |
| 06-02-T4 | 02 | 2 | LGPD-02,LGPD-03 | unit | `cd frontend && pnpm test -- --testPathPattern="account"` | ❌ W0 | ⬜ pending |
| 06-03-T1 | 03 | 2 | AUTH-013,AUTH-014,UXDS-02 | unit | `cd mobile && npx jest --testPathPattern="auth\|dark"` | ❌ W0 | ⬜ pending |
| 06-03-T2 | 03 | 2 | SHAR-01,SHAR-02 | unit | `cd mobile && npx jest --testPathPattern="share"` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `tests/BairroNow.Api.Tests/Auth/TotpServiceTests.cs` — AUTH-009 stubs
- [ ] `tests/BairroNow.Api.Tests/Auth/GoogleOAuthTests.cs` — AUTH-013 stubs
- [ ] `tests/BairroNow.Api.Tests/Auth/MagicLinkTests.cs` — AUTH-014 stubs
- [ ] `tests/BairroNow.Api.Tests/Account/DataExportTests.cs` — LGPD-02 stubs
- [ ] `tests/BairroNow.Api.Tests/Account/AccountDeletionTests.cs` — LGPD-03 stubs
- [ ] `tests/BairroNow.Api.Tests/Account/DocumentRetentionTests.cs` — LGPD-04 stubs
- [ ] `tests/BairroNow.Api.Tests/Notifications/DigestSchedulerTests.cs` — NOTF-01 stubs
- [ ] `tests/BairroNow.Api.Tests/Verification/OcrServiceTests.cs` — VER-011 stubs
- [ ] `tests/BairroNow.Api.Tests/Verification/VouchingTests.cs` — VER-012 stubs
- [ ] `frontend/src/app/(auth)/__tests__/auth.test.tsx` — web auth stubs
- [ ] `frontend/src/app/(main)/__tests__/account.test.tsx` — LGPD stubs
- [ ] `mobile/src/features/auth/__tests__/auth.test.tsx` — mobile auth stubs
- [ ] `mobile/src/features/share/__tests__/share.test.tsx` — mobile share stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google Sign-In button triggers OAuth flow in browser | AUTH-013 | Requires real Google OAuth credentials and browser interaction | Click Google button on login → Google consent screen appears → redirected back with JWT |
| TOTP login gate for admin | AUTH-009 | Requires Authenticator app (real TOTP) | Log in as admin user with TOTP enabled → prompted for 6-digit code → enter valid code → access granted; enter wrong code → rejected |
| Magic link email is received and works | AUTH-014 | Requires real Resend integration + email inbox | Request magic link → check email → click link → logged in |
| WhatsApp share preview shows in WhatsApp | SHAR-01,SHAR-02 | WhatsApp crawls OG tags — requires live URL | Share post link via WhatsApp → preview card shows title + image + description |
| Non-logged-in user sees public preview + CTA | SHAR-03 | Requires manual browser session | Open /p/{postId} while logged out → sees content preview + "Entre no BairroNow" CTA |
| Weekly digest email received | NOTF-01 | Requires real Resend + Monday cadence | Set server time, trigger digest BackgroundService manually → email arrives in inbox |
| Dark mode toggle persists across reload | UXDS-02 | Requires browser localStorage inspection | Toggle dark mode → reload page → dark mode still active |
| LGPD data export downloads valid JSON | LGPD-02 | Requires end-to-end API + browser | Click "Exportar meus dados" → JSON file downloads with all personal data fields |
| TesseractOCR loads on SmarterASP (VER-011) | VER-011 | Native DLL behavior on shared hosting | Deploy smoke-test endpoint, call it, verify response instead of 500 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
