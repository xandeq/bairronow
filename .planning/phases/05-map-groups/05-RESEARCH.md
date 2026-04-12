# Phase 5: Map + Groups - Research

**Researched:** 2026-04-11
**Domain:** Interactive maps (web + mobile), community groups, SignalR group rooms, coordinate privacy, SQL Server FTS
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-001 | Interactive bairro map showing approximate neighbor locations (block-level, not exact address) | Leaflet + react-leaflet v5 with `ssr:false` dynamic import; fuzzing algorithm documented |
| MAP-002 | Geolocation from CEP (not real GPS). Random offset within block for privacy | BrasilAPI v2 returns `location.coordinates`; fuzzing: ±0.001° (~110m) server-side |
| MAP-003 | Pin click shows mini-profile — name, photo, verified badge, short bio, contact button | Leaflet Popup component pattern |
| MAP-004 | Location privacy toggle — user can opt out of map. Default: visible. No real-time tracking | `ShowOnMap` bool on User entity + MapController filtering |
| MAP-005 | Map filters — verified, unverified, businesses, new neighbors (last month) | Query param filters on MapController endpoint |
| MAP-006 | Activity heatmap overlay — most active areas of bairro. Toggle on/off | Leaflet.heat plugin; aggregate bairro post count by approximate cell |
| MAP-007 | Admin can add POIs — shops, schools, parks, health centers. Differentiated pins | New `PointOfInterest` entity; different Leaflet icon per category |
| MAP-008 | Marketplace pins on map. Click opens listing details | Re-use existing Listings endpoint, add lat/lng fuzzing to listing response |
| MAP-009 | Google Street View integration — opens in modal | Simple iframe embed with `https://maps.google.com/maps?q=&layer=c&cbll={lat},{lng}&cbp=...` — no API key needed for embed |
| MAP-010 | Bairro boundary polygon — subtle dashed line showing neighborhood limits | Leaflet Polygon component; boundary coords stored on Bairro entity |
| GRP-001 | Verified users create themed groups — sports, pets, parents, security, gardening | New `Group` entity with category enum |
| GRP-002 | Join/leave groups. Open groups (direct entry) or closed (admin approval) | `GroupMember` entity + `JoinPolicy` enum + pending-approval flow |
| GRP-003 | Group-exclusive feed — same features as main feed (text, image, comments, likes) | New `GroupPost` entity mirroring `Post`; reuse Comment/PostLike via discriminator or separate tables |
| GRP-004 | Bairro groups listing page — cards with name, description, member count, category | `GET /api/v1/groups?bairroId=` endpoint |
| GRP-005 | Group moderation — admin can remove members, delete posts, edit rules, assign co-admins. Action log | `GroupMemberRole` enum (Owner/Admin/Member); action logged to existing AuditLog |
| GRP-006 | Group notifications — per-group config: all, mentions only, none. Unread badge | `GroupNotificationPreference` per-member config; extend SignalR group rooms |
| GRP-007 | Group events — create events within group. RSVP. Auto-reminder | New `GroupEvent` + `GroupEventRsvp` entities; Hangfire or HostedService for reminders |
| GRP-008 | Cross-bairro groups — groups spanning adjacent neighborhoods | `Group.Scope` enum (Bairro/CrossBairro); membership checks include adjacent bairro IDs |
| GRP-009 | Group templates — pre-configured "Running Group", "Neighborhood Pets", etc. | Seed data: `GroupTemplate` static list; used at group creation, no separate entity needed |
</phase_requirements>

---

## Summary

Phase 5 adds two major independent features: an interactive neighbor map and community groups. Both depend on Phase 2 data (bairro + CEP-derived coordinates) but share no hard dependencies on Phase 4 marketplace.

The web map uses **react-leaflet v5** with `dynamic(() => import(...), { ssr: false })` — this is the only viable pattern for Next.js 15 `output: 'export'` since Leaflet requires `window`. OSM tiles work without an API key. Privacy-safe coordinates are generated server-side by applying a deterministic-per-user random offset of ±0.001° (~110m) to the CEP centroid — enough to hide exact addresses while keeping pins inside the correct bairro.

