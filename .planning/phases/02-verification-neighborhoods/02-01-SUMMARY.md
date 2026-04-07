---
phase: 02-verification-neighborhoods
plan: 01
subsystem: backend
tags: [verification, cep, bairro, profile, admin, ef-migration]
dependency_graph:
  requires:
    - "Phase 01 auth (JWT, User entity, AppDbContext)"
  provides:
    - "GET /api/v1/cep/{cep}"
    - "POST /api/v1/verification (multipart)"
    - "GET /api/v1/verification/me"
    - "GET /api/v1/admin/verifications (Admin policy)"
    - "POST /api/v1/admin/verifications/{id}/approve|reject|proof"
    - "GET|PUT /api/v1/profile/me"
    - "Bairro + Verification entities, VilaVelhaBairros seed"
    - "@bairronow/shared-types: CepLookupResult, VerificationStatusDto, AdminVerificationListItem, ProfileDto, UpdateProfileRequest"
  affects:
    - "User entity (new columns: PhotoUrl, Bio, BairroId, IsVerified, VerifiedAt, IsAdmin, AcceptedTermsVersion, AcceptedTermsAt)"
    - "JWT token now includes is_admin claim"
    - "Downstream: feed/marketplace/map can now gate on User.IsVerified"
tech-stack:
  added:
    - "SixLabors.ImageSharp 3.1.12"
  patterns:
    - "AddHttpClient<ICepLookupService,CepLookupService> + IMemoryCache (24h TTL)"
    - "Global soft-delete query filter on Verification"
    - "Policy-based authorization via is_admin claim"
key-files:
  created:
    - src/NossoVizinho.Api/Models/Entities/Bairro.cs
    - src/NossoVizinho.Api/Models/Entities/Verification.cs
    - src/NossoVizinho.Api/Data/Seed/VilaVelhaBairros.cs
    - src/NossoVizinho.Api/Migrations/20260407182729_AddBairrosAndVerifications.cs
    - src/NossoVizinho.Api/Services/ICepLookupService.cs
    - src/NossoVizinho.Api/Services/CepLookupService.cs
    - src/NossoVizinho.Api/Services/IBairroService.cs
    - src/NossoVizinho.Api/Services/BairroService.cs
    - src/NossoVizinho.Api/Services/IFileStorageService.cs
    - src/NossoVizinho.Api/Services/FileStorageService.cs
    - src/NossoVizinho.Api/Services/IVerificationService.cs
    - src/NossoVizinho.Api/Services/VerificationService.cs
    - src/NossoVizinho.Api/Controllers/v1/CepController.cs
    - src/NossoVizinho.Api/Controllers/v1/VerificationController.cs
    - src/NossoVizinho.Api/Controllers/v1/AdminVerificationController.cs
    - src/NossoVizinho.Api/Controllers/v1/ProfileController.cs
    - packages/shared-types/src/verification.ts
  modified:
    - src/NossoVizinho.Api/Models/Entities/User.cs
    - src/NossoVizinho.Api/Data/AppDbContext.cs
    - src/NossoVizinho.Api/Services/TokenService.cs
    - src/NossoVizinho.Api/Program.cs
    - src/NossoVizinho.Api/NossoVizinho.Api.csproj
    - src/NossoVizinho.Api/web.config
    - packages/shared-types/src/index.ts
decisions:
  - "ImageSharp bumped from planned 3.1.5 to 3.1.12 (auto-fix Rule 2: CVE GHSA-2cmq-823j-5qj8 high + GHSA-rxmq-m78w-7wmc moderate)"
  - "UserId FK on Verification is Guid (not int) to match existing User.Id from Phase 01"
  - "Admin policy implemented via JWT is_admin claim (simpler than custom AuthorizationHandler with DB lookup)"
  - "Proof files NOT served via static files; exposed only via authenticated GET /api/v1/admin/verifications/{id}/proof stream"
  - "Bairro matching uses diacritic-insensitive normalize (FormD + strip combining marks) for robust ViaCEP -> seed list matching"
  - "Startup auto-migrate via db.Database.Migrate() + seed if Bairros empty (works on SmarterASP where manual ef tooling is not available)"
metrics:
  duration: "~15min"
  completed: "2026-04-07"
---

# Phase 02 Plan 01: Verification Backend Summary

Built the full trust-layer backend: Bairro + Verification entities with EF migration, ViaCEP/BrasilAPI CEP lookup with in-memory cache and bairro matching, 5MB multipart proof upload with ImageSharp resize + SHA256 duplicate detection, user profile editing, and admin review queue gated by `is_admin` JWT claim.

