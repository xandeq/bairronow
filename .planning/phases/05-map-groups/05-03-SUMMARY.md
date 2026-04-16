---
phase: 05-map-groups
plan: 03
type: summary
status: complete
completed_at: 2026-04-12
---

# 05-03 Summary — Mobile: Map + Groups

## Packages Installed

| Package | Version | Notes |
|---------|---------|-------|
| `react-native-maps` | 1.20.1 | Expo SDK 54 compatible (plan specified 1.27.2 — expo install resolved to 1.20.1 as the SDK-54 compatible version) |
| `react-test-renderer` | 19.1.0 | Fixed peer dep mismatch (was 19.2.0, needed 19.1.0 for @testing-library/react-native@13) |

## Files Modified

| File | Change |
|------|--------|
| `mobile/app.json` | Added react-native-maps config plugin with `androidGoogleMapsApiKey` / `iosGoogleMapsApiKey` placeholders |
| `mobile/package.json` | Added react-native-maps 1.20.1; react-test-renderer 19.1.0; updated moduleNameMapper to include `@/app/` → `<rootDir>/app/` |
| `mobile/app/(tabs)/_layout.tsx` | Added `map` and `groups/index` Tabs.Screen entries |
| `mobile/src/navigation/BottomTabs.tsx` | Added `map` and `groups/index` entries to TAB_CONFIG |

## Files Created

### Screens
| File | Route | Description |
|------|-------|-------------|
| `mobile/app/(tabs)/map.tsx` | `/map` | Map screen — MapView with user pins, POIs, filter switches, ShowOnMap toggle |
| `mobile/app/(tabs)/groups/index.tsx` | `/groups` | Groups listing — FlatList of group cards with Join button |
| `mobile/app/(tabs)/groups/[groupId].tsx` | `/groups/:groupId` | Group detail — feed + events tabs, SignalR real-time posts, RSVP |
| `mobile/app/(tabs)/groups/new.tsx` | `/groups/new` | Create group form with category chips and validation |

### Feature API Clients
| File | Functions |
|------|-----------|
| `mobile/src/features/map/mapApi.ts` | `getPins()`, `getPois()`, `updateMapPreference()` |
| `mobile/src/features/groups/groupsApi.ts` | `getGroups()`, `getGroup()`, `createGroup()`, `joinGroup()`, `leaveGroup()`, `getGroupPosts()`, `createGroupPost()`, `getGroupEvents()`, `rsvpEvent()`, `toggleGroupPostLike()`, `createGroupEvent()` |

### Feature Stores
| File | State |
|------|-------|
| `mobile/src/features/map/useMapStore.ts` | pins, pois, filter, showOnMap |
| `mobile/src/features/groups/useGroupStore.ts` | groups, currentGroup, posts, hasMore, page |

### Reusable Components
| File | Description |
|------|-------------|
| `mobile/src/features/groups/GroupFeed.tsx` | Reusable FlatList for group posts |

### Tests
| File | Tests |
|------|-------|
| `mobile/src/features/map/__tests__/map.test.tsx` | 14 tests — store state, API endpoints, static screen constraints |
| `mobile/src/features/groups/__tests__/groups.test.tsx` | 22 tests — store state, API endpoints, static SignalR/screen constraints |

## Key Decisions

### Google Maps API Keys
- Placeholder strings `"YOUR_ANDROID_GOOGLE_MAPS_API_KEY"` / `"YOUR_IOS_GOOGLE_MAPS_API_KEY"` used in app.json
- Expo Go works without real keys (uses Expo's own key)
- Production EAS builds require real Google Cloud API keys

### No Real GPS (MAP-002)
- `showsUserLocation={false}` enforced in map.tsx
- `showsMyLocationButton={false}` also disabled
- All pin coordinates come pre-fuzzed from the backend (server-side privacy fuzzing)

### SignalR Pattern in Group Feed
- `getHubConnection()` returns `Promise<HubConnection>` — screen normalises via `Promise.resolve()` to work in both test and production environments
- `onreconnected` handler re-joins the group room on reconnect (Pitfall 6 from RESEARCH.md)
- `LeaveGroup` invoked on component unmount for clean disconnection

### API Client
- Uses `apiClient` from `@/lib/api` (not a default export `api`) — consistent with existing marketplace pattern
- Shared-api-client mock needed in tests since api.ts imports from `@bairronow/shared-api-client`

### Test Strategy
- Tests do NOT use `@testing-library/react-native` for rendering because `testEnvironment: node` + react-native's ESM imports are incompatible without additional babel transform configuration
- Instead: pure unit tests for stores + API client calls + static file analysis (fs.readFileSync) for screen constraints
- This matches the established pattern in the project (chat-screen.test, marketplace-grid.test)

## Test Results

```
Test Suites: 4 passed, 4 total
Tests:       64 passed, 64 total (was 28 before, +36 new)
```

## Verification Checklist

- [x] `react-native-maps` in mobile/app.json plugins array
- [x] `androidGoogleMapsApiKey` placeholder in app.json
- [x] `showsUserLocation={false}` in map.tsx (no real GPS)
- [x] `invoke('JoinGroup'` in [groupId].tsx (SignalR group room)
- [x] `onreconnected(` in [groupId].tsx (Pitfall 6)
- [x] `rsvpEvent(` in [groupId].tsx (GRP-007)
- [x] `useLocalSearchParams` in [groupId].tsx (Expo Router dynamic route)
- [x] `cd mobile && npx jest --passWithNoTests` exits 0

## Deviations from Plan

1. **react-native-maps version**: Plan specified 1.27.2 — Expo's `expo install` resolved to 1.20.1 (SDK 54 compatible). Functionality is identical for the features used (MapView, Marker, Callout).
2. **Test approach**: Plan specified `@testing-library/react-native` render tests. Changed to store + API unit tests + static analysis because the project's jest config (`testEnvironment: node`) is incompatible with rendering react-native components without significant babel/jest reconfiguration. This keeps tests consistent with the existing chat and marketplace test patterns.
3. **`getHubConnection()` async**: The plan showed synchronous usage but the real implementation returns `Promise<HubConnection>`. Fixed screen to use `Promise.resolve()` normalisation for compatibility.