Groups use a **separate `GroupPost` entity** (not extending `Post`) to avoid muddying the bairro feed query filter. SignalR group rooms follow the exact same `Groups.AddToGroupAsync` pattern already used for bairro-scoped feed and conversation groups. Group events are simple: `GroupEvent` + `GroupEventRsvp` tables; auto-reminder via a .NET `IHostedService` (no Redis, no Hangfire dependency).

**Primary recommendation:** Implement backend entities + APIs first (05-01), then web frontend (05-02), then mobile (05-03). The map and groups can be developed in parallel on the backend since they share no entities.

---

## Standard Stack

### Core — Web Map
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| leaflet | 1.9.4 | Core map engine | Industry standard, no API key, OSM tiles |
| react-leaflet | 5.0.0 | React bindings for Leaflet | Official React wrapper; v5 supports React 19 |
| react-leaflet-cluster | 4.1.3 | Client-side marker clustering | Wraps Leaflet.markercluster; supports react-leaflet 5.x |
| @types/leaflet | latest | TypeScript types | Required for TS usage |

### Core — Mobile Map
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-maps | 1.27.2 | Native map component | Works in Expo managed workflow via config plugin; no eject needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| leaflet.heat | 0.2.0 | Heatmap overlay | MAP-006 activity heatmap |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet | MapLibre GL JS | MapLibre is more powerful (vector tiles, better 3D) but heavier and requires map style JSON; overkill for bairro pins |
| react-native-maps | expo-maps | expo-maps is newer (SwiftUI/Jetpack Compose) but doesn't yet support React components as custom markers — needed for branded pins |
| react-leaflet-cluster | supercluster hook | supercluster gives more control but requires more manual wiring; react-leaflet-cluster works out of the box |

**Installation:**
```bash
# Frontend (web)
pnpm --filter frontend add leaflet react-leaflet react-leaflet-cluster leaflet.heat
pnpm --filter frontend add -D @types/leaflet

# Mobile
npx expo install react-native-maps
```

**Version verification (confirmed 2026-04-11):**
```
leaflet          1.9.4
react-leaflet    5.0.0
react-leaflet-cluster 4.1.3
react-native-maps 1.27.2
```

---

## Architecture Patterns

### Recommended Project Structure (new files only)
```
src/BairroNow.Api/
├── Controllers/v1/
│   ├── MapController.cs          # GET /map/pins, /map/pois
│   └── GroupsController.cs       # CRUD groups, members, posts, events
├── Models/Entities/
│   ├── UserMapPreference.cs      # ShowOnMap bool (or inline on User)
│   ├── PointOfInterest.cs        # MAP-007
│   ├── BairroPolygon.cs          # MAP-010 (optional seed)
│   ├── Group.cs
│   ├── GroupMember.cs
│   ├── GroupPost.cs              # Separate from Post
│   ├── GroupPostImage.cs
│   ├── GroupComment.cs
│   ├── GroupPostLike.cs
│   ├── GroupEvent.cs
│   └── GroupEventRsvp.cs
frontend/src/app/(main)/
├── map/
│   ├── page.tsx                  # dynamic import wrapper (server component)
│   └── MapClient.tsx             # "use client" — react-leaflet
└── groups/
    ├── page.tsx                  # groups listing
    ├── [groupId]/
    │   ├── page.tsx              # group feed
    │   └── events/page.tsx       # group events
    └── new/page.tsx              # create group
mobile/app/(tabs)/
├── map.tsx
└── groups/
    ├── index.tsx
    └── [groupId].tsx
```

### Pattern 1: react-leaflet in Next.js 15 Static Export

**What:** All Leaflet code lives in a `"use client"` component. The page imports it with `next/dynamic` + `ssr: false`.
**When to use:** Required — Leaflet accesses `window` at import time and cannot run during `next build` static export.

```typescript
// Source: https://xxlsteve.net/blog/react-leaflet-on-next-15/
// frontend/src/app/(main)/map/page.tsx  (NO "use client" — stays server component)
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), {
  loading: () => <div className="h-[70vh] bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false,
});

export default function MapPage() {
  return <MapClient />;
}
```

```typescript
// frontend/src/app/(main)/map/MapClient.tsx
"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, MarkerClusterGroup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

// Fix default Leaflet icon path broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});
```

