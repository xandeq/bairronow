---
phase: 05-map-groups
plan: 02
type: summary
status: completed
completed_at: 2026-04-12
---

# Phase 05-02 Summary — Map + Groups Frontend

## Packages Installed

| Package | Version |
|---------|---------|
| leaflet | ^1.9.4 |
| react-leaflet | ^5.0.0 |
| react-leaflet-cluster | ^4.1.3 |
| leaflet.heat | ^0.2.0 |
| @types/leaflet (dev) | ^1.9.21 |

## Leaflet Marker Icons

Copied to `frontend/public/leaflet/`:
- `marker-icon.png`
- `marker-icon-2x.png`
- `marker-shadow.png`

## Pages Created

| Route | File | Type |
|-------|------|------|
| `/map` | `src/app/(main)/map/page.tsx` | Server component (no `use client`) |
| `/map` (client logic) | `src/app/(main)/map/MapLoader.tsx` | Client — wraps dynamic import with `ssr: false` |
| `/map` (map UI) | `src/app/(main)/map/MapClient.tsx` | Client — react-leaflet MapContainer |
| `/groups` | `src/app/(main)/groups/page.tsx` | Client — groups listing with cards |
| `/groups/new` | `src/app/(main)/groups/new/page.tsx` | Client — create group form (react-hook-form + zod) |
| `/groups/[groupId]` | `src/app/(main)/groups/[groupId]/page.tsx` | Server — generateStaticParams wrapper |
| `/groups/[groupId]` (client) | `src/app/(main)/groups/[groupId]/GroupClient.tsx` | Client — feed + events + SignalR |
| `/groups/[groupId]/events` | `src/app/(main)/groups/[groupId]/events/page.tsx` | Server — redirect to group detail |
| `/admin/groups` | `src/app/(main)/admin/groups/page.tsx` | Client — flagged post moderation table |

## API Clients Created

### `frontend/src/lib/api/map.ts`
- `getPins(bairroId, filter?)` — GET /api/v1/map/pins
- `getPois(bairroId)` — GET /api/v1/map/pois
- `getHeatmap(bairroId)` — GET /api/v1/map/heatmap
- `updateMapPreference(showOnMap)` — PUT /api/v1/map/preference

### `frontend/src/lib/api/groups.ts`
- `getGroups(bairroId, params?)` — GET /api/v1/groups
- `createGroup(body)` — POST /api/v1/groups
- `getGroup(id)` — GET /api/v1/groups/{id}
- `joinGroup(groupId)` — POST /api/v1/groups/{id}/members
- `leaveGroup(groupId)` — DELETE /api/v1/groups/{id}/members/me
- `getGroupPosts(groupId, page)` — GET /api/v1/groups/{id}/posts
- `createGroupPost(groupId, body)` — POST /api/v1/groups/{id}/posts
- `toggleGroupPostLike(groupId, postId)` — POST /api/v1/groups/{id}/posts/{postId}/likes
- `deleteGroupPost(groupId, postId)` — DELETE /api/v1/groups/{id}/posts/{postId}
- `getGroupEvents(groupId)` — GET /api/v1/groups/{id}/events
- `createGroupEvent(groupId, body)` — POST /api/v1/groups/{id}/events
- `rsvpEvent(groupId, eventId, isAttending)` — POST /api/v1/groups/{id}/events/{eventId}/rsvp

## Zustand Store

`frontend/src/stores/group-store.ts` — `useGroupStore` with:
- `groups`, `currentGroup`, `posts`, `hasMore`, `page`
- Actions: `setGroups`, `setCurrentGroup`, `appendPosts`, `prependPost`, `removePost`, `resetFeed`, `incrementPage`

## TypeScript Types

- `frontend/src/lib/types/map.ts` — `MapPin`, `PointOfInterest`, `HeatmapCell`, `MapFilter`
- `frontend/src/lib/types/groups.ts` — `Group`, `GroupPost`, `GroupEvent`, `GroupCategory`, `GroupJoinPolicy`, `GroupScope`, `GroupMemberRole`, `GroupMemberStatus`

## Key Patterns Used

### Dynamic Import — SSR Avoidance
Next.js 16 with Turbopack requires `ssr: false` to be inside a Client Component. The solution uses a two-layer pattern:
- `page.tsx` (Server component) → imports `MapLoader.tsx`
- `MapLoader.tsx` (`'use client'`) → `dynamic(() => import('./MapClient'), { ssr: false })`
- `MapClient.tsx` (`'use client'`) → actual react-leaflet code

### Leaflet Icon Fix
```typescript
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});
```

### SignalR Group Rooms
`GroupClient.tsx` uses the async `getHubConnection()` (returns `Promise<HubConnection>`):
```typescript
getHubConnection().then((hub) => {
  hub.invoke('JoinGroup', groupId);
  hub.on('NewGroupPost', (post) => prependPost(post));
  hub.onreconnected(() => hub.invoke('JoinGroup', groupId));  // Pitfall 6 prevention
});
// cleanup: hub.invoke('LeaveGroup', groupId)
```

### generateStaticParams (Next.js static export)
Dynamic routes (`/groups/[groupId]`) include:
```typescript
export function generateStaticParams() {
  return [{ groupId: 'placeholder' }];
}
```

## Build Output

```
✓ Compiled successfully
✓ Generating static pages (31/31)

Routes added:
/groups          (Static)
/groups/new      (Static)
/groups/[groupId]     (SSG) → /groups/placeholder
/groups/[groupId]/events (SSG) → /groups/placeholder/events
/map             (Static)
/admin/groups    (Static)
```

## Tests

- `src/app/(main)/map/__tests__/MapClient.test.tsx` — 4 tests (render, toggle preference, verified badge popup, filter buttons)
- `src/app/(main)/groups/__tests__/groups.test.tsx` — 5 tests (group card render, composer submit, events tab, admin page render)
- **All 38 tests pass** (11 test suites total)

## Deviations from Plan

1. **`map/page.tsx` pattern**: Next.js 16 Turbopack does NOT allow `ssr: false` in a Server Component. Added `MapLoader.tsx` (`'use client'`) as an intermediate wrapper. The `page.tsx` remains a pure server component as required.

2. **`GroupClient.tsx` SignalR**: `getHubConnection()` is async (returns `Promise<HubConnection>`), so `hub.invoke()` is called inside `.then()` callback rather than synchronously.

3. **`groups/new/page.tsx`**: TypeScript required explicit cast `category as GroupCategory` since zod infers `string` for the category field.

4. **Admin test**: Used module-level `jest.mock('@/lib/api', ...)` instead of inline `jest.mock` inside a test callback (which doesn't work with Jest's module system).
