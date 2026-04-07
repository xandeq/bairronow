---
phase: 03-feed-posts
plan: 01
subsystem: backend-feed
tags: [feed, posts, comments, likes, reports, moderation, notifications, signalr, rate-limit, fluentvalidation, ef-core]
requires:
  - 01-01: AppDbContext, JWT auth, AuditLog
  - 01-02: TokenService, refresh tokens
  - 02-01: FileStorageService, ImageSharp pipeline, NotificationHub
  - 02-02: User.IsVerified, User.BairroId
provides:
  - REST endpoints under /api/v1/posts, /api/v1/comments, /api/v1/posts/{id}/like, /api/v1/search, /api/v1/reports, /api/v1/admin/moderation, /api/v1/notifications
  - SignalR push to user channel: hub.Clients.User(userId).SendAsync("notification", NotificationDto)
  - is_verified + bairro_id JWT claims
  - VerifiedOnly authorization policy
  - feed-write rate limit policy (10/min sliding, partitioned by user)
  - Shared TS types: PostDto, CommentDto, FeedPageDto, NotificationDto, ReportDto, etc.
affects:
  - Phase 03-02 (web feed UI) — consumer of all endpoints + SignalR
tech-stack:
  added:
    - none new (reused EF Core 8, FluentValidation, ImageSharp, SignalR, .NET RateLimiter)
  patterns:
    - Soft delete via DeletedAt + global query filter (mirrors Verification.IsDeleted pattern)
    - Cursor pagination (base64 ticks:id) for feed
    - Composite PK on PostLike (PostId, UserId)
    - Enum-as-string conversions (PostCategory, ReportReason)
    - Custom Feed*Exception (Forbidden/NotFound/Validation) mapped in controllers to 403/404/400
key-files:
  created:
    - src/NossoVizinho.Api/Models/Enums/PostCategory.cs
    - src/NossoVizinho.Api/Models/Enums/ReportReason.cs
    - src/NossoVizinho.Api/Models/Entities/Post.cs
    - src/NossoVizinho.Api/Models/Entities/PostImage.cs
    - src/NossoVizinho.Api/Models/Entities/Comment.cs
    - src/NossoVizinho.Api/Models/Entities/PostLike.cs
    - src/NossoVizinho.Api/Models/Entities/Report.cs
    - src/NossoVizinho.Api/Models/Entities/Notification.cs
    - src/NossoVizinho.Api/Models/DTOs/FeedDtos.cs
    - src/NossoVizinho.Api/Migrations/20260407204318_AddFeedEntities.cs
    - src/NossoVizinho.Api/Services/IOffensiveWordFilter.cs
    - src/NossoVizinho.Api/Services/OffensiveWordFilter.cs
    - src/NossoVizinho.Api/Services/IFeedQueryService.cs + FeedQueryService.cs
    - src/NossoVizinho.Api/Services/IPostService.cs + PostService.cs
    - src/NossoVizinho.Api/Services/ICommentService.cs + CommentService.cs
    - src/NossoVizinho.Api/Services/ILikeService.cs + LikeService.cs
    - src/NossoVizinho.Api/Services/IModerationService.cs + ModerationService.cs
    - src/NossoVizinho.Api/Services/INotificationService.cs + NotificationService.cs
    - src/NossoVizinho.Api/Controllers/v1/PostsController.cs
    - src/NossoVizinho.Api/Controllers/v1/CommentsController.cs
    - src/NossoVizinho.Api/Controllers/v1/LikesController.cs
    - src/NossoVizinho.Api/Controllers/v1/SearchController.cs
    - src/NossoVizinho.Api/Controllers/v1/ReportsController.cs
    - src/NossoVizinho.Api/Controllers/v1/ModerationController.cs
    - src/NossoVizinho.Api/Controllers/v1/NotificationsController.cs
    - src/NossoVizinho.Api/Validators/CreatePostRequestValidator.cs
    - src/NossoVizinho.Api/Validators/CreateCommentRequestValidator.cs
    - src/NossoVizinho.Api/Validators/CreateReportRequestValidator.cs
    - tests/NossoVizinho.Api.Tests/Services/OffensiveWordFilterTests.cs
    - tests/NossoVizinho.Api.Tests/Services/PostServiceTests.cs
    - tests/NossoVizinho.Api.Tests/Services/CommentServiceTests.cs
  modified:
    - src/NossoVizinho.Api/Data/AppDbContext.cs (6 new DbSets + OnModelCreating wiring)
    - src/NossoVizinho.Api/Services/FileStorageService.cs (added SaveImageAsync(folder))
    - src/NossoVizinho.Api/Services/IFileStorageService.cs (interface extended)
    - src/NossoVizinho.Api/Services/TokenService.cs (added is_verified + bairro_id claims)
    - src/NossoVizinho.Api/Program.cs (DI registrations + VerifiedOnly policy + feed-write rate limit)
    - packages/shared-types/src/feed.ts (rewrote with Phase 03 DTOs)
decisions:
  - Used Guid for AuthorId/UserId/ActorUserId/ResolvedByUserId everywhere — User.Id is Guid in existing schema, plan spec said int. Forced deviation (Rule 3).
  - Comments containing offensive words are rejected (422) instead of flagged — keeps comment moderation simple for MVP.
  - Cursor pagination uses base64(ticks:id) — simpler than keyset on (CreatedAt, Id) tuples in client code.
  - Wordlist embedded as const array (no DB table) — singleton, fast, deterministic.
  - feed-write rate limiter partitioned by ClaimTypes.NameIdentifier (Guid) — falls back to IP for unauth.