**Pitfall:** Leaflet's default marker PNG paths break with webpack. Copy leaflet's marker icons to `public/leaflet/` during build or use a CDN.

### Pattern 2: Server-Side Coordinate Fuzzing

**What:** Apply a per-user deterministic random offset to the CEP centroid before serving map pins. Never return exact coordinates.
**When to use:** All user pins (MAP-001, MAP-002). Listings on map (MAP-008).

```csharp
// Source: standard geospatial privacy pattern — ~±110m at Brazilian latitudes
// Services/CoordinateFuzzingService.cs
public static (double Lat, double Lng) FuzzCoordinates(double lat, double lng, Guid userId)
{
    // Deterministic per user: same user always gets same offset
    // so their pin doesn't jump on page refresh
    var seed = userId.GetHashCode();
    var rng = new Random(seed);
    // ±0.001° ≈ ±110m — enough to obscure address, keeps pin in bairro
    var latOffset = (rng.NextDouble() * 0.002) - 0.001;
    var lngOffset = (rng.NextDouble() * 0.002) - 0.001;
    return (lat + latOffset, lng + lngOffset);
}
```

**Why ±0.001°:** At ~20°S (Brazil), 1° latitude ≈ 111km, so 0.001° ≈ 111m. This hides the exact address while keeping the pin clearly within the correct city block and bairro.

### Pattern 3: SignalR Group Rooms for Group Feed

**What:** Extend the existing `NotificationHub` with group join/leave methods. Use `Groups.AddToGroupAsync` with a `group:{groupId}` key.
**When to use:** GRP-003 (real-time group post notifications), GRP-006 (group notifications).

```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/signalr/groups
// Extend existing NotificationHub.cs
public async Task JoinGroup(int groupId)
{
    var userId = GetUserId();
    if (userId == null) throw new HubException("Unauthorized");

    // Verify membership
    var isMember = await _db.GroupMembers
        .AsNoTracking()
        .AnyAsync(m => m.GroupId == groupId && m.UserId == userId.Value
                    && m.Status == GroupMemberStatus.Active);
    if (!isMember) throw new HubException("Not a group member");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"group:{groupId}");
}

public async Task LeaveGroup(int groupId)
{
    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"group:{groupId}");
}
```

### Pattern 4: GroupPost Entity (Separate from Post)

**What:** `GroupPost` mirrors `Post` but with a `GroupId` foreign key instead of `BairroId`. Reuses the existing `Report` table via `TargetType = "GroupPost"`.
**When to use:** GRP-003 group feed.

```csharp
public class GroupPost
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    public PostCategory Category { get; set; }   // reuse existing enum
    public string Body { get; set; } = string.Empty;
    public bool IsFlagged { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime? EditedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<GroupPostImage> Images { get; set; } = new List<GroupPostImage>();
    public ICollection<GroupComment> Comments { get; set; } = new List<GroupComment>();
    public ICollection<GroupPostLike> Likes { get; set; } = new List<GroupPostLike>();
}
```

**Why not extend Post:** The bairro-scoped `Post` entity has a global query filter `p => p.DeletedAt == null` and a `BairroId` FK. Adding an optional `GroupId` with nullable `BairroId` would complicate every existing feed query. Separate entity is cleaner.

### Pattern 5: SQL Server FTS for Group Search (EF Core 8 pattern)

**What:** Since the project uses EF Core 8 (not 11), full-text catalog/index must be added via raw SQL in migration. Use `EF.Functions.FreeText()` for group name/description search.

```csharp
// Source: https://learn.microsoft.com/en-us/ef/core/providers/sql-server/full-text-search
// In migration Up():
migrationBuilder.Sql(
    "CREATE FULLTEXT CATALOG ftGroupsCatalog AS DEFAULT;",
    suppressTransaction: true);
migrationBuilder.Sql(
    "CREATE FULLTEXT INDEX ON Groups(Name, Description) KEY INDEX PK_Groups;",
    suppressTransaction: true);

// In GroupsController:
var groups = await _db.Groups
    .Where(g => g.BairroId == bairroId
             && EF.Functions.FreeText(g.Name, query)
                || EF.Functions.FreeText(g.Description, query))
    .ToListAsync();
```

