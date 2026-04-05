# Architecture Patterns

**Domain:** Neighborhood social network
**Researched:** 2026-04-05

## Recommended Architecture

```
[Browser] --> [Cloudflare CDN/DNS]
                |                    |
    [HostGator - Next.js static]   [SmarterASP - .NET 8 API]
                                        |
                                   [SQL Server]
                                        |
                              [ViaCEP/BrasilAPI] (external)
```

**Frontend:** Next.js 15 exported as static site (`output: 'export'`), served from HostGator cPanel. All dynamic data via API calls to SmarterASP backend. Cloudflare proxies both domains.

**Backend:** .NET 8 Web API on SmarterASP. Clean Architecture (3-layer): API Controllers -> Application Services -> Data/EF Core. SignalR hub for real-time.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Next.js Frontend | UI rendering, form validation, image compression | .NET API via REST, SignalR hub |
| API Controllers | HTTP routing, auth, rate limiting | Application services via MediatR |
| Application Services | Business logic, validation, orchestration | EF Core, external APIs (ViaCEP) |
| EF Core / Data Layer | Persistence, queries, migrations | SQL Server |
| SignalR Hub | Real-time events (new posts, notifications) | Authenticated clients |
| CEP Service | Address lookup, neighborhood resolution | ViaCEP, BrasilAPI (cached) |
| Image Service | Upload validation, resize, storage | Local filesystem (SmarterASP) |

### Data Flow - Post Creation

1. User writes post + attaches image in Next.js
2. `browser-image-compression` resizes client-side
3. `axios` POSTs multipart form to API (JWT in header)
4. Rate limiter checks 100 req/min
5. FluentValidation validates input
6. ImageSharp validates/resizes server-side (max 1200px, WebP)
7. File saved to `/uploads/` on SmarterASP filesystem
8. EF Core inserts post record
9. SignalR broadcasts `NewPost` to neighborhood group
10. Feed refreshes for online neighbors

## Patterns to Follow

### Pattern 1: Soft Deletes
**What:** Never hard-delete. Set `IsDeleted = true`, `DeletedAt = DateTime`.
**When:** All entities (users, posts, listings, events).
**Implementation:** EF Core global query filter: `builder.HasQueryFilter(e => !e.IsDeleted)`

### Pattern 2: Neighborhood Scoping
**What:** Almost every query filters by `BairroId`.
**When:** Feed, marketplace, events, groups, neighbor list.
**Implementation:** Extract `BairroId` from JWT claims. Apply as default filter in service layer.

### Pattern 3: JWT + Refresh Token Rotation
**What:** Short-lived access token (15 min) + long-lived refresh token (7 days) stored in httpOnly cookie.
**When:** All authenticated requests.
**Implementation:** Access token in Authorization header. Refresh token in httpOnly secure cookie. Rotate refresh token on each use (one-time use).

### Pattern 4: CEP Cache
**What:** Cache CEP lookups in IMemoryCache (24h TTL).
**When:** Registration, address verification.
**Why:** CEPs rarely change. Avoid hammering free APIs.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fat Controllers
**What:** Business logic in controllers.
**Why bad:** Untestable, duplicated logic.
**Instead:** Controllers only do: parse request -> call service -> return response.

### Anti-Pattern 2: N+1 Queries
**What:** Loading related entities in loops.
**Why bad:** 100 posts with authors = 101 queries.
**Instead:** Use `.Include()` or projection with `.Select()`.

### Anti-Pattern 3: Storing Images in Database
**What:** Saving image bytes as SQL Server BLOB.
**Why bad:** Bloats DB, slow queries, hard to serve.
**Instead:** Store on filesystem, save path in DB.

## Scalability Considerations

| Concern | MVP (100 users) | Growth (10K users) | Scale (100K+ users) |
|---------|-----------------|--------------------|--------------------|
| Database | Single SQL Server, no issues | Add indexes on BairroId, CreatedAt | Migrate to dedicated SQL Server or PostgreSQL |
| Images | Local filesystem | Cloudflare caching helps | Move to S3/Cloudflare R2 |
| Real-time | Single SignalR hub | Still fine on single instance | Azure SignalR Service or dedicated server |
| Cache | IMemoryCache | IMemoryCache still OK single-instance | Redis (need hosting upgrade) |
| API | Single SmarterASP instance | May need paid tier | Migrate to Azure App Service or VPS |
