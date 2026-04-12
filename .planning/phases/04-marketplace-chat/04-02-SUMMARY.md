---
phase: 04-marketplace-chat
plan: 02
subsystem: ui
tags: [nextjs, react, zustand, signalr, react-hook-form, zod, tailwind, browser-image-compression, date-fns]

requires:
  - phase: 04-01
    provides: Backend marketplace/chat endpoints, SignalR hub chat extension, EF entities
  - phase: 03-02
    provides: Feed UI patterns, PostCard/CommentThread conventions, notification bell, Zustand store pattern
  - phase: 02-02
    provides: VerifiedBadge component, bairro scoping, admin dashboard shell

provides:
  - Marketplace grid page with infinite scroll, filter chips, search (D-05..D-11)
  - Listing create form with photo dropzone (D-01), category chip picker (D-03), zod validation
  - Listing detail with gallery, chat CTA, favorite, report, mark-sold, delete
  - ReportListingDialog with fixed reasons (D-20)
  - RatingForm 1-5 stars editable within 7 days (D-22/D-23)
  - 1:1 chat UI: ConversationList, ChatRoom, MessageBubble, MessageComposer
  - useSignalRChat hook reusing Phase 3 hub singleton (no new HubConnection)
  - Admin categories page (ON/OFF toggles, D-26)
  - Admin moderation page extended for listing reports with TargetType filter chips (D-21)
  - Unread badge on Mensagens nav tab from chatStore.unreadTotal
  - Full static export build (Next.js 16, output: export)

affects: [05-map-groups, 04-03]

tech-stack:
  added: []
  patterns:
    - "Server component wrapper pattern for dynamic routes in static export: page.tsx exports generateStaticParams + renders *Client.tsx component"
    - "Single SignalR connection shared by notifications (Phase 3) and chat (Phase 4) via getHubConnection() singleton"
    - "chatStore.connect() wires hub handlers once per session (module-level _wiredHandlers flag)"
    - "Zustand marketplaceStore with cursor pagination, verifiedOnly default ON (D-10)"

key-files:
  created:
    - frontend/src/components/features/marketplace/ListingCard.tsx
    - frontend/src/components/features/marketplace/ListingGrid.tsx (inline in marketplace page)
    - frontend/src/components/features/marketplace/FilterChips.tsx
    - frontend/src/components/features/marketplace/CategoryPicker.tsx
    - frontend/src/components/features/marketplace/PhotoDropzone.tsx
    - frontend/src/components/features/marketplace/ListingForm.tsx
    - frontend/src/components/features/marketplace/ListingDetailGallery.tsx
    - frontend/src/components/features/marketplace/ReportListingDialog.tsx
    - frontend/src/components/features/marketplace/RatingForm.tsx
    - frontend/src/components/features/chat/ConversationList.tsx
    - frontend/src/components/features/chat/ChatRoom.tsx
    - frontend/src/components/features/chat/MessageBubble.tsx
    - frontend/src/components/features/chat/MessageComposer.tsx
    - frontend/src/hooks/useSignalRChat.ts
    - frontend/src/lib/validators/listing.ts
    - frontend/src/lib/validators/rating.ts
    - frontend/src/lib/api/marketplace.ts
    - frontend/src/lib/api/chat.ts
    - frontend/src/stores/marketplace-store.ts
    - frontend/src/stores/chat-store.ts
    - frontend/src/app/(main)/marketplace/page.tsx
    - frontend/src/app/(main)/marketplace/new/page.tsx
    - frontend/src/app/(main)/marketplace/[id]/ListingDetailClient.tsx
    - frontend/src/app/(main)/marketplace/[id]/page.tsx
    - frontend/src/app/(main)/marketplace/[id]/edit/EditListingClient.tsx
    - frontend/src/app/(main)/marketplace/[id]/edit/page.tsx
    - frontend/src/app/(main)/chat/page.tsx
    - frontend/src/app/(main)/chat/[conversationId]/ChatRoomClient.tsx
    - frontend/src/app/(main)/chat/[conversationId]/page.tsx
    - frontend/src/app/(main)/admin/categories/page.tsx
    - frontend/__tests__/validators-listing.test.ts
    - frontend/__tests__/validators-rating.test.ts
    - frontend/__tests__/chat-store.test.ts
    - frontend/__tests__/ListingCard.test.tsx
    - frontend/__tests__/FilterChips.test.tsx
    - frontend/__tests__/ListingForm.test.tsx
  modified:
    - frontend/src/app/(main)/admin/moderation/page.tsx
    - frontend/src/components/layouts/MainHeader.tsx
    - frontend/src/lib/types/marketplace.ts
    - frontend/src/lib/categories.ts