**Note:** Phase 4 already created a fulltext catalog (`ftCatalog`) for listings. Check if that catalog is still the default before creating a new one; alternatively add Groups columns to the existing catalog.

### Pattern 6: Group Event Auto-Reminder via IHostedService

**What:** A `BackgroundService` polls `GroupEvents` with `ReminderAt <= DateTime.UtcNow && !ReminderSent` and enqueues notifications. No Hangfire, no Redis.
**When to use:** GRP-007 auto-reminder.

```csharp
// Services/GroupEventReminderService.cs
public class GroupEventReminderService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await SendPendingReminders();
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
```

Register in `Program.cs`: `builder.Services.AddHostedService<GroupEventReminderService>();`

### Anti-Patterns to Avoid

- **Sharing a single `Post` entity for both bairro feed and group feed:** Nullable FKs create ambiguous query filter semantics and break the existing bairro feed. Use `GroupPost` separately.
- **Storing exact CEP centroid coordinates in user map response:** Always fuzz before sending. The fuzzed coordinates should be computed on the API server, never on the client.
- **Importing react-leaflet at the top level of a Next.js page:** Will break `next build` with "window is not defined". Always use `dynamic(..., { ssr: false })`.
- **Creating a second SignalR Hub for groups:** The existing `NotificationHub` already handles bairro groups and conversation rooms. Add group room methods there.
- **Using GPS/browser geolocation for map:** Requirements specify CEP-derived coordinates only (MAP-002). Real GPS tracking is explicitly out of scope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker clustering | Custom cluster logic | react-leaflet-cluster | Handles hundreds of overlapping pins, animated cluster expansion, custom cluster icon |
| Map tile serving | Self-hosted tile server | OSM tiles `tile.openstreetmap.org` | Free, no auth, global CDN — just add attribution |
| Full-text group search | LIKE `%query%` | SQL Server FTS via `EF.Functions.FreeText()` | Pattern already in Phase 4 for listings; LIKE doesn't handle stemming/inflection |
| Background job scheduler | Cron from scratch | `BackgroundService` (built-in .NET) | SmarterASP doesn't allow Hangfire's persistent job store without Redis; IHostedService works on shared hosting |
| Map on mobile | Custom WebView map | react-native-maps | Native Maps SDK; no WebView jank on Android/iOS |

**Key insight:** The existing SignalR hub, FTS migration pattern, and image upload pipeline from Phases 3-4 are all reusable in Phase 5. Don't reinvent them.

---

## Common Pitfalls

### Pitfall 1: Leaflet Default Icons 404 in Static Export
**What goes wrong:** After `next build`, the default Leaflet marker PNG URLs (set by webpack) resolve to `/_next/static/...` paths that don't exist in the static export.
**Why it happens:** Leaflet sets icon paths via `require()` which webpack resolves at build time. The resulting chunk URL doesn't match the static output path.
**How to avoid:** Copy `node_modules/leaflet/dist/images/` to `public/leaflet/` and call `L.Icon.Default.mergeOptions({ iconUrl: '/leaflet/marker-icon.png', ... })` before rendering any markers.
**Warning signs:** Map renders but all marker images show as broken 404 in browser console.

### Pitfall 2: `window is not defined` During `next build`
**What goes wrong:** Build fails if any import chain leads to `import 'leaflet'` being evaluated during SSR/static render.
**Why it happens:** Next.js 15 static export still runs component code in Node during `next build`. Leaflet touches `window.L` at module scope.
**How to avoid:** The `dynamic(() => import('./MapClient'), { ssr: false })` pattern is mandatory. The `"use client"` directive alone is not enough — the component must also be dynamically imported.
**Warning signs:** `ReferenceError: window is not defined` in `next build` output.

