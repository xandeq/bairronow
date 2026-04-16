# Phase 4: Marketplace + Chat - Research

**Researched:** 2026-04-07
**Domain:** Bairro-scoped classifieds marketplace + 1:1 realtime chat on .NET 8 + Next.js 15 + Expo, constrained to SmarterASP shared hosting (no Redis, no Docker, single instance)
**Confidence:** HIGH for stack reuse, HIGH for storage/search/chat patterns, MEDIUM for mobile SignalR edge cases

## Summary

Phase 4 is an integration phase, not a greenfield one. Every major subsystem already has a precedent in phases 1-3: SignalR hub, ImageSharp upload pipeline, Serilog audit log, IMemoryCache, JWT + bairro scoping middleware, react-hook-form + zod forms, Zustand stores, Expo image picker, shared moderation queue. The research task is to lock the extension pattern for each, not to introduce new libraries.

Three decisions drive everything:
1. **Photo storage = local file system under a wwwroot-served path**, not DB blobs and not external CDN. SmarterASP supports it, ImageSharp already writes there for verification proofs, and Cloudflare in front of the API gives us a free CDN. DB blobs would bloat SQL Server Express quotas; external free tiers (R2, Imgur, Backblaze) add operational complexity and a second failure mode for a 1-week MVP.
2. **Full-text search = SQL Server full-text catalog** (not LIKE, not external index). SmarterASP's shared MSSQL plans explicitly include Full Text Search rights, and FEED-007 already depends on it in Phase 3. Reuse the same pattern.
3. **Chat persistence + unread counts = EF Core Messages table + per-participant `LastReadAt` columns on a `Conversation` join table**. No Redis needed; unread is a single indexed COUNT query per conversation. Live delivery via the existing SignalR hub, history via REST `GET /chat/conversations/{id}/messages?before={cursor}`.

**Primary recommendation:** Treat Phase 4 as "extend, don't add." Every new library or pattern must answer "why can't we reuse phase 1-3?" before being allowed in.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Listing creation**
- D-01: Photos — min 1 required, max 6; drag-drop reorderable; first photo = cover automatically
- D-02: Price — numeric required (no "a combinar"); forces clarity and filterability
- D-03: Category picker — 2-step flow (category → subcategory) using chip grid UI, not dropdowns
- D-04: No drafts/preview — publish directly; edits after publish are unrestricted

**Marketplace grid & discovery**
- D-05: 2-column card grid on web and mobile; card shows thumbnail, title (1-2 lines), price, verified badge
- D-06: Default sort: most recent
- D-07: Visibility scoped to own bairro only (Vila Velha pilot = 1 bairro)
- D-08: Filter UI: top chips (category, verified, price range). No drawer/modal until filters exceed 5.

**Search & filters**
- D-09: Full-text search over title + description; description capped at 500 chars in form
- D-10: "Verified seller" filter defaults ON; unverified listings still visible with "⚠️ Vendedor não verificado" warning
- D-11: No distance filter in Phase 4 (no map yet — bairro is proxy)

**Chat (1:1)**
- D-12: Reuse existing SignalR hub from Phase 1; add `ChatMessageHub` handler within same hub (shared auth/connection)
- D-13: Message history persisted forever; soft-delete only on user request; no automatic cleanup
- D-14: Chat images reuse ImageSharp pipeline from listings (jpg/png, 5MB, 1920x1080 max)
- D-15: Entry points — bottom-nav chat/envelope tab AND "Chat com vendedor" button on listing detail
- D-16: 1:1 only; no group chat; no block user in this phase

**Listing lifecycle**
- D-17: Mark sold → "Vendido" badge for 7 days → soft-delete from grid; remains in seller profile "Vendidos" history
- D-18: Edit after publish unrestricted (price, description, photos); all mutations logged to audit trail for anti-scam
- D-19: No auto-expire stale listings in this phase

**Trust & safety**
- D-20: Report reasons fixed list: "Prohibited item", "Scam/fraud suspicion", "Abusive pricing", "Misleading description"
- D-21: Moderation queue SHARED with Phase 3 post reports; item type (post vs listing) surfaced in admin dashboard via `ReportTargetType` discriminator
- D-22: Ratings — 1-way only: buyer rates seller after seller marks "sold"; seller receives "rate this transaction" notification
- D-23: Buyer can edit rating within 7 days; admin can delete flagged/spam ratings; no mutual ratings