key-decisions:
  - "Static export dynamic routes use server-component wrapper page.tsx (exports generateStaticParams with placeholder slug) + *Client.tsx for client logic — Next.js 16 does not allow generateStaticParams in 'use client' files"
  - "generateStaticParams must return at least one path — empty array [] is NOT sufficient for Next.js 16 output:export (checked via prerenderedRoutes.length > 0)"
  - "Single HubConnection shared between Phase 3 NotificationBell and Phase 4 chat via getHubConnection() singleton in signalr.ts"
  - "chatStore unread badge reads from hub UnreadChanged event, seeded on mount via REST getUnreadCount()"
  - "Admin moderation extends Phase 3 queue with targetType discriminator (post/comment/listing) on same endpoint — no new table"

requirements-completed: [MKT-001, MKT-002, MKT-003, MKT-004, MKT-005, MKT-006, MKT-007, MKT-008, MKT-009, MKT-010, MKT-011]

duration: 45min
completed: 2026-04-11
---

# Phase 4 Plan 02: Marketplace + Chat Web UI Summary

**Next.js 15/16 marketplace grid + chat UI with SignalR hub reuse, photo dropzone, category chip picker, and unified admin moderation queue — all in a static export build**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-11T00:00:00Z
- **Completed:** 2026-04-11T23:47:00Z
- **Tasks:** 3 (Task 0, Task 1, Task 2 + build fix)
- **Files modified:** 34

## Accomplishments

- Marketplace grid with infinite scroll, verified-seller filter (default ON), BRL price formatting, and "VENDIDO" overlay
- Photo dropzone (1-6 photos, drag-drop, first = cover), 2-step category chip picker, react-hook-form + zod validation
- Chat UI: ConversationList, ChatRoom with history pagination, MessageBubble (pt/own aligned), MessageComposer with image
- useSignalRChat hook invokes JoinConversation/LeaveConversation on the EXISTING Phase 3 hub — zero new connections
- Admin unified moderation queue extended with TargetType filter chips (post/comment/listing)
- Admin categories ON/OFF toggle page (D-26)
- Static export build passes for all 25 routes including dynamic [id] and [conversationId] segments

## Task Commits

1. **Task 0: Validators, API clients, Zustand stores, test stubs** - `840bc2e` (test)
2. **Task 1: Marketplace grid, detail, create/edit, report, rating** - `a6f588b` (feat)
3. **Task 2: Chat UI + SignalR hook + admin pages + static export fix** - `4f1e51d` (feat)

## Files Created/Modified

