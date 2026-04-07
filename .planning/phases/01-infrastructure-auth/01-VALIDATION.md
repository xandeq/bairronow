---
phase: 1
slug: infrastructure-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.9.x (.NET) + Jest 29.x (Next.js) |
| **Config file** | `tests/NossoVizinho.Tests/NossoVizinho.Tests.csproj` / `frontend/jest.config.ts` |
| **Quick run command** | `dotnet test --filter "Category!=Integration" --no-build` |
| **Full suite command** | `dotnet test && cd frontend && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test --filter "Category!=Integration" --no-build`
- **After every plan wave:** Run `dotnet test && cd frontend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | INF-001 | manual | Domain registration via Registro.br | N/A | ⬜ pending |
| 01-01-02 | 01 | 0 | INF-002 | manual | WHM API cPanel provisioning | N/A | ⬜ pending |
| 01-01-03 | 01 | 0 | INF-003 | manual | SmarterASP provisioning | N/A | ⬜ pending |
| 01-01-04 | 01 | 0 | INF-004 | integration | `curl -s https://bairronow.com.br` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-001 | unit | `dotnet test --filter "RegisterEndpoint"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-002 | unit | `dotnet test --filter "LoginEndpoint"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | AUTH-003 | unit | `dotnet test --filter "JwtToken"` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | AUTH-004 | unit | `dotnet test --filter "RefreshToken"` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | AUTH-005 | unit | `dotnet test --filter "PasswordHash"` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | AUTH-006 | unit | `dotnet test --filter "InputValidation"` | ❌ W0 | ⬜ pending |
| 01-02-07 | 02 | 1 | AUTH-007 | unit | `dotnet test --filter "RateLimiting"` | ❌ W0 | ⬜ pending |
| 01-02-08 | 02 | 1 | AUTH-008 | unit | `dotnet test --filter "AuditLog"` | ❌ W0 | ⬜ pending |
| 01-02-09 | 02 | 1 | AUTH-011 | unit | `dotnet test --filter "Logout"` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | UXDS-01 | snapshot | `cd frontend && npm test -- --testPathPattern="layout"` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | UXDS-03 | unit | `cd frontend && npm test -- --testPathPattern="auth"` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 1 | LGPD-01 | unit | `dotnet test --filter "ConsentEndpoint"` | ❌ W0 | ⬜ pending |
| 01-03-04 | 03 | 1 | LGPD-05 | unit | `dotnet test --filter "DataEncryption"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/NossoVizinho.Tests/NossoVizinho.Tests.csproj` — xUnit test project with references
- [ ] `tests/NossoVizinho.Tests/Auth/` — test stubs for AUTH-001 through AUTH-011
- [ ] `frontend/jest.config.ts` — Jest configuration for Next.js
- [ ] `frontend/__tests__/` — test stubs for UXDS-01, UXDS-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Domain registration | INF-001 | External service (Registro.br) | Verify via `dig bairronow.com.br` returns Cloudflare NS |
| cPanel provisioning | INF-002 | WHM API call to shared hosting | Verify cPanel login works at provisioned URL |
| SmarterASP setup | INF-003 | External service provisioning | Verify API responds at deployed URL |
| HTTPS/SSL | INF-004 | Certificate provisioning | `curl -vI https://bairronow.com.br` shows valid cert |
| Cross-origin auth | AUTH-003 | Requires both domains live | Browser test: login on frontend, verify cookie sent to API |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
