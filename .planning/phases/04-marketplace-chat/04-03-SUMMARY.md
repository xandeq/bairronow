---
phase: 04-marketplace-chat
plan: "03"
subsystem: mobile
tags: [expo, react-native, signalr, marketplace, chat, jest, testing]
dependency_graph:
  requires: ["04-01", "04-02", "02-03"]
  provides: ["mobile-marketplace", "mobile-chat", "mobile-signalr-singleton"]
  affects: ["mobile-navigation", "mobile-stores"]
tech_stack:
  added: ["jest-expo@55", "@testing-library/react-native@13", "babel-preset-expo@55", "@microsoft/signalr@8.0.7"]
  patterns: ["zustand-store-testing", "jest-mock-factory-inline", "pnpm-jest-compat"]
key_files:
  created:
    - mobile/babel.config.js
    - mobile/jest-setup.js
    - mobile/src/features/marketplace/__tests__/marketplace-grid.test.tsx
    - mobile/src/features/chat/__tests__/chat-screen.test.tsx
  modified:
    - mobile/package.json (jest config, devDependencies, test script)
    - .planning/phases/04-marketplace-chat/04-VALIDATION.md (04-03 tasks marked green)
decisions:
  - "jest testEnvironment:node with minimal jest-setup.js polyfills avoids pnpm virtual store ESM incompatibility with react-native/jest/setup.js"
  - "jest.mock() factory inline pattern (mocks initialized inside factory) avoids babel hoisting issues with mock variable references"
  - "Source-level static analysis tests for Pitfall 1+2 compliance instead of runtime mock verification (more reliable with module singleton)"
metrics:
  duration: ~35min
  completed: 2026-04-11
  tasks: 3
  files: 6
---

# Phase 04 Plan 03: Mobile Marketplace + Chat Summary

Mobile Expo/React Native frontend for Phase 4: jest-expo test infrastructure configured for pnpm workspace, 14 marketplace tests and 14 chat/SignalR tests passing (28 total), verifying forced-WebSocket SignalR singleton, Pitfall 1+2 compliance, photo pipeline, store pagination, and BRL price formatting.

## What Was Built

All mobile implementation files were already committed by a parallel agent (commits b9dd3a8, 6feb1d4, eaa6c81) before this execution started. This plan execution focused on the missing test infrastructure and test files.

### Implementation (already committed by parallel agent)

| File | Description |
|------|-------------|
| `mobile/src/lib/signalr.ts` | Forced-WebSocket HubConnection singleton — `HttpTransportType.WebSockets + skipNegotiation: true + withAutomaticReconnect([0,2000,5000,10000,30000])`. onclose intentionally empty (Pitfall 2). |
| `mobile/src/lib/api/marketplace.ts` | Full marketplace REST client (list, search, create, update, markSold, remove, favorite, report, ratings) using RN FormData multipart shape |
| `mobile/src/lib/api/chat.ts` | Chat conversations + messages REST client |
| `mobile/src/lib/validators/listing.ts` | Zod schema — 1-6 photos, price > 0 (D-02), description max 500 |
| `mobile/src/lib/marketplace-store.ts` | Zustand grid pagination store with verifiedOnly default ON (D-10) |
| `mobile/src/lib/chat-store.ts` | Zustand chat store — connect() registers hub handlers once, no manual start() in callbacks |
| `mobile/src/components/marketplace/PhotoPicker.tsx` | expo-image-picker + expo-image-manipulator pipeline (1920w@85% JPEG), 1-6 photos, "Capa" badge on first (D-01) |
| `mobile/src/components/marketplace/ListingCard.tsx` | 2-col card, `Intl.NumberFormat('pt-BR',{currency:'BRL'})`, VerifiedBadge, VENDIDO overlay (D-05) |
| `mobile/app/marketplace/index.tsx` | FlatList numColumns=2, pull-to-refresh, infinite scroll, FAB for verified users |
| `mobile/app/marketplace/[id].tsx` | Photo carousel, Chat com vendedor → createConversation + navigate, owner actions, RatingForm, ReportListingSheet |
| `mobile/app/marketplace/new.tsx` | react-hook-form + zodResolver + multipart create |
| `mobile/app/chat/[id].tsx` | ChatScreen — JoinConversation on focus, LeaveConversation on blur, inverted FlatList, KeyboardAvoidingView |
| `mobile/app/chat/index.tsx` | ConversationListScreen — sorted by lastMessageAt DESC, unread badge |

### Test Infrastructure (this execution)

| File | Purpose |
|------|---------|
| `mobile/babel.config.js` | babel-preset-expo config for jest transform |
| `mobile/jest-setup.js` | Minimal polyfills (avoids pnpm virtual store ESM issue with react-native setup.js) |
| `mobile/package.json` | jest config: node environment, babel-jest transform, custom transformIgnorePatterns |

### Tests Created (this execution)

| File | Tests | Coverage |
|------|-------|----------|
| `mobile/src/features/marketplace/__tests__/marketplace-grid.test.tsx` | 14 | Validator (photos min/max, price>0, D-02), store pagination, pt-BR BRL formatting, D-10 verifiedOnly default |
| `mobile/src/features/chat/__tests__/chat-screen.test.tsx` | 14 | Hub registration once, appendMessage dedup, setActive, markRead, Pitfall 1+2 source-level compliance |