**Taxonomy**
- D-24: Seed 10 categories pt-BR hardcoded in `Constants/Categories.cs` (Eletrônicos, Móveis, Roupas, Veículos, Casa, Esportes, Infantil, Livros, Serviços, Outros)
- D-25: Subcategories flat list per category (2-3 each), no deep trees
- D-26: Admin can ON/OFF categories via toggles, cannot create/delete (Phase 5)

### Claude's Discretion
- Exact card spacing, typography, image lazy-loading strategy
- Audit log schema for listing edits
- Chat unread-count indicator style
- SignalR reconnection UX
- Image compression thresholds within ImageSharp limits
- Rating notification copy and timing

### Deferred Ideas (OUT OF SCOPE)
- MKT-012 Paid spotlight → Phase 6
- MKT-013 Service scheduling → backlog
- Block user → Phase 6
- Group chat → Phase 6
- Cross-bairro visibility → Phase 5+
- Auto-expire stale listings → Phase 5
- Save-search / recent searches → Phase 5
- Admin CRUD on taxonomy → Phase 5
- Mutual buyer↔seller ratings → post-pilot
- Price-change notification for favorites (MKT-009) → confirm during planning

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MKT-001 | Verified user creates listing (title, description, price, category, up to 6 photos) | Listing entity + ImageSharp reuse from Phase 2; price REQUIRED per D-02 (deviation from requirement text) |
| MKT-002 | Bairro grid with thumbnail/title/price, filter by category + price, sort by recency/price | Bairro scoping middleware from Phase 2 + SQL Server indexed queries; 2-col card grid per D-05 |
| MKT-003 | Listing detail: gallery, description, price, seller profile with badge, location, date | VerifiedBadge reuse + existing profile endpoints from Phase 2 |
| MKT-004 | Private 1:1 chat (text + image), linked to listing, new message notifications | Extend existing SignalR hub with chat handler; EF Core Messages table for persistence; reuse Phase 3 notification system |
| MKT-005 | Mark as sold, "Sold" badge 7 days, then soft-delete from grid | Scheduled query filter + `SoldAt` column; seller profile keeps history per D-17 |
| MKT-006 | Edit/remove listing anytime; soft delete with confirmation | Audit log via Serilog SQL sink from Phase 1; per D-18 |
| MKT-007 | Full-text search on listings with filters (category, price, verified seller) | SQL Server full-text catalog (confirmed available on SmarterASP); same pattern as FEED-007 |
| MKT-008 | Report listing with reasons, separate moderation queue | Extend Phase 3 moderation queue with `ReportTargetType` discriminator per D-21 |
| MKT-009 | Favorite listings with counter visible to seller | `ListingFavorites` join table + count query; price-change notification deferred to planning |
| MKT-010 | Seller ratings 1-5 stars + comment, average on profile | `SellerRating` entity, 1-way buyer→seller, 7-day edit window per D-22/D-23 |
| MKT-011 | Category/subcategory taxonomy, browse + filter navigation | Hardcoded `Constants/Categories.cs` per D-24/D-25; chip grid UI per D-03 |
| MKT-012 | **DEFERRED** to Phase 6 | Out of scope |
| MKT-013 | **DEFERRED** to backlog | Out of scope |

</phase_requirements>

## Standard Stack

### Core (all already installed from Phase 1-3 — no new deps for backend core)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| EF Core | 8.0.x | ORM for Listing/Message/Conversation/Favorite/Rating entities | Already in use; reuse migration pattern |
| FluentValidation | 12.1.x | ListingCreate/Edit DTO validation | Already in use |
| SixLabors.ImageSharp | 3.1.x | Listing photo + chat image processing | **REUSE Phase 2 pipeline — do not re-introduce** |
| Microsoft.AspNetCore.SignalR | 8.0.x (built-in) | Chat transport | **REUSE existing hub — add methods, do not create parallel hub** |
| Serilog + SqlServer sink | 4.x / 6.x | Listing edit audit log | Already in use (Phase 1) |
| Microsoft.Extensions.Caching.Memory | 8.0.x (built-in) | Cache category list, first-page grid | Already in use |
| MediatR | 12.x | CQRS for Listing/Chat commands + queries | Already in use in Phase 3 |

