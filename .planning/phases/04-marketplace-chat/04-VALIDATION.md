---
phase: 4
slug: marketplace-chat
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-07
updated: 2026-04-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Populated by gsd-planner.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | xUnit 2.9.x + Moq + FluentAssertions + Bogus (pt_BR) |
| **Web framework** | Jest 29.x + React Testing Library 16.x |
| **Mobile framework** | Jest + jest-expo + @testing-library/react-native |
| **E2E framework** | Playwright (existing e2e/ suite) |
| **Quick run command** | `dotnet test --filter "FullyQualifiedName~Marketplace|FullyQualifiedName~Chat" && cd web && pnpm test -- --testPathPattern="marketplace|chat" && cd ../mobile && npx jest --testPathPattern="marketplace|chat"` |
| **Full suite command** | `dotnet test && cd web && pnpm test && cd ../mobile && npx jest` |
| **Estimated runtime** | ~180 seconds full, ~30 seconds quick |

---

## Sampling Rate

- **After every task commit:** Run area-scoped test filter for the affected project
- **After every plan wave:** Run full suite for that project + cross-project smoke
- **Before `/gsd:verify-work`:** Full suite + Playwright E2E must be green
- **Max feedback latency:** 30 seconds (quick) / 180 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01 T0 | 04-01 | 0 | All MKT-* | stub | `dotnet test --filter "FullyQualifiedName~Marketplace|FullyQualifiedName~Chat"` | Wave 0 creates | ⬜ |
| 04-01 T0 | 04-01 | 0 | FTS sync lag | smoke | `FTS_SMOKE=1 dotnet test --filter FullTextSyncLag` | Wave 0 creates | ⬜ |
| 04-01 T1 | 04-01 | 1 | MKT-001/005/006/011 entities + MKT-008 shared queue + D-24 categories | unit + migration | `dotnet ef database update` + `dotnet test --filter Marketplace.Entity` | Task 0 stubs | ⬜ |
| 04-01 T2 | 04-01 | 1 | MKT-001, MKT-002, MKT-003, MKT-005, MKT-006, MKT-007, MKT-008, MKT-009, MKT-010, MKT-011 | integration | `dotnet test --filter "FullyQualifiedName~Marketplace|FullyQualifiedName~Ratings|FullyQualifiedName~Moderation.Listing"` | Task 0 stubs | ⬜ |
| 04-01 T3 | 04-01 | 1 | MKT-004 | integration | `dotnet test --filter "FullyQualifiedName~Chat"` | Task 0 stubs | ⬜ |
| 04-02 T0 | 04-02 | 2 | All web MKT-* stubs | unit | `cd web && pnpm test -- --testPathPattern="marketplace|chat|validators"` | Wave 0 creates | ⬜ |
| 04-02 T1 | 04-02 | 2 | MKT-001, MKT-002, MKT-003, MKT-005, MKT-006, MKT-007, MKT-008, MKT-009, MKT-010, MKT-011 (web) | RTL | `cd web && pnpm test -- --testPathPattern="marketplace"` | Task 0 stubs | ⬜ |
| 04-02 T2 | 04-02 | 2 | MKT-004 (web) + MKT-008 shared admin queue + D-26 toggle | RTL | `cd web && pnpm test -- --testPathPattern="chat|admin"` | Task 0 stubs | ⬜ |
| 04-03 T0 | 04-03 | 2 | SignalR singleton forced-WebSocket | unit | `cd mobile && npx jest --testPathPattern="marketplace|chat"` | Wave 0 creates | ⬜ |
| 04-03 T1 | 04-03 | 2 | MKT-001..011 (mobile marketplace) | RTL | `cd mobile && npx jest --testPathPattern="marketplace"` | Task 0 stubs | ⬜ |
| 04-03 T2 | 04-03 | 2 | MKT-004 (mobile chat) | RTL + manual EAS smoke | `cd mobile && npx jest --testPathPattern="chat"` + manual EAS | Task 0 stubs | ⬜ |

**Deferred (acknowledged in plans, not tested):**
- MKT-012 Paid spotlight → Phase 6
- MKT-013 Service scheduling → backlog (flat Serviços category only)

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/Api.Tests/Marketplace/ListingServiceTests.cs` — stubs for MKT-001, MKT-005, MKT-006
- [ ] `backend/tests/Api.Tests/Marketplace/MarketplaceSearchTests.cs` — stubs for MKT-002, MKT-007 (CONTAINS)
- [ ] `backend/tests/Api.Tests/Chat/ChatHubTests.cs` — stubs for MKT-004 hub extension
- [ ] `backend/tests/Api.Tests/Chat/ConversationRepositoryTests.cs` — stubs for dedupe
- [ ] `backend/tests/Api.Tests/Chat/UnreadCountTests.cs` — single-query + Pitfall 4 filter
- [ ] `backend/tests/Api.Tests/Moderation/ListingReportTests.cs` — stubs for MKT-008 shared queue
- [ ] `backend/tests/Api.Tests/Ratings/RatingServiceTests.cs` — stubs for MKT-010
- [ ] `backend/tests/Api.Tests/Smoke/FullTextSyncLagTests.cs` — SmarterASP FTS CHANGE_TRACKING lag smoke (<5s)
- [ ] `web/src/app/marketplace/__tests__/grid.test.tsx`
- [ ] `web/src/app/marketplace/__tests__/listing-detail.test.tsx`
- [ ] `web/src/app/marketplace/__tests__/create-listing.test.tsx`
- [ ] `web/src/app/chat/__tests__/chat-room.test.tsx`
- [ ] `mobile/src/features/marketplace/__tests__/marketplace-grid.test.tsx`
- [ ] `mobile/src/features/chat/__tests__/chat-screen.test.tsx`
- [ ] `e2e/specs/marketplace.spec.ts` — Playwright smoke: create → appears → chat → sold

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expo SignalR forced-WebSocket on physical device (release build) | MKT-004 | Expo Go masks WebSocket transport bugs documented in Pitfall 1 | `eas build --profile preview --platform ios` → install on device → open chat → send msg → background 60s → foreground → send msg → verify delivery + no crash + no manual reconnect |
| Cloudflare cache headers on `/uploads/listings/*` | MKT-001 | CF cache must show HIT | `curl -I https://bairronow.com.br/uploads/listings/xyz.jpg` twice → `cf-cache-status: HIT` on 2nd |
| Photo EXIF GPS stripping | MKT-001, LGPD | Privacy — strip GPS from user photos | Upload photo with EXIF GPS → fetch stored file → `exiftool` shows no GPS tags |
| Image-in-chat 5MB cap | MKT-004 | Server-side 413 rejection | POST 6MB image to chat endpoint → expect 413 |
| Rating 7-day edit window | MKT-010 | Time-based | Integration test with clock abstraction OR manual DB time travel |
| iOS onclose no-crash | MKT-004 | RN bridge issue Pitfall 2 | Kill WiFi on device mid-chat → observe auto-reconnect triggers → no crash |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