## Commits

| Task | Commit   | Description                                                                       |
| ---- | -------- | --------------------------------------------------------------------------------- |
| 1    | 29e77b5  | entities, User profile fields, VilaVelhaBairros seed, EF migration, ImageSharp    |
| 2    | f219ef1  | CEP/Bairro/FileStorage/Verification services + 4 controllers + shared-types + TokenService is_admin claim + web.config 6MB limit |

## Endpoints Delivered

| Method | Route                                            | Auth          | Purpose                                   |
| ------ | ------------------------------------------------ | ------------- | ----------------------------------------- |
| GET    | /api/v1/cep/{cep}                                | public (rl)   | ViaCEP + BrasilAPI fallback, returns bairroId |
| POST   | /api/v1/verification                             | [Authorize]   | Submit proof (multipart cep, numero, proof) |
| GET    | /api/v1/verification/me                          | [Authorize]   | Current user's latest verification status  |
| GET    | /api/v1/profile/me                               | [Authorize]   | User profile DTO                           |
| PUT    | /api/v1/profile/me                               | [Authorize]   | Update displayName + bio                   |
| GET    | /api/v1/admin/verifications?status=pending       | Policy=Admin  | Paginated pending queue (+suspected dup)   |
| POST   | /api/v1/admin/verifications/{id}/approve         | Policy=Admin  | Sets User.IsVerified, BairroId, VerifiedAt |
| POST   | /api/v1/admin/verifications/{id}/reject          | Policy=Admin  | Sets Rejected + reason                     |
| GET    | /api/v1/admin/verifications/{id}/proof           | Policy=Admin  | Streams stored proof file                  |

## Entities

- **Bairro** — Id, Nome, Cidade, Uf, Slug (unique), IsActive. Seeded with 12 Vila Velha bairros.
- **Verification** — Id, UserId (Guid FK), Cep, Logradouro, Numero, BairroId, ProofFilePath, ProofSha256 (indexed), Status, ReviewedByUserId, ReviewedAt, RejectionReason, IsSuspectedDuplicate, IsDeleted (soft delete filter), SubmittedAt, ReVerifyAfter (+12mo).
- **User (extended)** — PhotoUrl, Bio, BairroId, IsVerified, VerifiedAt, IsAdmin, AcceptedTermsVersion, AcceptedTermsAt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Bumped SixLabors.ImageSharp 3.1.5 -> 3.1.12**
- **Found during:** Task 1 build
- **Issue:** NU1903 high-severity CVE GHSA-2cmq-823j-5qj8 and NU1902 moderate GHSA-rxmq-m78w-7wmc flagged 3.1.5
- **Fix:** `dotnet add package SixLabors.ImageSharp --version 3.1.12`
- **Files:** src/NossoVizinho.Api/NossoVizinho.Api.csproj
- **Commit:** 29e77b5

**2. [Rule 3 - Blocking] Plan assumed `int` FK for Verification.UserId**
- **Issue:** Phase 01 User.Id is Guid, not int
- **Fix:** Verification.UserId typed as Guid; same for ReviewedByUserId
- **Commit:** 29e77b5

## Deployment Notes

- GitHub Actions `deploy-backend` auto-deploys on push to master.
- EF migration is applied automatically on SmarterASP at startup via `db.Database.Migrate()` in Program.cs — no manual SQL script needed.
- If startup migration fails (e.g., DB user lacks DDL perms), generate SQL script manually:
  `dotnet ef migrations script 20260407102834_InitialCreate 20260407182729_AddBairrosAndVerifications --project src/NossoVizinho.Api --idempotent -o migration.sql`
- `wwwroot/uploads/proofs/` directory will be auto-created by FileStorageService on first submit. SmarterASP IIS app pool needs write permission to that path.

## Known Stubs

None. All endpoints wired to real services and EF queries.

## Verification

- `dotnet build src/NossoVizinho.Api` — passes (1 pre-existing warning in ExceptionHandlerMiddleware, out of scope)
- Migration file `20260407182729_AddBairrosAndVerifications.cs` exists
- All 12 Vila Velha bairros present in seed
- CepLookupService contains both `viacep.com.br` and `brasilapi.com.br` endpoints
- FileStorageService enforces 5 * 1024 * 1024 byte limit and uses SixLabors.ImageSharp
- Program.cs registers HttpClient<ICepLookupService>, IMemoryCache, Admin policy with `is_admin` claim
- shared-types exports new verification module

## Self-Check: PASSED