### Supporting (may need adds)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@microsoft/signalr` | 8.0.7 | Chat client (web + mobile) | Already in Next.js from Phase 3 for notifications; add to Expo in this phase |
| `react-intersection-observer` | 9.x | Grid infinite scroll trigger | If Phase 3 feed used a custom hook, reuse that instead |
| `browser-image-compression` | 2.0.2 | Pre-upload client compression | Already in Next.js from Phase 3 |
| `expo-image-picker` | 16.x | Mobile photo selection | Already in Expo (02-03) |
| `expo-image-manipulator` | 13.x | Mobile client-side resize before upload | Already in Expo (02-03) |
| `@tanstack/react-virtual` (optional) | 3.x | Virtualize long chat history lists | Only if a conversation exceeds ~200 messages and lag is measured |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| File system storage | Cloudflare R2 / Backblaze B2 / Imgur | Adds second failure mode and credentials for a 1-week MVP; file system works and Cloudflare already proxies the API for CDN |
| File system storage | SQL Server VARBINARY(MAX) | Bloats SmarterASP DB quota fast (6 photos × up to 500KB × N listings); backup cost; cannot be served by static file middleware |
| SQL Server full-text search | `LIKE '%term%'` | Full table scan, no word-stemming, blocks with description grows. SmarterASP explicitly supports FTS on shared plans |
| SQL Server full-text search | External index (Meilisearch, ElasticSearch, Algolia) | No hosting; free tiers add auth + sync complexity; FTS is already good enough at pilot scale |
| SignalR chat | Polling REST every 5s | Burns rate limit; breaks the "realtime" feel; hub already exists |
| SignalR with Redis backplane | Azure SignalR / Redis backplane | Single SmarterASP instance — backplane would be unused infra. Document the limit, revisit if we ever scale-out. |
| `@microsoft/signalr` on Expo | `@aspnet/signalr` (old) or `olofd/react-native-signalr` | `@microsoft/signalr` is the supported client; older libs are abandoned |
| Custom unread counter in cache | Redis counters | No Redis. Indexed COUNT query on Messages per Conversation is O(log n) and correct across restarts |

**Installation (frontend additions only — backend is all built-in):**
```bash
# Next.js (most already present)
# Expo mobile
cd mobile && npm install @microsoft/signalr@8.0.7
```

**Version verification (required before writing Tasks):**
```bash
npm view @microsoft/signalr version
dotnet list package --outdated   # from API project
```

## Architecture Patterns

### Recommended Backend Structure

```
api/
├── Features/
│   ├── Marketplace/
│   │   ├── Listings/
│   │   │   ├── Commands/              # CreateListing, UpdateListing, MarkSold, DeleteListing
│   │   │   ├── Queries/               # GetBairroGrid, SearchListings, GetListingDetail
│   │   │   ├── Validators/            # FluentValidation per command
│   │   │   ├── ListingEntity.cs
│   │   │   ├── ListingPhoto.cs
│   │   │   └── ListingsController.cs
│   │   ├── Favorites/
│   │   ├── Ratings/
│   │   └── Reports/                   # uses shared Phase 3 moderation queue
│   └── Chat/
│       ├── Commands/                  # SendMessage, MarkRead, SoftDeleteMessage
│       ├── Queries/                   # GetConversations, GetMessageHistory
│       ├── ConversationEntity.cs
│       ├── MessageEntity.cs
│       ├── ChatController.cs          # REST for history + conversation list
│       └── ChatHubExtensions.cs       # EXTENDS existing NotificationHub
└── Constants/
    └── Categories.cs                  # D-24 hardcoded seed
```

### Pattern 1: Listing Entity + Photo Order

```csharp
public class Listing
{
    public Guid Id { get; set; }
    public Guid SellerId { get; set; }
    public Guid BairroId { get; set; }              // enforced by bairro scoping middleware
    public string Title { get; set; } = default!;   // max 120, FTS indexed
    public string Description { get; set; } = default!; // max 500, FTS indexed
    public decimal Price { get; set; }              // required per D-02
    public string CategoryCode { get; set; } = default!;    // from Constants/Categories.cs
    public string SubcategoryCode { get; set; } = default!;
    public ListingStatus Status { get; set; }       // Active | Sold | Removed
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? SoldAt { get; set; }           // drives 7-day "Vendido" grace
    public DateTime? DeletedAt { get; set; }        // soft delete
    public List<ListingPhoto> Photos { get; set; } = new();
}

public class ListingPhoto
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public int OrderIndex { get; set; }              // 0 = cover per D-01
    public string StoragePath { get; set; } = default!;  // relative under /uploads/listings/
    public string ThumbnailPath { get; set; } = default!;
}
```

