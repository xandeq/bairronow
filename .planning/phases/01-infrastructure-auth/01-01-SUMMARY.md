---
phase: 01-infrastructure-auth
plan: 01
subsystem: infra
tags: [dotnet, ef-core, sql-server, serilog, jwt, signalr, cors, rate-limiting]

requires:
  - phase: none
    provides: greenfield project
provides:
  - .NET 8 Web API project with full middleware pipeline
  - EF Core DbContext with User, RefreshToken, AuditLog entities
  - xUnit test project with Moq, FluentAssertions, Bogus
  - SignalR hub placeholder at /hubs/notifications
affects: [01-03-auth-implementation, 01-04-deployment]

tech-stack:
  added: [EF Core 8, Serilog, FluentValidation, Swashbuckle 6.x, MediatR, AutoMapper, BCrypt.Net-Next, SignalR]
  patterns: [middleware pipeline ordering, audit logging via middleware, global exception handler with PT-BR messages]

key-files:
  created:
    - NossoVizinho.sln
    - src/NossoVizinho.Api/Program.cs
    - src/NossoVizinho.Api/Data/AppDbContext.cs
    - src/NossoVizinho.Api/Models/Entities/User.cs
    - src/NossoVizinho.Api/Models/Entities/RefreshToken.cs
    - src/NossoVizinho.Api/Models/Entities/AuditLog.cs
    - src/NossoVizinho.Api/Middleware/AuditLoggingMiddleware.cs
    - src/NossoVizinho.Api/Middleware/ExceptionHandlerMiddleware.cs
    - src/NossoVizinho.Api/Hubs/NotificationHub.cs
    - src/NossoVizinho.Api/web.config
  modified:
    - src/NossoVizinho.Api/appsettings.json
    - src/NossoVizinho.Api/appsettings.Development.json

decisions:
  - Pinned Swashbuckle to v6.x (v10 requires OpenApi v3 namespace changes incompatible with standard patterns)
  - Used RateLimitPartition.GetSlidingWindowLimiter policy pattern instead of AddSlidingWindowLimiter extension

metrics:
  duration: 7m
  completed: 2026-04-06
---

# Phase 01 Plan 01: Backend API Scaffold Summary

.NET 8 Web API with EF Core (User/RefreshToken/AuditLog), full middleware pipeline (CORS, rate limiting, JWT auth, audit logging, exception handling, Swagger), and SignalR hub placeholder.

## What Was Built

### Task 1: Project Scaffold
- Created `NossoVizinho.sln` with API and test projects
- Added all NuGet packages (EF Core 8, Serilog, FluentValidation, JWT Bearer, MediatR, AutoMapper, BCrypt, SignalR)
- Test project has Moq, FluentAssertions, Bogus, Mvc.Testing
- Folder structure: Controllers/v1, Models/Entities, Models/DTOs, Services, Validators, Data, Middleware, Hubs

### Task 2: EF Core Entities and DbContext
- **User**: Guid PK, email (unique index), password hash, email confirmation, lockout, privacy policy acceptance
- **RefreshToken**: token (indexed), user FK, expiry, IP tracking, revocation, rotation (ReplacedByTokenId)
- **AuditLog**: identity PK, action, entity tracking, user tracking, IP, JSON details, timestamp (indexed)
- **AppDbContext**: SaveChangesAsync override auto-sets CreatedAt/UpdatedAt on User entities

### Task 3: Middleware Pipeline
- **CORS**: explicit origins from config, credentials allowed, X-Pagination/Retry-After exposed
- **Rate Limiting**: authenticated (100/min, 6 segments), public (20/min, 4 segments), 429 + Retry-After header
- **JWT Auth**: symmetric key, issuer/audience validation, configured via appsettings
- **Swagger**: v1 doc at /swagger/v1, Bearer auth definition
- **AuditLoggingMiddleware**: logs POST/PUT/PATCH/DELETE with 2xx to AuditLogs table
- **ExceptionHandlerMiddleware**: catches unhandled exceptions, returns PT-BR JSON error, dev detail in Development
- **NotificationHub**: SignalR at /hubs/notifications, [Authorize], JoinBairro group method
- **web.config**: removes OPTIONSVerbHandler for IIS CORS preflight

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b9d3625 | Scaffold .NET 8 API and test projects |
| 1 | c2c0e21 | Add .gitignore, remove tracked bin/obj |
| 2 | 234071d | Create EF Core entities and DbContext |
| 3 | dd1b0d6 | Configure middleware pipeline and infrastructure |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] NuGet package version incompatibility with .NET 8**
- **Found during:** Task 1
- **Issue:** EF Core, JWT Bearer, and Mvc.Testing latest versions target .NET 10+, incompatible with net8.0
- **Fix:** Pinned to 8.0.* versions for framework-bound packages
- **Files modified:** NossoVizinho.Api.csproj, NossoVizinho.Api.Tests.csproj

**2. [Rule 3 - Blocking] Swashbuckle v10 OpenApi namespace change**
- **Found during:** Task 3
- **Issue:** Swashbuckle.AspNetCore 10.x depends on Microsoft.OpenApi v3 which removed `Microsoft.OpenApi.Models` namespace
- **Fix:** Pinned Swashbuckle to v6.x which uses OpenApi v1 with standard namespace
- **Files modified:** NossoVizinho.Api.csproj

**3. [Rule 1 - Bug] AddSlidingWindowLimiter not available as extension**
- **Found during:** Task 3
- **Issue:** `AddSlidingWindowLimiter` extension method not found on `RateLimiterOptions`
- **Fix:** Used `AddPolicy` with `RateLimitPartition.GetSlidingWindowLimiter` pattern
- **Files modified:** Program.cs

**4. [Rule 2 - Missing] .gitignore not in plan**
- **Found during:** Task 1
- **Issue:** bin/obj directories committed to git (700+ files)
- **Fix:** Added .gitignore and cleaned tracked build artifacts
- **Files modified:** .gitignore

## Verification

- `dotnet build NossoVizinho.sln` - 0 errors
- `dotnet test` - 1 passed, 0 failed
- No hardcoded secrets (connection strings empty in appsettings.json)
- All middleware registrations present in Program.cs

## Known Stubs

None - all code is functional infrastructure, no UI rendering stubs.

## Self-Check: PASSED

All 6 key files verified on disk. All 4 commit hashes found in git log.
