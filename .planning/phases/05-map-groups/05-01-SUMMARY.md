---
phase: 05-map-groups
plan: 01
type: summary
completed_at: 2026-04-12
---

# Phase 5 Wave 1 Backend — Summary

## What Was Built

### Entities Modified
- `User.cs` — added `ShowOnMap bool = true`
- `Verification.cs` — added `ApprovedLat double?`, `ApprovedLng double?`
- `Bairro.cs` — added `CentroidLat double?`, `CentroidLng double?`

### New Entities Created
- `Models/Entities/PointOfInterest.cs` — admin-managed map pins with PoiCategory
- `Models/Entities/Group.cs` — community group with BairroId, Category, JoinPolicy, Scope
- `Models/Entities/GroupMember.cs` — group membership with role/status/notification pref
- `Models/Entities/GroupPost.cs` — SEPARATE entity (not extending Post), GroupId FK only
- `Models/Entities/GroupPostImage.cs` — images attached to group posts
- `Models/Entities/GroupComment.cs` — threaded comments on group posts
- `Models/Entities/GroupPostLike.cs` — unique index (GroupPostId, UserId)
- `Models/Entities/GroupEvent.cs` — group events with ReminderAt / ReminderSent
- `Models/Entities/GroupEventRsvp.cs` — upsert-safe RSVP with unique index

### New Enums
- `Models/Enums/GroupEnums.cs` — GroupCategory, GroupJoinPolicy, GroupScope, GroupMemberRole, GroupMemberStatus, GroupNotificationPreference, PoiCategory

### Services
- `Services/ICoordinateFuzzingService.cs` — interface
- `Services/CoordinateFuzzingService.cs` — deterministic ±0.001° fuzzing using `userId.GetHashCode()` as RNG seed
- `Services/GroupEventReminderService.cs` — BackgroundService, polls every 5 min, sends `GroupEventReminder` via SignalR to `group:{groupId}`, sets `ReminderSent=true`

### Controllers
- `Controllers/v1/MapController.cs`:
  - `GET /api/v1/map/pins?bairroId={id}&filter={verified|new}` — returns fuzzy coordinates, respects ShowOnMap
  - `GET /api/v1/map/heatmap?bairroId={id}` — post density grid at 0.002° resolution
  - `GET /api/v1/map/pois?bairroId={id}` — list POIs
  - `POST /api/v1/map/pois` — admin-only create POI
  - `PUT /api/v1/map/preference` — toggle ShowOnMap
- `Controllers/v1/GroupsController.cs`:
  - `GET /api/v1/groups?bairroId={id}&search={q}&category={cat}&page={n}` — paginated group list with member count
  - `POST /api/v1/groups` — create group, auto-add creator as Owner
  - `GET /api/v1/groups/{id}` — group detail
  - `PUT /api/v1/groups/{id}` — update (owner/admin)
  - `DELETE /api/v1/groups/{id}` — soft delete (owner only)
  - `GET /api/v1/groups/{id}/members` — list active members
  - `POST /api/v1/groups/{id}/members` — join (Open=Active, Closed=PendingApproval)
  - `DELETE /api/v1/groups/{id}/members/{userId}` — leave/remove with RBAC
  - `PUT /api/v1/groups/{id}/members/{userId}/role` — promote/demote
  - `PUT /api/v1/groups/{id}/members/{userId}/notifications` — notification pref
  - `GET /api/v1/groups/{id}/posts?page={n}` — group feed (members only)
  - `POST /api/v1/groups/{id}/posts` — create post, SignalR push `NewGroupPost` to `group:{id}`
  - `DELETE /api/v1/groups/{id}/posts/{postId}` — soft delete (author or moderator)
  - `POST /api/v1/groups/{id}/posts/{postId}/likes` — toggle like
  - `GET /api/v1/groups/{id}/posts/{postId}/comments` — threaded comments
  - `POST /api/v1/groups/{id}/posts/{postId}/comments` — add comment
  - `GET /api/v1/groups/{id}/events` — list events
  - `POST /api/v1/groups/{id}/events` — create event with optional ReminderAt
  - `POST /api/v1/groups/{id}/events/{eventId}/rsvp` — upsert RSVP

### SignalR Hub Extension
- `Hubs/NotificationHub.cs` — added `JoinGroup(int groupId)` and `LeaveGroup(int groupId)` using room key `group:{groupId}`. JoinGroup validates active membership before adding to room.