### Pattern 2: Photo Storage on SmarterASP

**Decision: Local file system at `wwwroot/uploads/listings/{yyyy}/{MM}/{listingId}/{photoId}.jpg`**

Rationale:
- ImageSharp Phase 2 pipeline already writes to `wwwroot/uploads/verification/` successfully
- Static files middleware serves them over HTTPS, Cloudflare proxy caches them (free CDN)
- SmarterASP restricts writes to site root folder (NOT account root) — `wwwroot/uploads/` is legal
- Backup via nightly FTP pull or a simple "export photos with DB" script

**Write pipeline** (reused/adapted from Phase 2):
```csharp
// Source: reuse Phase 2 verification proof handler
public async Task<ListingPhoto> SaveListingPhotoAsync(IFormFile file, Guid listingId, int order)
{
    using var image = await Image.LoadAsync(file.OpenReadStream());

    // Main (1920x1080 max, 85% JPEG quality)
    image.Mutate(x => x.Resize(new ResizeOptions
    {
        Mode = ResizeMode.Max,
        Size = new Size(1920, 1080)
    }));
    var mainPath = Path.Combine("wwwroot", "uploads", "listings",
        DateTime.UtcNow.ToString("yyyy/MM"), listingId.ToString(), $"{Guid.NewGuid()}.jpg");
    Directory.CreateDirectory(Path.GetDirectoryName(mainPath)!);
    await image.SaveAsJpegAsync(mainPath, new JpegEncoder { Quality = 85 });

    // Thumbnail (400x400 cropped, 80% quality) for grid
    using var thumb = image.Clone(x => x.Resize(new ResizeOptions
    {
        Mode = ResizeMode.Crop,
        Size = new Size(400, 400)
    }));
    var thumbPath = mainPath.Replace(".jpg", "_thumb.jpg");
    await thumb.SaveAsJpegAsync(thumbPath, new JpegEncoder { Quality = 80 });

    return new ListingPhoto
    {
        ListingId = listingId,
        OrderIndex = order,
        StoragePath = mainPath.Replace("wwwroot", "").Replace('\\', '/'),
        ThumbnailPath = thumbPath.Replace("wwwroot", "").Replace('\\', '/')
    };
}
```

### Pattern 3: Full-Text Search on Title + Description

