---
phase: 04-marketplace-chat
verified: 2026-04-11T12:00:00Z
status: gaps_found
score: 7/8 must-haves verified
gaps:
  - truth: "Mobile user has persistent bottom navigation (tab bar) with Marketplace + Chat tabs and unread badge"
    status: failed
    reason: "mobile/src/navigation/BottomTabs.tsx does not exist. Mobile uses a Stack navigator with navigation buttons on the feed page instead. No persistent tab bar with Marketplace/Chat tabs or unread badge is present."
    artifacts:
      - path: "mobile/src/navigation/BottomTabs.tsx"
        issue: "File missing — never created. Plan 03 tasks 1+2 both required this file."
    missing:
      - "Create mobile/src/navigation/BottomTabs.tsx with Marketplace and Chat tabs"
      - "Bind Chat tab badge to chatStore.unreadTotal"
      - "Register Marketplace and Chat screens in the tab navigator"
human_verification:
  - test: "End-to-end chat flow — real-time message delivery"
    expected: "Buyer opens listing detail, taps 'Chat com vendedor', sends a message; seller receives it in real-time without refresh; seller marks listing sold; buyer sees RatingForm prompt"
    why_human: "SignalR real-time delivery requires a running server and two authenticated sessions — cannot verify programmatically"
  - test: "EAS iOS release build — SignalR WebSocket reconnect after backgrounding"
    expected: "App backgrounds 60s, foregrounds, sends another message — delivers without crash, no manual reconnect required"
    why_human: "Requires physical iOS device + EAS build profile + TestFlight install. Documented in VALIDATION.md manual section."
  - test: "Cloudflare CDN cache for listing photos"
    expected: "Second request to /uploads/listings/* returns cf-cache-status: HIT"
    why_human: "Requires deployed environment + CDN headers inspection"
---

# Phase 4: Marketplace + Chat Verification Report

**Phase Goal:** Full marketplace (listings CRUD, photos, search, favorites, ratings, reports) and 1:1 chat (SignalR, history, unread) across Web (Next.js) and Mobile (Expo). Admin moderation queue extended for listings. Category taxonomy seeded and toggleable.
**Verified:** 2026-04-11T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Backend exposes full listings CRUD + chat + ratings + reports API with EF migration | VERIFIED | All entities exist in `src/BairroNow.Api/Models/Entities/`; 6 controllers in `Controllers/v1/`; migration `20260408012526_Phase4MarketplaceChat.cs` present; 19 backend tests pass |
| 2 | SignalR hub extended with JoinConversation/LeaveConversation; MessageReceived broadcast via conv:{id} group | VERIFIED | `NotificationHub.cs` lines 26+40 implement Join/Leave; `ChatService.cs` line 152 broadcasts `conv:{id}` group; no second HubConnection created |
| 3 | Web (Next.js) marketplace grid, create, detail, edit, report, rate, favorite all functional | VERIFIED | All 9 components in `frontend/src/components/features/marketplace/`; pages at `marketplace/page.tsx`, `[id]/ListingDetailClient.tsx`, `new/page.tsx`, `[id]/edit/EditListingClient.tsx`; RatingForm and ReportListingDialog wired in detail page |
| 4 | Web chat UI wired to existing Phase 3 SignalR connection (no new HubConnection) | VERIFIED | `useSignalRChat.ts` imports `getHubConnection` from `@/lib/signalr`; `new HubConnectionBuilder` appears only in the singleton `signalr.ts`; unread badge reads from `chatStore.unreadTotal` in `MainHeader.tsx` |
| 5 | Admin moderation queue extended for listings; category toggle page live | VERIFIED | `admin/moderation/page.tsx` has TargetType filter chips (post/comment/listing); `admin/categories/page.tsx` has ON/OFF toggle calling `adminToggleCategory` |
| 6 | Mobile marketplace screens with PhotoPicker (expo-image-manipulator pipeline) | VERIFIED | All screens present in `mobile/app/marketplace/`; `PhotoPicker.tsx` uses `ImageManipulator.manipulateAsync` at 1920w@85% JPEG; `numColumns={2}` in `MarketplaceScreen`; BRL formatting confirmed |
| 7 | Mobile chat uses forced-WebSocket SignalR singleton (Pitfall 1+2 compliance) | VERIFIED | `mobile/src/lib/signalr.ts` has `HttpTransportType.WebSockets`, `skipNegotiation: true`, `withAutomaticReconnect([0,2000,5000,10000,30000])`; `onclose` intentionally empty; `ChatScreen` uses `getHubConnection()` singleton |
| 8 | Mobile has persistent bottom tab bar with Marketplace + Chat tabs and unread badge | FAILED | `mobile/src/navigation/BottomTabs.tsx` does not exist; app uses a Stack navigator; navigation to marketplace/chat is via buttons on feed page only |