metrics:
  duration: 8min
  completed: 2026-04-07
  tasks: 2
  files_created: 32
  files_modified: 6
  tests_added: 17
  tests_passing: 17
---

# Phase 03 Plan 01: Backend Feed Stack Summary

Backend feed stack delivered: 6 entities, 1 EF migration, 6 services, 7 REST controllers, 3 FluentValidation validators, SignalR push notifications, in-memory pt-BR offensive word filter, sliding-window write rate limiting, and matching shared TS types — 17 unit tests green.

## Endpoints

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | /api/v1/posts | VerifiedOnly + feed-write | multipart with up to 4 IFormFile images, ImageSharp resize, returns PostDto |
| GET | /api/v1/posts?bairroId&cursor&take | Authorize | reverse-chrono, base64 cursor (ticks:id) |
| GET | /api/v1/posts/{id} | Authorize | returns post + comment tree (1-level) |
| PUT | /api/v1/posts/{id} | VerifiedOnly + feed-write | author + 30min window |
| DELETE | /api/v1/posts/{id} | Authorize | soft delete (DeletedAt) |
| POST | /api/v1/comments | VerifiedOnly + feed-write | rejects nested replies, rejects offensive |
| PUT | /api/v1/comments/{id} | VerifiedOnly | author only |
| DELETE | /api/v1/comments/{id} | Authorize | soft delete |
| GET | /api/v1/comments/by-post/{postId} | Authorize | tree |
| POST | /api/v1/posts/{postId}/like | VerifiedOnly + feed-write | toggle, returns {liked, count} |
| GET | /api/v1/posts/{postId}/like/who | Authorize | last 100 likers |
| GET | /api/v1/search?q&category&from&to&authorId | Authorize | EF.Functions.Like, scoped to caller bairro |
| POST | /api/v1/reports | Authorize + feed-write | enqueues pending report |
| GET | /api/v1/admin/moderation/reports | Admin | pending list |
| POST | /api/v1/admin/moderation/reports/{id}/resolve | Admin | dismiss \| remove (soft-deletes target) |
| GET | /api/v1/notifications | Authorize | last 50 |
| POST | /api/v1/notifications/{id}/read | Authorize | mark single |
| POST | /api/v1/notifications/read-all | Authorize | bulk |

## SignalR Contract

Hub: `/hubs/notifications` (existing from 02-01).
Server → client event: `notification` with payload `NotificationDto { id, type, postId, commentId, actor, isRead, createdAt }`.
Triggered on: comment, reply, like (skipped if self), @mention (DisplayName exact match).

## Rate Limit Policy

`feed-write` — SlidingWindowLimiter, PermitLimit=10, Window=60s, partitioned by `ClaimTypes.NameIdentifier` (user Guid). Applied via `[EnableRateLimiting("feed-write")]` on create-post / update-post / create-comment / like / report endpoints.

## Wordlist Source

Embedded const array of 30 pt-BR insults/slurs in `OffensiveWordFilter.cs`. Whole-word regex match with diacritics stripping (FormD normalization). To extend, append to `Wordlist` array and recompile (singleton, no DB).

## Deviations from Plan

### Rule 3 — Forced schema deviation
**[Rule 3 - Blocking] AuthorId/UserId/ActorUserId use Guid, not int**
- **Found during:** Task 1 entity creation
- **Issue:** Plan spec said `AuthorId int FK Users` but the existing `User.Id` is `Guid`.
- **Fix:** Used `Guid` throughout new entities (Post, Comment, PostLike, Report, Notification) and all service signatures.
- **Impact:** Shared-types `PostAuthorDto.id` is `string` (Guid serialized as string).
- **Files:** all new entities and services.

### Out of scope (deferred)
- `pnpm --filter @bairronow/shared-types build` skipped — package has no `build` script (it's TS source-only re-exported via `main: src/index.ts`). TS validity verified by file structure mirroring existing modules.
- Audit log writes are emitted on post.create / post.update / post.delete / moderation.* but not on like/comment (kept for MVP simplicity).

## Verification

- `dotnet build src/NossoVizinho.Api -c Debug` → 0 errors, 1 pre-existing warning.
- `dotnet test tests/NossoVizinho.Api.Tests --filter "FullyQualifiedName~OffensiveWordFilterTests|FullyQualifiedName~PostServiceTests|FullyQualifiedName~CommentServiceTests"` → 17 passed / 0 failed.
- Migration `20260407204318_AddFeedEntities` generated and applied at startup via existing `db.Database.Migrate()` boot path.

## Known Stubs

None — all endpoints are wired to real services and persistence. The web feed UI consuming these endpoints arrives in Plan 03-02.

## Self-Check: PASSED

- src/NossoVizinho.Api/Models/Entities/Post.cs ✓
- src/NossoVizinho.Api/Migrations/20260407204318_AddFeedEntities.cs ✓
- src/NossoVizinho.Api/Services/PostService.cs ✓
- src/NossoVizinho.Api/Controllers/v1/PostsController.cs ✓
- packages/shared-types/src/feed.ts ✓
- Commits b06bec5 + 6477b91 present in git log.
