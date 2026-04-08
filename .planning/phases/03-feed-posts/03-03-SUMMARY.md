---
phase: 03-feed-posts
plan: 03
subsystem: auth-dto-gap-closure
tags: [auth, dto, frontend-contract, gap-closure]
requires: [01-02 auth, 02-01 verification]
provides: [verified-flag-on-login, admin-flag-on-login, bairroId-on-login]
affects: [PostComposer enable, /admin/moderation gate, /feed redirect]
tech-stack:
  added: []
  patterns: [extended-record-projection]
key-files:
  created: []
  modified:
    - src/NossoVizinho.Api/Models/DTOs/AuthResponse.cs
    - src/NossoVizinho.Api/Services/AuthService.cs
    - packages/shared-types/src/auth.ts
decisions:
  - "UserInfo flat record extended (no nested object) to keep frontend store simple"
  - "Frontend types made required (not optional) since backend always projects"
metrics:
  duration: 4min
  tasks: 2
  files: 3
  completed: 2026-04-07
requirements: [FEED-003, FEED-008]
---

# Phase 03 Plan 03: Auth Response Gap Closure Summary

One-liner: Extended `UserInfo` DTO with `BairroId`, `IsVerified`, `IsAdmin` so the login/register/refresh JSON exposes verification + admin flags, unblocking PostComposer publish (FEED-003) and admin moderation gate (FEED-008).

## What Shipped

- **AuthResponse.cs** — `UserInfo` record gained 3 positional params: `int? BairroId`, `bool IsVerified`, `bool IsAdmin`.
- **AuthService.cs** — All three `new UserInfo(...)` projections (Login, Register, Refresh) now populate the new fields from the `User` entity.
- **shared-types/src/auth.ts** — `UserInfo` interface fields `bairroId | isVerified | isAdmin` upgraded from optional to required, matching the new backend contract.

## Verification

- `dotnet build` of `NossoVizinho.Api` exits 0 (1 pre-existing warning in `ExceptionHandlerMiddleware`, unrelated).
- Grep confirms `IsVerified` present in `AuthResponse.cs`.
- Grep confirms 3 occurrences of `user.BairroId, user.IsVerified, user.IsAdmin` in `AuthService.cs` (Login/Register/Refresh).
- Grep confirms `bairroId: number | null`, `isVerified: boolean`, `isAdmin: boolean` in shared types.
- Mobile consumer search: only `profile?.isVerified` and `address.bairroId` references found — these target different DTOs (profile, address) so no consumer break.

## Gap Closed

- **FEED-003** unblocked: PostComposer can now read `auth.user.isVerified` and enable publishing for verified residents.
- **FEED-008** unblocked: `/admin/moderation` route can read `auth.user.isAdmin`.
- Verified user no longer wrongly redirected to `/onboarding/cep` after login (auth store now sees `bairroId !== null`).

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `03351e2` feat(03-03): extend UserInfo DTO with bairroId/isVerified/isAdmin
- `cd86704` feat(03-03): make UserInfo bairroId/isVerified/isAdmin required

## Self-Check: PASSED

- AuthResponse.cs: FOUND
- AuthService.cs: FOUND
- shared-types/src/auth.ts: FOUND
- commit 03351e2: FOUND
- commit cd86704: FOUND