SmarterASP shared MSSQL includes Full-Text Search ([SmarterASP SQL hosting specs](https://www.smarterasp.net/sql_2022_hosting)). Pattern mirrors FEED-007.

```sql
-- Migration SQL (EF Core Migration with raw SQL)
CREATE FULLTEXT CATALOG ftListings;
CREATE FULLTEXT INDEX ON Listings(Title, Description)
    KEY INDEX PK_Listings ON ftListings
    WITH CHANGE_TRACKING AUTO;
```

```csharp
// Query pattern
var results = await _db.Listings
    .FromSqlInterpolated($@"
        SELECT * FROM Listings
        WHERE BairroId = {bairroId}
          AND Status = 'Active'
          AND DeletedAt IS NULL
          AND CONTAINS((Title, Description), {searchTerm})
    ")
    .AsNoTracking()
    .ToListAsync();
```

**Critical:** sanitize `searchTerm` by wrapping user input in double quotes and escaping embedded quotes — DO NOT concatenate into SQL. Use `FromSqlInterpolated` (parameterized) as shown.

### Pattern 4: Chat Persistence + Unread Counts (No Redis)

Two tables: `Conversations` (1:1 for now, but schema allows multi-participant later) and `Messages`.

```csharp
public class Conversation
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }           // D-15: chat always anchored to a listing
    public List<ConversationParticipant> Participants { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }   // denormalized, indexed, for conversation list sort
}

public class ConversationParticipant
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime? LastReadAt { get; set; }     // drives unread count
    public bool SoftDeleted { get; set; }
}

public class Message
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string? Text { get; set; }
    public string? ImagePath { get; set; }        // reuse ImageSharp pipeline
    public DateTime SentAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
```

Indexes (critical for unread query performance):
```sql
CREATE INDEX IX_Messages_Conversation_SentAt ON Messages(ConversationId, SentAt);
CREATE INDEX IX_ConvParticipant_User_LastRead ON ConversationParticipants(UserId, LastReadAt);
```

**Unread count query** (single SQL for the whole navbar badge):
```csharp
var unreadTotal = await _db.ConversationParticipants
    .Where(p => p.UserId == currentUserId && !p.SoftDeleted)
    .SelectMany(p => _db.Messages
        .Where(m => m.ConversationId == p.ConversationId
                 && m.SenderId != currentUserId
                 && m.DeletedAt == null
                 && (p.LastReadAt == null || m.SentAt > p.LastReadAt)))
    .CountAsync();
```

**Send flow:**
1. REST `POST /api/v1/chat/conversations/{id}/messages` (or implicit creation with `listingId`)
2. Server persists `Message`, updates `Conversation.LastMessageAt`
3. Server pushes via existing hub to both participants: `await hub.Clients.Users([senderId, recipientId]).SendAsync("MessageReceived", dto)`
4. Client receives, inserts into local Zustand `chatStore`, increments unread counter unless on conversation screen

**History load:** REST `GET /api/v1/chat/conversations/{id}/messages?before={iso}&limit=50` — cursor-based, reverse chronological.

**Mark as read:** REST `POST /api/v1/chat/conversations/{id}/read` updates `LastReadAt = UtcNow`. Also pushes `ConversationRead` over hub so the sender sees a read receipt if desired.

### Pattern 5: Shared Moderation Queue Extension

Extend Phase 3 `Report` table with discriminator instead of creating a second table.

```csharp
public enum ReportTargetType { Post = 1, Comment = 2, Listing = 3 }

public class Report
{
    public Guid Id { get; set; }
    public ReportTargetType TargetType { get; set; }  // NEW column, migration required
    public Guid TargetId { get; set; }                 // generic FK
    public Guid ReporterId { get; set; }
    public string Reason { get; set; } = default!;
    public string? Details { get; set; }
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

Admin dashboard query joins conditionally based on `TargetType`. Keep it in a single view with a type badge column; don't split tabs.

### Pattern 6: Bairro Scoping on Marketplace

Reuse the existing `IBairroContext` / middleware from Phase 2. Every listing query auto-applies `WHERE BairroId = {currentUserBairroId}`. Global query filter on `Listing`:

```csharp
modelBuilder.Entity<Listing>()
    .HasQueryFilter(l => l.BairroId == _bairroContext.CurrentBairroId
                      && l.DeletedAt == null);
```

### Anti-Patterns to Avoid

- **Second SignalR hub for chat.** All realtime goes through the existing hub to keep one connection, one auth context, one reconnection lifecycle. Add methods/groups on the existing hub.
- **DB blobs for photos.** Bloats backups, can't be CDN'd, limits SmarterASP SQL quota.
- **In-memory only unread counts.** They vanish on app restart and mislead the user. Always compute from DB with an index.
- **Unbounded chat history fetch.** Always cursor-paginate. Phones with 500 messages in one conversation will stutter.
- **Client-side-only price validation.** Keep zod + FluentValidation as parallel truth.
- **Starting a new moderation table.** Use the discriminator pattern — the admin dashboard already knows how to render the Phase 3 queue.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realtime delivery | Custom WebSocket server / polling loop | **Existing SignalR hub** | Auth, reconnect, transport fallback, scale-out hook already solved |
| Image resize/compress | System.Drawing / manual byte manipulation | **ImageSharp (existing pipeline)** | Cross-platform safe, already in prod |
| Full-text tokenization | Custom LIKE + normalize | **SQL Server FTS** | Stemming, stop words, ranking included; supported on SmarterASP |
| Form validation | Manual try/catch | **react-hook-form + zod (FE) + FluentValidation (BE)** | Already the project convention |
| Cursor pagination | Offset/limit | **Cursor on `SentAt`+`Id`** | Offset drifts as new messages arrive; cursor is stable |
| Audit log for edits | Custom table + triggers | **Serilog SQL sink (existing)** | Phase 1 already writes structured audit events |
| Rate limiting on send-message | Custom bucket | **.NET 8 built-in `SlidingWindowLimiter`** | Already configured; just tag the chat endpoint |
| Image upload on mobile | Raw FormData construction | **`expo-image-picker` + `expo-image-manipulator`** | Already installed in Phase 02-03 |

**Key insight:** Phase 4 introduces zero new infrastructure. Every "don't hand-roll" already has a working implementation in phases 1-3. The planner's job is to reference those, not re-solve them.

## Common Pitfalls

### Pitfall 1: SignalR WebSocket fails in Expo production builds (works in Expo Go)
**What goes wrong:** `@microsoft/signalr` connects in Expo Go dev mode but silently fails in release builds — "WebSocket failed to connect" or hangs negotiating transport.
**Why:** Expo's release build bundles a WebSocket polyfill that doesn't support all headers the long-polling/SSE transports expect during SignalR's negotiation handshake. ([GH issue 57183](https://github.com/dotnet/aspnetcore/issues/57183))
**How to avoid:**
```ts
const connection = new HubConnectionBuilder()
  .withUrl(`${API_BASE}/hubs/notifications`, {
    transport: HttpTransportType.WebSockets,  // force WebSockets ONLY
    skipNegotiation: true,                     // skip the problematic negotiate step
    accessTokenFactory: () => getJwtToken(),
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .build();
```
Skipping negotiation requires the server to NOT require sticky sessions (we have 1 instance — fine) and to allow direct WebSocket upgrade.
**Warning signs:** Works in dev, hangs at "Starting connection" in release APK/TestFlight.

### Pitfall 2: SignalR `onclose` crash on iOS when retrying
**What goes wrong:** Calling `connection.start()` inside the `onclose` handler crashes the RN bridge. ([GH issue 44564](https://github.com/dotnet/aspnetcore/issues/44564))
**How to avoid:** Use `.withAutomaticReconnect(...)` as shown above — never manually `start()` from `onclose`. If a terminal error occurs, schedule a reconnect via `setTimeout`, not synchronously.

### Pitfall 3: Full-text index not updated in real time
**What goes wrong:** New listings don't appear in search for ~30 seconds.
**Why:** `CHANGE_TRACKING AUTO` is background, not synchronous.
**How to avoid:** Accept the lag for Phase 4 (pilot scale is low). For the search-immediately case (e.g., "search for my own listing right after creating"), fall back to `LIKE '%term%'` on the last 20 minutes of listings in the same query with `UNION DISTINCT`. Document this as a known minor UX delay and don't try to force synchronous FT updates.

### Pitfall 4: Unread count drift from soft-deleted messages
**What goes wrong:** User sees "3 unread" but the conversation has 0 visible messages because they were soft-deleted.
**How to avoid:** The unread query MUST filter `m.DeletedAt == null`. Shown in the pattern above, but easy to forget in a second query.

### Pitfall 5: Photos orphaned on listing soft-delete
**What goes wrong:** Listing is soft-deleted, but photo files remain on disk forever, accumulating on SmarterASP quota.
**How to avoid:** Soft-deleted listings keep photos (needed for "Vendidos" history per D-17). After a later purge phase, or on HARD delete, run a cleanup job. For Phase 4, document the hygiene debt; don't delete files on soft-delete.

### Pitfall 6: FTS `CONTAINS` throws on empty / special-character search
**What goes wrong:** User types `!!!` or empty string and the server 500s.
**How to avoid:** Validate search term is >= 2 chars and contains at least one word character before hitting the query. Fall back to returning the bairro grid unfiltered if the term is empty.

### Pitfall 7: Bairro scoping bypassed on chat
**What goes wrong:** A buyer from another bairro somehow chats with a Vila Velha seller because the chat send endpoint doesn't re-verify.
**How to avoid:** The chat send endpoint MUST verify `listing.BairroId == sender.BairroId`. Do NOT rely only on the global query filter — it only filters reads. Add an explicit guard in the `SendMessage` command handler.

### Pitfall 8: ImageSharp memory spike on 6-photo upload
**What goes wrong:** Posting 6 photos at 5MB each simultaneously pushes the SmarterASP app pool OOM.
**How to avoid:** Process photos **sequentially**, not with `Task.WhenAll`. Dispose each `Image` before loading the next. Set `Configuration.Default.MemoryAllocator = ArrayPoolMemoryAllocator.CreateWithMinimalPooling()` in `Program.cs`.

## Runtime State Inventory

Not applicable — Phase 4 is greenfield feature work, not a rename/refactor. No existing runtime state needs migration.

## Code Examples

### Extending the existing hub with chat methods

```csharp
// Source: https://learn.microsoft.com/en-us/aspnet/core/signalr/hubs
// Existing NotificationHub from Phase 1/3
public class NotificationHub : Hub
{
    // ...existing notification methods...

    // NEW: chat additions
    public async Task JoinConversation(Guid conversationId)
    {
        // Guard: verify the user is a participant
        var userId = Guid.Parse(Context.UserIdentifier!);
        var isParticipant = await _db.ConversationParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);
        if (!isParticipant) throw new HubException("Not a participant");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conv:{conversationId}");
    }
}
```

Server broadcasts from outside the hub (after REST POST):
```csharp
await _hubContext.Clients.Group($"conv:{conversationId}")
    .SendAsync("MessageReceived", messageDto);
await _hubContext.Clients.User(recipientId.ToString())
    .SendAsync("UnreadChanged", newUnreadTotal);
```

### Zustand chatStore shape

```ts
// Source: https://github.com/pmndrs/zustand
interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  unreadTotal: number;
  activeConversationId: string | null;
  connect: () => Promise<void>;
  sendMessage: (conversationId: string, text?: string, image?: File) => Promise<void>;
  markRead: (conversationId: string) => Promise<void>;
}
```

### react-hook-form + zod listing create

```ts
// Source: https://github.com/colinhacks/zod
const listingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(500),
  price: z.number().positive().max(999999),
  categoryCode: z.enum(CATEGORY_CODES),
  subcategoryCode: z.string().min(1),
  photos: z.array(z.instanceof(File)).min(1).max(6),
});
type ListingForm = z.infer<typeof listingSchema>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate hub per feature | Single hub with groups/methods | SignalR 3.0+ | Keep one connection, reuse auth |
| System.Drawing for images | ImageSharp | .NET 6+ | Cross-platform safe |
| Offset pagination | Cursor pagination | ~2020 onward | Stable under inserts |
| Manual WebSocket reconnect | `withAutomaticReconnect` | `@microsoft/signalr` 3.1+ | Fewer custom bugs |
| `@aspnet/signalr` client | `@microsoft/signalr` | 2019 | Old package abandoned |