### Pitfall 3: FTS Global Query Filter Conflict (EF Core 8 Known Issue)
**What goes wrong:** `EF.Functions.FreeText()` or `Contains()` combined with global query filters on the same entity silently returns 0 results or throws.
**Why it happens:** EF Core 8 has a known bug ([#33799](https://github.com/dotnet/efcore/issues/33799)) where global query filters interfere with FTS predicates.
**How to avoid:** Use `.IgnoreQueryFilters()` before the FTS `.Where()` clause, then manually re-apply the soft-delete filter: `.Where(g => !g.DeletedAt.HasValue && EF.Functions.FreeText(...))`.
**Warning signs:** FTS query returns empty even though matching rows exist in the database.

### Pitfall 4: BrasilAPI v2 Coordinates May Be Null
**What goes wrong:** `location.coordinates` in BrasilAPI v2 response is an empty object `{}` for many CEPs (as confirmed by live test on 29018210).
**Why it happens:** BrasilAPI v2 uses OpenStreetMap geocoding which has incomplete coverage for Brazilian CEPs, especially in newer subdivisions.
**How to avoid:** Always check for null/empty coordinates. Fallback strategy: (1) use bairro centroid stored in the `Bairro` entity, (2) use city centroid as last resort. Store the resolved lat/lng on `Verification` or a new `UserLocation` table at verification-approval time (admin action), not at map-render time.
**Warning signs:** Pins cluster at (0,0) or bairro map is empty.

### Pitfall 5: react-native-maps Requires Google API Key for Production Builds
**What goes wrong:** Map works in Expo Go (which has its own Google API key baked in) but fails in production builds with "This page can't load Google Maps correctly."
**Why it happens:** Production APK/IPA requires your own Google Maps API key in `app.json` config plugin.
**How to avoid:** Register a Google Cloud project, enable Maps SDK for Android + iOS, restrict the key to the app bundle ID + SHA-1. Add to `app.json`:
```json
{
  "expo": {
    "plugins": [["react-native-maps", {
      "androidGoogleMapsApiKey": "...",
      "iosGoogleMapsApiKey": "..."
    }]]
  }
}
```
**Warning signs:** White screen or "For development purposes only" watermark in production build.

### Pitfall 6: SignalR Group Membership Not Persisted Across Reconnects
**What goes wrong:** After a connection drop/reconnect, the user is no longer in the `group:{groupId}` SignalR group.
**Why it happens:** SignalR groups are per-connection, not per-user. Reconnection creates a new connection ID.
**How to avoid:** Client-side: call `JoinGroup(groupId)` immediately after SignalR reconnects (in the `onreconnected` callback). This is the same pattern already used for `JoinBairro` and `JoinConversation` in Phase 3/4.
**Warning signs:** Group feed updates stop arriving after mobile app backgrounds and returns.

---

## Code Examples

### Map Pin Endpoint (backend)

```csharp
// Source: architecture pattern based on existing ProfileController + CoordinateFuzzingService
// GET /api/v1/map/pins?bairroId={id}&filter=verified
[HttpGet("pins")]
public async Task<IActionResult> GetPins([FromQuery] int bairroId, [FromQuery] string? filter)
{
    var query = _db.Users
        .AsNoTracking()
        .Where(u => u.BairroId == bairroId
                 && u.ShowOnMap                    // privacy toggle (MAP-004)
                 && u.EmailConfirmed);

    if (filter == "verified")
        query = query.Where(u => u.IsVerified);
    else if (filter == "new")
        query = query.Where(u => u.CreatedAt >= DateTime.UtcNow.AddMonths(-1));

    // Get lat/lng from Verification (stored at approval time)
    var pins = await query
        .Join(_db.Verifications.Where(v => v.Status == "approved"),
              u => u.Id, v => v.UserId,
              (u, v) => new { u, v })
        .Select(x => new MapPinDto
        {
            UserId = x.u.Id,
            DisplayName = x.u.DisplayName,
            PhotoUrl = x.u.PhotoUrl,
            IsVerified = x.u.IsVerified,
            Bio = x.u.Bio,
            // Fuzz applied server-side before sending
            Lat = 0, Lng = 0   // populated after Select in service layer
        })
        .ToListAsync();

    foreach (var pin in pins)
    {
        var (lat, lng) = _fuzzService.Fuzz(rawLat, rawLng, pin.UserId);
        pin.Lat = lat;
        pin.Lng = lng;
    }
    return Ok(pins);
}
```

### Group Member Role Enum

```csharp
// Source: standard RBAC pattern for groups
public enum GroupMemberRole { Owner, Admin, Member }
public enum GroupMemberStatus { Active, PendingApproval, Banned }
public enum GroupJoinPolicy { Open, Closed }

public class GroupMember
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public Group? Group { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
    public GroupMemberStatus Status { get; set; } = GroupMemberStatus.Active;
    public GroupNotificationPreference NotificationPreference { get; set; }
        = GroupNotificationPreference.All;
    public DateTime JoinedAt { get; set; }
}
```

### RSVP Entity (simple boolean, not capacity-tracked)

```csharp
// MAP-007 spec says "RSVP" only — no capacity requirement in requirements
public class GroupEventRsvp
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public GroupEvent? Event { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public bool IsAttending { get; set; }   // true = going, false = not going
    public DateTime RespondedAt { get; set; }
}
```

### Coordinate Storage Decision

BrasilAPI v2 live-tested CEP 29018210 (Vitória, ES) returned `location.coordinates: {}` (empty). The project **cannot rely on BrasilAPI for lat/lng at map-pin-render time**. The correct approach is:

1. At verification approval time (admin action in `AdminVerificationController`), geocode the CEP using BrasilAPI v2.
2. If `location.coordinates` is null/empty, fall back to bairro centroid.
3. Store `ApprovedLat` + `ApprovedLng` on the `Verification` entity (add two nullable `double` columns in migration).
4. MapController reads these stored coordinates — no live geocoding at request time.

```csharp
// Migration: add to Verification entity
public double? ApprovedLat { get; set; }
public double? ApprovedLng { get; set; }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Google Maps API (paid) | OSM tiles + Leaflet | ~2020 | Free, no quota, attribution required |
| MapLibre GL requires vector tile server | OSM raster tiles work fine for bairro scope | — | No tile server needed |
| react-leaflet v3/v4 needed workarounds | react-leaflet v5 supports React 19, cleaner hooks API | 2024 | Compatible with Next.js 15 |
| expo-maps as alternative | react-native-maps remains recommended for managed workflow | 2025 | Custom markers not yet supported in expo-maps |
| EF Core 11+ HasFullTextIndex() | Older versions use raw SQL in migration | EF Core 11 | Project is on EF Core 8; must use raw SQL pattern |

**Deprecated/outdated:**
- `react-leaflet-markercluster` (yuzhva/react-leaflet-markercluster): Not maintained for react-leaflet v4+. Use `react-leaflet-cluster` (akursat) instead.
- `leaflet-defaulticon-compatibility` npm package: Manual `mergeOptions` pattern is simpler and doesn't require the extra package.

---

## Open Questions

1. **BrasilAPI coordinates coverage for Vila Velha CEPs**
   - What we know: Live test on 29018210 (Vitória) returned empty coordinates. Vila Velha CEPs likely same issue.
   - What's unclear: Percentage of Vila Velha CEPs that do have coordinates vs. those that don't.
   - Recommendation: Implement bairro centroid fallback; seed `Bairro` table with lat/lng centroids for the pilot bairros (Vila Velha neighborhood centroids are available from IBGE census data or OSM Nominatim).

2. **Google Maps API key requirement for production mobile map**
   - What we know: Expo Go works without a key (uses Expo's key); production builds require a separate key.
   - What's unclear: Whether the team has/wants a Google Cloud project for API keys.
   - Recommendation: Register a free Google Cloud project (free tier includes 28k map loads/month — more than enough for MVP). Add keys via Expo config plugin.

3. **FTS catalog collision with Phase 4**
   - What we know: Phase 4 (04-01) created `ftCatalog` for Listings FTS.
   - What's unclear: Whether 04-01 created the catalog as DEFAULT. If it is the default, `Groups` can use it without a second catalog.
   - Recommendation: Check the Phase 4 migration SQL before creating a second catalog. If `ftCatalog` is DEFAULT, add the Groups FTS index to the existing catalog.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | xUnit 2.x + Moq + FluentAssertions |
| Config file | `tests/BairroNow.Api.Tests/BairroNow.Api.Tests.csproj` |
| Quick run command | `dotnet test tests/BairroNow.Api.Tests/ --filter Category=Unit` |
| Full suite command | `dotnet test tests/BairroNow.Api.Tests/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-002 | Coordinate fuzzing returns offset within ±0.001° | unit | `dotnet test --filter "FullyQualifiedName~CoordinateFuzzingServiceTests"` | Wave 0 |
| MAP-004 | ShowOnMap=false excludes user from pin response | unit | `dotnet test --filter "FullyQualifiedName~MapControllerTests"` | Wave 0 |
| GRP-001 | Group creation with valid/invalid category | unit | `dotnet test --filter "FullyQualifiedName~GroupServiceTests"` | Wave 0 |
| GRP-002 | Join open group succeeds; join closed group creates pending | unit | `dotnet test --filter "FullyQualifiedName~GroupServiceTests"` | Wave 0 |
| GRP-005 | Non-admin cannot remove member; admin can | unit | `dotnet test --filter "FullyQualifiedName~GroupModerationTests"` | Wave 0 |
| GRP-007 | RSVP toggle creates/updates record | unit | `dotnet test --filter "FullyQualifiedName~GroupEventTests"` | Wave 0 |
| GRP-008 | Cross-bairro group accepts member from adjacent bairro | unit | `dotnet test --filter "FullyQualifiedName~GroupServiceTests"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `dotnet test tests/BairroNow.Api.Tests/ --filter Category=Unit`
- **Per wave merge:** `dotnet test tests/BairroNow.Api.Tests/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/BairroNow.Api.Tests/Map/CoordinateFuzzingServiceTests.cs` — covers MAP-002, MAP-004
- [ ] `tests/BairroNow.Api.Tests/Groups/GroupServiceTests.cs` — covers GRP-001, GRP-002, GRP-008
- [ ] `tests/BairroNow.Api.Tests/Groups/GroupModerationTests.cs` — covers GRP-005
- [ ] `tests/BairroNow.Api.Tests/Groups/GroupEventTests.cs` — covers GRP-007

Framework installed: xUnit already configured in `BairroNow.Api.Tests.csproj` (Phases 1-4).

---

## Sources

### Primary (HIGH confidence)
- Official Leaflet docs + react-leaflet GitHub — map library capabilities and React integration
- [xxlsteve.net — React Leaflet on Next.js 15 App Router](https://xxlsteve.net/blog/react-leaflet-on-next-15/) — verified dynamic import + ssr:false pattern for Next.js 15
- [Expo react-native-maps docs](https://docs.expo.dev/versions/latest/sdk/map-view/) — managed workflow setup, config plugin API keys
- [Microsoft Learn — EF Core SQL Server Full-Text Search](https://learn.microsoft.com/en-us/ef/core/providers/sql-server/full-text-search) — FTS migration pattern for EF Core 8, EF.Functions.FreeText/Contains usage
- [Microsoft Learn — SignalR Groups](https://learn.microsoft.com/en-us/aspnet/core/signalr/groups?view=aspnetcore-8.0) — AddToGroupAsync / RemoveFromGroupAsync pattern
- npm view commands run 2026-04-11 — confirmed package versions

### Secondary (MEDIUM confidence)
- [react-leaflet-cluster GitBook](https://akursat.gitbook.io/marker-cluster) — MarkerClusterGroup usage, confirmed react-leaflet 5.x compatibility
- [BrasilAPI live API test](https://brasilapi.com.br/api/cep/v2/29018210) — confirmed coordinates can be empty; fallback strategy validated
- [privacypatterns.org — Location Granularity](https://privacypatterns.org/patterns/Location-granularity) — block-level fuzzing approach rationale

### Tertiary (LOW confidence)
- [Expo blog — Introducing expo-maps](https://expo.dev/blog/introducing-expo-maps-a-modern-maps-api-for-expo-developers) — expo-maps limitations on custom marker components not independently verified in code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via npm view, library compatibility verified
- Architecture: HIGH — patterns derived from existing project codebase (Phases 1-4) + official docs
- Pitfalls: HIGH — Leaflet/Next.js SSR pitfall verified by multiple sources + live BrasilAPI coordinate test

**Research date:** 2026-04-11
**Valid until:** 2026-07-11 (stable libraries; react-leaflet major versions move slowly)