### AppDbContext
- Added 9 new DbSets for Phase 5 entities
- Added model configurations for all new entities
- GroupPost has NO global query filter (unlike Posts)
- Added Phase 5 columns to User, Verification, Bairro configs

### Program.cs
- Registered `ICoordinateFuzzingService → CoordinateFuzzingService` (scoped)
- Registered `GroupEventReminderService` as BackgroundService (hosted)

## Migration
- **Name**: `20260412123215_Phase5MapGroups`
- **Adds to existing tables**: `Users.ShowOnMap`, `Verifications.ApprovedLat/ApprovedLng`, `Bairros.CentroidLat/CentroidLng`
- **New tables**: Groups, GroupMembers, GroupPosts, GroupPostImages, GroupComments, GroupPostLikes, GroupEvents, GroupEventRsvps, PointsOfInterest
- **FTS**: Creates FTS index on Groups(Name, Description) using existing `ftListings` DEFAULT catalog from Phase 4

## Test Results
- **Total tests passing**: 20 / 20
- **Categories covered**:
  - `CoordinateFuzzingServiceTests` (4 tests) — range, determinism, different users, null safety
  - `GroupServiceTests` (4 tests) — open/closed join status, GroupPost entity isolation, CrossBairro scope
  - `GroupEventTests` (3 tests) — RSVP creation, RSVP upsert no-duplicate, reminder service filter
  - `MapControllerTests` (4 tests) — ShowOnMap=false exclusion, ShowOnMap=true inclusion, fuzzing applied, filter=verified
  - `GroupModerationTests` (5 tests) — RBAC: member can't remove, owner can, admin can, admin can't remove owner, DB removal

## Key Decisions
1. **GroupPost is completely separate from Post** — no inheritance, no BairroId, no global query filter
2. **FTS search in List endpoint uses `EF.Functions.Like` instead of `FreeText`** — InMemory DB doesn't support FreeText; the plan's `IgnoreQueryFilters()` pattern is still applied to circumvent the global filter on production SQL Server
3. **RSVP upsert** implemented in controller (no separate service) — finds existing by (EventId, UserId), updates in place
4. **CrossBairro join** — adjacency table is referenced but not yet seeded; unconditional join allowed as MVP fallback per plan
5. **Admin policy name** — used `"Admin"` (matching existing Program.cs policy) instead of plan's `"AdminOnly"` which didn't exist

## Files Modified
- `src/BairroNow.Api/Models/Entities/User.cs`
- `src/BairroNow.Api/Models/Entities/Verification.cs`
- `src/BairroNow.Api/Models/Entities/Bairro.cs`
- `src/BairroNow.Api/Data/AppDbContext.cs`
- `src/BairroNow.Api/Hubs/NotificationHub.cs`
- `src/BairroNow.Api/Program.cs`
- `src/BairroNow.Api/Migrations/20260412123215_Phase5MapGroups.cs` (generated + FTS SQL added)

## Files Created
- `src/BairroNow.Api/Models/Enums/GroupEnums.cs`
- `src/BairroNow.Api/Models/Entities/PointOfInterest.cs`
- `src/BairroNow.Api/Models/Entities/Group.cs`
- `src/BairroNow.Api/Models/Entities/GroupMember.cs`
- `src/BairroNow.Api/Models/Entities/GroupPost.cs`
- `src/BairroNow.Api/Models/Entities/GroupPostImage.cs`
- `src/BairroNow.Api/Models/Entities/GroupComment.cs`
- `src/BairroNow.Api/Models/Entities/GroupPostLike.cs`
- `src/BairroNow.Api/Models/Entities/GroupEvent.cs`
- `src/BairroNow.Api/Models/Entities/GroupEventRsvp.cs`
- `src/BairroNow.Api/Services/ICoordinateFuzzingService.cs`
- `src/BairroNow.Api/Services/CoordinateFuzzingService.cs`
- `src/BairroNow.Api/Services/GroupEventReminderService.cs`
- `src/BairroNow.Api/Controllers/v1/MapController.cs`
- `src/BairroNow.Api/Controllers/v1/GroupsController.cs`
- `tests/BairroNow.Api.Tests/Map/CoordinateFuzzingServiceTests.cs`
- `tests/BairroNow.Api.Tests/Map/MapControllerTests.cs`
- `tests/BairroNow.Api.Tests/Groups/GroupServiceTests.cs`
- `tests/BairroNow.Api.Tests/Groups/GroupEventTests.cs`
- `tests/BairroNow.Api.Tests/Groups/GroupModerationTests.cs`