**Deprecated / outdated:**
- `olofd/react-native-signalr` — last commit years ago, use `@microsoft/signalr` directly with transport forced to WebSockets
- Redux Toolkit for chat state — Zustand is the project convention
- `moment.js` — use `date-fns` (already convention)

## Open Questions

1. **MKT-009 price-change notification — in scope for Phase 4 or defer?**
   - Known: D-09..D-11 don't mention it; CONTEXT.md flags it as "confirm during planning"
   - Unclear: whether the SignalR push + unread pipe should also carry a "favorite price changed" event
   - Recommendation: Store `Favorite` row with `SnapshotPrice`; when listing edit changes price and a row exists, enqueue a notification via the existing Phase 3 notification system. Small addition, don't defer.

2. **Static file Cloudflare caching headers for photos**
   - Known: Cloudflare proxies api.bairronow.com.br
   - Unclear: whether we set `Cache-Control: public, max-age=31536000, immutable` on uploaded JPEGs at the middleware level
   - Recommendation: yes, add explicit headers in the static files middleware for the `/uploads/listings/` path. Filenames include a Guid so they're immutable.

3. **Do we need a "conversation with seller that already has an active conversation for the same listing" dedupe?**
   - Recommendation: yes. `POST /chat/conversations` must look up an existing Active conversation with (listingId, buyerId, sellerId) and return it instead of creating a duplicate.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (BE) | xUnit 2.9.x + Moq 4.20.x + FluentAssertions 7.x + Bogus 35.x (pt_BR locale) |