- `frontend/src/lib/validators/listing.ts` - Zod schema: title/desc/price/category + 1-6 File photos
- `frontend/src/lib/validators/rating.ts` - Zod schema: 1-5 stars, optional comment, listingId
- `frontend/src/lib/api/marketplace.ts` - axios wrappers for all listings/ratings/reports/categories endpoints
- `frontend/src/lib/api/chat.ts` - axios wrappers for conversations/messages/read/unread endpoints
- `frontend/src/stores/marketplace-store.ts` - Zustand: cursor, items, filters (verifiedOnly default true)
- `frontend/src/stores/chat-store.ts` - Zustand: conversations, messagesByConversation, unreadTotal, hub handlers
- `frontend/src/hooks/useSignalRChat.ts` - Joins conversation group on mount, leaves on unmount
- `frontend/src/components/features/marketplace/ListingCard.tsx` - 2-col card with BRL price, VENDIDO overlay, VerifiedBadge
- `frontend/src/components/features/marketplace/FilterChips.tsx` - Category chips + verified toggle + price range
- `frontend/src/components/features/marketplace/ListingForm.tsx` - RHF+zod, PhotoDropzone, CategoryPicker
- `frontend/src/components/features/marketplace/PhotoDropzone.tsx` - react-dropzone, 1-6 images, reorder arrows
- `frontend/src/components/features/marketplace/CategoryPicker.tsx` - 2-step chip grid (D-03)
- `frontend/src/components/features/chat/ChatRoom.tsx` - Hub-connected room with history load-more
- `frontend/src/components/features/chat/ConversationList.tsx` - Sorted by lastMessageAt, unread badge
- `frontend/src/components/features/chat/MessageBubble.tsx` - Aligned own/other, date-fns ptBR timestamp
- `frontend/src/components/features/chat/MessageComposer.tsx` - Text + image send, optimistic
- `frontend/src/app/(main)/marketplace/[id]/ListingDetailClient.tsx` - Detail client component (extracted for SSG)
- `frontend/src/app/(main)/marketplace/[id]/edit/EditListingClient.tsx` - Edit client component (extracted)
- `frontend/src/app/(main)/chat/[conversationId]/ChatRoomClient.tsx` - Chat room client component (extracted)
- `frontend/src/app/(main)/admin/moderation/page.tsx` - Extended with TargetType filter chips for listing reports
- `frontend/src/app/(main)/admin/categories/page.tsx` - ON/OFF toggle for 10 categories

## Decisions Made

- Used server component wrapper pattern for dynamic routes: `page.tsx` (server, has `generateStaticParams`) imports `*Client.tsx` (has `"use client"`)
- `generateStaticParams` must return at least one path with placeholder slug `{ id: "0" }` — Next.js 16 checks `prerenderedRoutes.length > 0`, rejects empty array
- `dynamicParams = false` prevents 404 for non-pre-generated slugs at runtime (client handles actual param via `useParams()`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js static export error for dynamic routes**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 `output: 'export'` rejects dynamic route pages that have `generateStaticParams` in a `"use client"` file
- **Fix:** Extracted client component to `*Client.tsx`, made `page.tsx` a server component with `generateStaticParams` returning a placeholder slug `{ id: "0" }`. Also discovered empty `[]` is not sufficient — `prerenderedRoutes.length > 0` must be true.
- **Files modified:** `marketplace/[id]/page.tsx`, `marketplace/[id]/edit/page.tsx`, `chat/[conversationId]/page.tsx` + new `*Client.tsx` siblings
- **Verification:** `pnpm build` exits 0 with 25 routes generated
- **Committed in:** `4f1e51d`

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Fix was necessary for the static export build to succeed. No scope creep.

## Known Stubs

None — all pages load real data from `api.bairronow.com.br` at runtime via authenticated API calls.

## Issues Encountered

- Next.js 16 (Turbopack) `generateStaticParams` in `"use client"` component silently ignored rather than erroring at compile time — the error only surfaces during "Collecting page data" worker phase, requiring a separate server component wrapper pattern
- Empty `generateStaticParams: return []` triggers the same "missing generateStaticParams" error — must return at least one placeholder path

## Next Phase Readiness

- Chat UI is wired to the Phase 4-01 backend hub via the shared SignalR connection
- Admin moderation and categories pages are functional against deployed API
- All marketplace CRUD flows are complete from the frontend perspective
- Phase 5 (Map + Groups) can build on Phase 2 verification + this marketplace foundation

---
*Phase: 04-marketplace-chat*
*Completed: 2026-04-11*

## Self-Check: PASSED