## SignalR Configuration Confirmation

| Property | Value | Pitfall |
|----------|-------|---------|
| `transport` | `HttpTransportType.WebSockets` | Pitfall 1 — Expo release build fix |
| `skipNegotiation` | `true` | Pitfall 1 — bypass problematic negotiate step |
| `withAutomaticReconnect` | `[0, 2000, 5000, 10000, 30000]` | Pitfall 2 — auto recovery without manual start() |
| `onclose` callback | Intentionally empty (only `console.warn`) | Pitfall 2 — NO `start()` inside onclose |
| Singleton | Module-level `let connection` | Shared across chat + notifications |

## EAS Release Build Smoke Test

**Status:** PENDING (manual, requires EAS credentials)

**Steps to execute when EAS credentials are available:**
```
eas build --profile preview --platform ios
```
1. Install IPA on physical iOS device via TestFlight or direct install
2. Open BairroNow → navigate to Chat tab
3. Send a message to another user
4. Background the app for 60 seconds (home button / swipe up)
5. Foreground the app
6. Send another message
7. Verify: message delivers without crash, no manual reconnect prompt, no "WebSocket failed" error in logs

**Expected result:** withAutomaticReconnect handles reconnection transparently. iOS onclose does not crash the RN bridge.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pnpm virtual store ESM incompatibility with jest-expo**
- **Found during:** Task 0
- **Issue:** jest-expo 55.x preset uses `react-native/jest/setup.js` as a `setupFile`, but this file uses top-level `import` statements. In the pnpm virtual store, the path includes the full hash (`.pnpm/react-native@0.81.5_.../node_modules/react-native/jest/setup.js`), and jest's `transformIgnorePatterns` (which only applies to test files, not setupFiles) cannot override this. The file is treated as a CommonJS context and fails with `SyntaxError: Cannot use import statement outside a module`.
- **Fix:** Created `jest-setup.js` with minimal polyfills (`global.IS_REACT_ACT_ENVIRONMENT`, `requestAnimationFrame`, etc.) and overrode the jest config to use `testEnvironment: "node"` + custom `setupFiles` instead of the jest-expo preset's setupFiles. Also set `transformIgnorePatterns` to allow transformation of relevant packages.
- **Files modified:** `mobile/babel.config.js`, `mobile/jest-setup.js`, `mobile/package.json`
- **Commit:** 5488443

**2. [Rule 1 - Bug] jest.mock() factory hoisting — HubConnectionBuilder not a constructor**
- **Found during:** Task 2
- **Issue:** `jest.mock('@microsoft/signalr', () => ({ HubConnectionBuilder: mockHubConnectionBuilder }))` — the variable `mockHubConnectionBuilder` is defined with `jest.fn().mockImplementation(...)` AFTER the jest.mock call. Despite babel's `mock` prefix exception, the variable was referencing the outer scope which was not yet initialized when the factory ran. Result: `TypeError: _signalr.HubConnectionBuilder is not a constructor`.
- **Fix:** Moved all mock function initializations INSIDE the jest.mock factory closure. Added `__esModule: true` to the factory return. Used `let` declarations at module scope (uninitialized) with assignment inside factory.
- **Files modified:** `mobile/src/features/chat/__tests__/chat-screen.test.tsx`
- **Commit:** 78d3552

**3. [Rule 3 - Blocking] Test file paths use features/ subdirectory not present in project**
- **Found during:** Task 0 (module resolution)
- **Issue:** PLAN.md specified test files at `mobile/src/features/marketplace/__tests__/` and `mobile/src/features/chat/__tests__/`, but actual source files are at `mobile/src/lib/` and `mobile/src/components/`. Relative imports needed correction from `../../lib/` to `../../../lib/`.
- **Fix:** Created test directories and used correct `../../../lib/` relative paths.
- **Files modified:** Both test files
- **Commit:** 9e22d18, 78d3552

### Scope Notes

- Test file locations deviate from plan's `mobile/src/features/*/` path (actual is `mobile/src/components/*/` and `mobile/src/lib/`). The test directories were created per plan spec and import paths adjusted accordingly.
- The plan's Task 1 acceptance criterion for `grep -n "Intl.NumberFormat.*pt-BR.*BRL"` against `src/features/marketplace/components/ListingCard.tsx` — the actual file is at `src/components/marketplace/ListingCard.tsx` (flat component structure). The implementation matches the requirement exactly.

## Known Stubs

None — all stores, screens, and API clients are fully wired. The EAS smoke test is manual/pending (not a stub).

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `04-03-SUMMARY.md` exists | FOUND |
| `marketplace-grid.test.tsx` exists | FOUND |
| `chat-screen.test.tsx` exists | FOUND |
| `babel.config.js` exists | FOUND |
| Commit 5488443 exists | FOUND |
| Commit 9e22d18 exists | FOUND |
| Commit 78d3552 exists | FOUND |
| Jest test run: 28/28 pass | PASSED |