| Framework (FE web) | Jest 29.x + React Testing Library 16.x |
| Framework (Expo) | Jest + jest-expo preset |
| Config file | `tests/api.tests.csproj`, `web/jest.config.js`, `mobile/jest.config.js` (all from Phase 1-3) |
| Quick run (BE) | `dotnet test --filter "FullyQualifiedName~Marketplace" -v quiet` |
| Full suite (BE) | `dotnet test` |
| Quick run (web) | `cd web && npm test -- --testPathPattern marketplace` |
| Full suite (web) | `cd web && npm test` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Command | File Exists? |
|-----|----------|-----------|---------|-------------|
| MKT-001 | Create listing with 6 photos persists + photos on disk | integration | `dotnet test --filter CreateListing` | Wave 0 |
| MKT-002 | Grid query returns only current-bairro active listings | unit | `dotnet test --filter GetBairroGrid` | Wave 0 |
| MKT-003 | Detail endpoint includes seller badge + photo order | unit | `dotnet test --filter GetListingDetail` | Wave 0 |
| MKT-004 | SendMessage persists + pushes via hub + updates unread | integration | `dotnet test --filter ChatSendMessage` | Wave 0 |
| MKT-005 | MarkSold transitions status + keeps visible 7 days | unit | `dotnet test --filter MarkSold` | Wave 0 |
| MKT-006 | Edit writes audit log + updates UpdatedAt | integration | `dotnet test --filter UpdateListing` | Wave 0 |
| MKT-007 | FTS search returns matches + filter combination | integration (needs FTS-enabled test DB) | `dotnet test --filter SearchListings` | Wave 0 |
| MKT-008 | Report creates row with TargetType=Listing in shared queue | unit | `dotnet test --filter ReportListing` | Wave 0 |
| MKT-009 | Favorite toggles + price-change triggers notification | unit | `dotnet test --filter FavoriteListing` | Wave 0 |
| MKT-010 | Rating 1-5 + 7-day edit window enforced | unit | `dotnet test --filter SellerRating` | Wave 0 |
| MKT-011 | Category constants wire into listing validation | unit | `dotnet test --filter Categories` | Wave 0 |
| Chat web | Message delivery + unread badge update | RTL | `npm test -- chat` | Wave 0 |
| Listing create web | Photo dropzone + zod validation | RTL | `npm test -- listing-create` | Wave 0 |
| Chat mobile | WebSocket forced transport connects in Expo | manual + integration | Expo dev client on device | manual-only |

