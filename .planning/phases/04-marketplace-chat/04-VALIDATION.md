---
phase: 4
slug: marketplace-chat
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Planner will fill the per-task map once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Backend framework** | xUnit 2.9.x + Moq + FluentAssertions (existing) |
| **Web framework** | Jest 29.x + React Testing Library (existing) |
| **Mobile framework** | Jest (Expo preset) + React Native Testing Library (existing) |
| **E2E framework** | Playwright (existing e2e/ suite) |
| **Config files** | `backend/tests/*.csproj`, `web/jest.config.js`, `mobile/jest.config.js`, `e2e/playwright.config.ts` |
| **Quick run command** | `dotnet test --filter Category=Unit && pnpm --filter web test -- --changedSince=HEAD && pnpm --filter mobile test -- --changedSince=HEAD` |
| **Full suite command** | `dotnet test && pnpm --filter web test && pnpm --filter mobile test && pnpm --filter e2e test` |
| **Estimated runtime** | ~180 seconds full, ~30 seconds quick |

---

## Sampling Rate

- **After every task commit:** Run quick command scoped to the affected project
- **After every plan wave:** Run full suite for the plan's project + cross-project smoke
- **Before `/gsd:verify-work`:** Full suite + Playwright E2E must be green
- **Max feedback latency:** 30 seconds (quick) / 180 seconds (full)

---

## Per-Task Verification Map

*Populated by gsd-planner after PLAN.md files exist. One row per task with automated command or Wave 0 marker.*

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/Marketplace/ListingServiceTests.cs` — stubs for MKT-001, MKT-005, MKT-006
- [ ] `backend/tests/Marketplace/MarketplaceSearchTests.cs` — stubs for MKT-002, MKT-007 (full-text CONTAINS smoke test against SmarterASP sandbox)
- [ ] `backend/tests/Chat/ChatHubTests.cs` — stubs for MKT-004 SignalR hub extension
- [ ] `backend/tests/Chat/ConversationRepositoryTests.cs` — stubs for unread count + LastReadAt
- [ ] `backend/tests/Moderation/ListingReportTests.cs` — stubs for MKT-008 shared queue with ReportTargetType
- [ ] `backend/tests/Ratings/RatingServiceTests.cs` — stubs for MKT-010
- [ ] `web/src/app/marketplace/__tests__/grid.test.tsx` — stubs for MKT-002 grid + filters
- [ ] `web/src/app/marketplace/__tests__/listing-detail.test.tsx` — stubs for MKT-003
- [ ] `web/src/app/marketplace/__tests__/create-listing.test.tsx` — stubs for MKT-001 photo upload flow
- [ ] `web/src/app/chat/__tests__/chat-room.test.tsx` — stubs for MKT-004 real-time message rendering
- [ ] `mobile/src/features/marketplace/__tests__/marketplace-grid.test.tsx` — stubs for mobile MKT-002
- [ ] `mobile/src/features/chat/__tests__/chat-screen.test.tsx` — stubs for mobile MKT-004 with forced-WebSocket SignalR
- [ ] `e2e/specs/marketplace.spec.ts` — Playwright smoke: create listing → appears in grid → buyer opens chat → seller marks sold
- [ ] Wave 0 smoke: verify SmarterASP SQL full-text index sync lag (CONTAINS returns row <5s after INSERT)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expo SignalR on physical device (release build) | MKT-004 | Expo Go masks WebSocket transport bugs | EAS preview build → install on iOS + Android → open chat → background 60s → foreground → verify auto-reconnect + no onclose crash |
| Cloudflare cache headers on `/uploads/listings/*` | MKT-001 | CF cache must show HIT after first request | `curl -I https://bairronow.com.br/uploads/listings/xyz.jpg` twice → expect `cf-cache-status: HIT` on 2nd |
| Photo EXIF stripping on upload | MKT-001, LGPD | Privacy — must strip GPS from user photos | Upload photo with EXIF GPS → fetch stored file → `exiftool` shows no GPS tags |
| Image-in-chat file-size cap enforcement | MKT-004 | Server-side rejection path | POST 6MB image to chat endpoint → expect 413 |
| Rating edit window (7 days) | MKT-010 | Time-based behavior | DB time travel or manual wait — document in plan |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
