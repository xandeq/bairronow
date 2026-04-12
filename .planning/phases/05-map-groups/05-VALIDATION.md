---
phase: 05
slug: map-groups
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (backend)** | xUnit 2.9.x + FluentAssertions |
| **Framework (web)** | Jest 29.x + React Testing Library |
| **Framework (mobile)** | jest-expo |
| **Config file** | `frontend/jest.config.js`, `mobile/babel.config.js`, `tests/BairroNow.Api.Tests/` |
| **Quick run command** | `cd frontend && pnpm test -- --testPathPattern="map\|group" --passWithNoTests` |
| **Full suite command** | `cd frontend && pnpm test && cd ../mobile && npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-T0 | 01 | 1 | MAP-001..010, GRP-001..009 | unit | `cd tests && dotnet test --filter "Phase5"` | ❌ W0 | ⬜ pending |
| 05-01-T1 | 01 | 1 | MAP-001, MAP-002 | integration | `dotnet test --filter "MapPin"` | ❌ W0 | ⬜ pending |
| 05-01-T2 | 01 | 1 | GRP-001..GRP-009 | unit | `dotnet test --filter "Group"` | ❌ W0 | ⬜ pending |
| 05-02-T0 | 02 | 2 | MAP-001..MAP-006 | unit | `cd frontend && pnpm test -- --testPathPattern="map"` | ❌ W0 | ⬜ pending |
| 05-02-T1 | 02 | 2 | GRP-001..GRP-006 | unit | `cd frontend && pnpm test -- --testPathPattern="group"` | ❌ W0 | ⬜ pending |
| 05-03-T0 | 03 | 2 | MAP-001..MAP-010 | unit | `cd mobile && npx jest --testPathPattern="map"` | ❌ W0 | ⬜ pending |
| 05-03-T1 | 03 | 2 | GRP-001..GRP-009 | unit | `cd mobile && npx jest --testPathPattern="group"` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `tests/BairroNow.Api.Tests/Map/MapPinServiceTests.cs` — MAP-001..010 stubs
- [ ] `tests/BairroNow.Api.Tests/Groups/GroupServiceTests.cs` — GRP-001..009 stubs
- [ ] `frontend/src/app/(main)/map/__tests__/map.test.tsx` — web map stubs
- [ ] `frontend/src/app/(main)/groups/__tests__/groups.test.tsx` — web groups stubs
- [ ] `mobile/src/features/map/__tests__/map.test.tsx` — mobile map stubs
- [ ] `mobile/src/features/groups/__tests__/groups.test.tsx` — mobile groups stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Map pins appear at block-level (not exact address) | MAP-003 | Requires visual inspection of pin accuracy | Open map, compare pin vs real address — must be offset ≥50m |
| Map opt-out toggle removes own pin from neighbors' view | MAP-004 | Cross-account visual check | User A opts out → User B refreshes map → A's pin disappears |
| Google Maps API key works in EAS production build | MAP-009 | EAS credentials required | Run `eas build --profile production`, install on device |
| RSVP count updates live via SignalR | GRP-009 | Real-time cross-client test | Two browsers: User A RSVPs → User B sees count increment without refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