**Score:** 7/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/BairroNow.Api/Models/Entities/Listing.cs` | Listing aggregate | VERIFIED | Present |
| `src/BairroNow.Api/Models/Entities/Conversation.cs` | Conversation entity | VERIFIED | Present |
| `src/BairroNow.Api/Models/Entities/Message.cs` | Message entity | VERIFIED | Present |
| `src/BairroNow.Api/Constants/Categories.cs` | 10-category taxonomy | VERIFIED | Present |
| `src/BairroNow.Api/Migrations/20260408012526_Phase4MarketplaceChat.cs` | EF migration + FTS | VERIFIED | Has `SERVERPROPERTY('IsFullTextInstalled')` guard |
| `src/BairroNow.Api/Hubs/NotificationHub.cs` | Extended hub | VERIFIED | JoinConversation + LeaveConversation present |
| `frontend/src/hooks/useSignalRChat.ts` | Shared hub hook | VERIFIED | Uses `getHubConnection()` singleton, invokes `JoinConversation` |
| `frontend/src/stores/chat-store.ts` | Zustand chat store | VERIFIED | `messagesByConversation`, `unreadTotal`, hub handlers |
| `frontend/src/stores/marketplace-store.ts` | Zustand marketplace store | VERIFIED | `verifiedOnly: true` default (D-10) |
| `frontend/src/components/features/marketplace/ListingCard.tsx` | 2-col card | VERIFIED | BRL format via `Intl.NumberFormat("pt-BR", { currency: "BRL" })`, VerifiedBadge, VENDIDO overlay |
| `frontend/src/components/features/marketplace/FilterChips.tsx` | Filter chips | VERIFIED | "Vendedor não verificado" warning present |
| `frontend/src/app/(main)/marketplace/[id]/ListingDetailClient.tsx` | Listing detail | VERIFIED | RatingForm, ReportListingDialog, createConversation, markSold, deleteListing, toggleFavorite all present |
| `frontend/src/app/(main)/admin/moderation/page.tsx` | Extended moderation queue | VERIFIED | TargetType filter chips for post/comment/listing |
| `frontend/src/app/(main)/admin/categories/page.tsx` | Category toggle page | VERIFIED | ON/OFF toggle per category |
| `mobile/src/lib/signalr.ts` | Forced-WebSocket singleton | VERIFIED | WebSockets + skipNegotiation + withAutomaticReconnect |
| `mobile/src/components/marketplace/PhotoPicker.tsx` | Expo image pipeline | VERIFIED | `ImageManipulator.manipulateAsync`, selectionLimit |
| `mobile/app/chat/[id].tsx` (ChatScreen) | Mobile chat | VERIFIED | JoinConversation on focus, LeaveConversation on blur |
| `mobile/src/lib/chat-store.ts` | Mobile chat store | VERIFIED | `messagesByConversation`, `unreadTotal`, hub handlers |
| `mobile/src/navigation/BottomTabs.tsx` | Mobile bottom tab bar | MISSING | File not created; plan required Marketplace + Chat tabs with unread badge |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ChatService.SendAsync` | NotificationHub group `conv:{id}` | `_hub.Clients.Group($"conv:{conversationId}").SendAsync("MessageReceived", ...)` | WIRED | Line 152 in ChatService.cs |
| `useSignalRChat.ts` | Existing Phase 3 hub connection | `getHubConnection()` singleton, invokes `JoinConversation` | WIRED | Line 26+28 in useSignalRChat.ts |
| `ListingDetailClient.tsx` | `POST /api/v1/chat/conversations` | `createConversation(listing.id)` then route to chat | WIRED | Lines 18, 85 |
| `ChatRoom.tsx` | `chatStore` | `useChatStore` selectors for `messages`, `sendMessage` | WIRED | Lines 7, 23-28 |
| `ListingService.ReportAsync` | Shared Reports table | `TargetType = ReportTargetTypes.Listing` | WIRED | Line 349 in ListingService.cs |
| `mobile/src/lib/signalr.ts` | `api.bairronow.com.br/hubs/notifications` | `HttpTransportType.WebSockets + skipNegotiation: true` | WIRED | Lines 31-32 |
| `mobile/src/components/marketplace/PhotoPicker.tsx` | expo-image-manipulator | `ImageManipulator.manipulateAsync` | WIRED | Line 40 |
| `mobile/app/chat/[id].tsx` | `chatStore` | `useChatStore` selectors | WIRED | via store imports |
| `mobile/src/navigation/BottomTabs.tsx` | Chat unread badge | `chatStore.unreadTotal` | NOT_WIRED | File does not exist |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| MKT-001 | 04-01, 04-02, 04-03 | Verified users create listings — title, description, price, category, up to 6 photos | SATISFIED | Backend `POST /api/v1/listings`, web `ListingForm.tsx` + `PhotoDropzone.tsx`, mobile `CreateListingScreen` + `PhotoPicker.tsx` |
| MKT-002 | 04-02, 04-03 | Bairro marketplace grid — thumbnail, title, price; filter by category + price range; sort by recency/price | SATISFIED | Web `marketplace/page.tsx` + `FilterChips.tsx`; mobile `MarketplaceScreen` `numColumns={2}`; backend `GET /api/v1/listings?category=&sort=&cursor=` |
| MKT-003 | 04-01, 04-02, 04-03 | Listing detail — photo gallery, description, price, seller profile with badge, date | SATISFIED | Web `ListingDetailClient.tsx` + `ListingDetailGallery.tsx`; mobile `ListingDetailScreen`; backend `GET /api/v1/listings/{id}` |
| MKT-004 | 04-01, 04-02, 04-03 | Private 1:1 chat — text + image, linked to listing, new message notifications | SATISFIED | `ChatService.SendAsync` persists + broadcasts; web `ChatRoom.tsx`; mobile `ChatScreen`; SignalR `MessageReceived` + `UnreadChanged` events |
| MKT-005 | 04-01, 04-02, 04-03 | Mark listing as sold — "Sold" visual, soft deleted after 7 days | SATISFIED | Backend `POST /api/v1/listings/{id}/mark-sold`; `ListingService.MarkSoldAsync` sets `SoldAt`; VENDIDO overlay in both web and mobile `ListingCard` |
| MKT-006 | 04-01, 04-02, 04-03 | Edit/remove listing — seller edits all fields, soft delete with confirmation | SATISFIED | Backend `PATCH /api/v1/listings/{id}` + `DELETE`; web `EditListingClient.tsx`; mobile `EditListingScreen`; `deleteListing` in detail page |
| MKT-007 | 04-01, 04-02, 04-03 | Full-text search in listings — combined filters: category, price, distance, verified seller | SATISFIED | Backend `GET /api/v1/listings/search?q=&category=&minPrice=&maxPrice=&verifiedOnly=`; LIKE fallback for LocalDB, CONTAINS comment retained; web + mobile search wired |
| MKT-008 | 04-01, 04-02, 04-03 | Report listing — prohibited item, scam, abusive price, misinformation; separate moderation queue | SATISFIED | `ListingService.ReportAsync` adds to shared Reports table with `TargetType="listing"`; web `ReportListingDialog.tsx`; mobile `ReportListingSheet.tsx`; admin moderation extended |
| MKT-009 | 04-01, 04-02, 04-03 | Favorite listings — notification on price change, favorites counter | SATISFIED | `POST /api/v1/listings/{id}/favorite` toggle with price snapshot; `ListingFavorite` entity; web + mobile heart button wired |
| MKT-010 | 04-01, 04-02, 04-03 | Seller ratings — 1-5 stars + comment after transaction; 7-day edit window; average on seller profile | SATISFIED | `RatingService` enforces 7-day window; `GET /api/v1/sellers/{id}/ratings` returns average; web `RatingForm.tsx`; mobile `RatingForm.tsx` |
| MKT-011 | 04-01, 04-02, 04-03 | Categories + subcategories taxonomy; browse + filter navigation | SATISFIED | `Constants/Categories.cs` with 10 categories + subcategories; `GET /api/v1/categories`; `PATCH /api/v1/admin/categories/{code}`; web + mobile `CategoryPicker.tsx` (2-step chip grid D-03) |
| MKT-012 | 04-01 | Paid spotlight for local businesses — "Verified Business" badge | PENDING/DEFERRED | Acknowledged as Phase 6 monetization in plan objective + SUMMARY deferred items |
| MKT-013 | 04-01 | Service listings with scheduling — time slots, booking | PENDING/DEFERRED | Acknowledged as backlog; `servicos` exists as flat category only per D-24 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/BairroNow.Api/Services/ListingService.cs` | ~296 | LIKE fallback instead of CONTAINS for FTS | Info | Documented deviation — LIKE is the executed path on LocalDB/dev; CONTAINS is deferred until FTS smoke test confirms SmarterASP SQL Server FTS is healthy. Not a runtime stub. |
| `src/BairroNow.Api/Models/Entities/ListingPhoto.cs` | — | `ThumbnailPath == StoragePath` (no dedicated 400x400 crop) | Warning | MVP deviation documented in summary. Photo is resized to max-1600 but no separate thumbnail. Post-MVP item. |
| `src/BairroNow.Api/Controllers/v1/CategoriesController.cs` | — | Admin category toggle state in `IMemoryCache` only (no DB persistence) | Warning | Resets on app restart. Documented in SUMMARY. Acceptable per D-26 ("toggles only"). |
| `mobile/src/navigation/BottomTabs.tsx` | — | MISSING — file not created | Blocker | Plan 03 required this file for persistent tab bar with Marketplace + Chat tabs and unread badge. Navigation exists via buttons on feed page but no tab bar. |

### Human Verification Required

#### 1. Real-time Chat Message Delivery

**Test:** With two authenticated accounts, open a listing detail as the buyer and tap "Chat com vendedor". Send a message. Verify the seller receives it live without refreshing.
**Expected:** MessageReceived SignalR event delivers the message to the seller's active ChatRoom in under 2 seconds.
**Why human:** Requires two active sessions against the deployed server. Cannot verify SignalR delivery programmatically without a real hub connection.

#### 2. EAS iOS Release Build — WebSocket Reconnect After Backgrounding

**Test:** Build with `eas build --profile preview --platform ios`, install on physical iOS device, navigate to Chat, send a message, background app for 60 seconds, foreground, send another message.
**Expected:** Message delivers without crash. No "WebSocket failed" error. `withAutomaticReconnect` handles reconnection silently.
**Why human:** Requires EAS credentials, physical device, and TestFlight/direct install. Documented in VALIDATION.md manual section.

#### 3. Cloudflare CDN Cache for Listing Photos

**Test:** Request a listing photo URL (`/uploads/listings/*`) twice via curl. Check `cf-cache-status` header on second request.
**Expected:** `cf-cache-status: HIT` — Cloudflare serves from cache after first request.
**Why human:** Requires deployed environment with Cloudflare proxy active. Documented in VALIDATION.md.

### Gaps Summary

One gap found: `mobile/src/navigation/BottomTabs.tsx` is missing.

The plan for mobile (04-03) explicitly required a `BottomTabs.tsx` navigation component with Marketplace and Chat tabs, and a chat unread badge bound to `chatStore.unreadTotal`. This file was listed in:
- `04-03-PLAN.md` frontmatter `files_modified`
- Task 1 action item 11: "Add Marketplace tab to BottomTabs.tsx"
- Task 2 action item 5: "Register chat tab in BottomTabs with unread badge bound to chatStore.unreadTotal"
- Task 1 acceptance criterion: "Marketplace tab registered in BottomTabs"

The mobile app currently uses a Stack navigator (`mobile/app/_layout.tsx`) with navigation buttons on the feed page (`mobile/app/feed.tsx` lines 27-28). All marketplace and chat screens are reachable, but there is no persistent tab bar. The unread badge on the chat tab (a plan requirement) is therefore not implemented on mobile.

All 13 MKT-* requirements are otherwise verified (MKT-012/013 are intentionally deferred to Phase 6/backlog and acknowledged in the plan objective). Web frontend, backend, and mobile core functionality are complete and tested.

---

_Verified: 2026-04-11T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