### Sampling Rate
- **Per task commit:** area-filtered test run (`--filter Marketplace` / `--testPathPattern`)
- **Per wave merge:** full suite for that project
- **Phase gate:** all three suites (api, web, mobile) green + manual Expo release-build smoke test for chat connectivity

### Wave 0 Gaps
- [ ] `tests/Marketplace/ListingsTests.cs` — all listing CRUD + bairro scoping
- [ ] `tests/Marketplace/FullTextSearchTests.cs` — needs FTS catalog created in test DB migration
- [ ] `tests/Chat/ChatHubTests.cs` — hub method unit tests with test context
- [ ] `tests/Chat/UnreadCountTests.cs` — the single-query correctness test
- [ ] `web/__tests__/marketplace/` directory + Jest setup for new feature
- [ ] `mobile/__tests__/chat/` + jest-expo mock for `@microsoft/signalr`
- [ ] Test DB migration must include FTS catalog creation (otherwise MKT-007 tests fail locally)

## Sources

### Primary (HIGH confidence)
- [SmarterASP SQL 2022 Hosting — confirms Full Text Search on shared plans](https://www.smarterasp.net/sql_2022_hosting)
- [SmarterASP SQL 2025 Hosting](https://www.smarterasp.net/sql_2025_hosting)
- [ASP.NET Core SignalR Hubs docs](https://learn.microsoft.com/en-us/aspnet/core/signalr/hubs?view=aspnetcore-8.0)
- [ASP.NET Core Rate Limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-8.0)
- [Upload files in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-8.0)
- [SixLabors ImageSharp — NuGet](https://www.nuget.org/packages/sixlabors.imagesharp/)
- Phase 1-3 in-repo artifacts: existing hub, ImageSharp pipeline, Serilog audit, moderation queue, bairro middleware

### Secondary (MEDIUM confidence)
- [GH dotnet/aspnetcore #57183 — @microsoft/signalr WebSocket fails in RN production](https://github.com/dotnet/aspnetcore/issues/57183)
- [GH dotnet/aspnetcore #44564 — onclose crash on iOS](https://github.com/dotnet/aspnetcore/issues/44564)
- [GH dotnet/aspnetcore #6565 — Can't connect from React Native](https://github.com/dotnet/aspnetcore/issues/6565)
- [SmarterASP serve static files KB](https://www.smarterasp.net/support/kb/a2220/how-to-serve-static-files-in-asp_net-core.aspx)

### Tertiary (LOW confidence — validate at plan time)
- Exact behavior of `CHANGE_TRACKING AUTO` lag on SmarterASP's specific MSSQL build — needs a quick smoke test in Wave 0

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything is already in the project from phases 1-3
- Architecture: HIGH — patterns are direct extensions of shipped Phase 3 patterns
- Photo storage decision: HIGH — same pipeline that's already shipping verification proofs
- Full-text search: HIGH for availability, MEDIUM for sync lag behavior
- Chat persistence: HIGH — classic pattern, no unknowns
- Mobile SignalR: MEDIUM — workarounds are known but need a real device test in Wave 0
- Pitfalls: HIGH — sourced from official GH issues

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack, 30 days)
