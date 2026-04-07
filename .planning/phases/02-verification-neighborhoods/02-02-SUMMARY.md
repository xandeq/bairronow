---
phase: 02-verification-neighborhoods
plan: 02
subsystem: frontend
tags: [verification, onboarding, profile, admin, web, react-dropzone]
dependency_graph:
  requires:
    - "02-01 backend (CEP, verification, profile, admin endpoints + DTOs)"
  provides:
    - "Web user onboarding fully wired against real api.bairronow.com.br"
    - "Admin verification queue UI"
    - "Profile view+edit + VerifiedBadge"
    - "useVerificationPolling hook"
    - "createVerificationApi/createProfileApi/createAdminVerificationApi shared client factories"
  affects:
    - "shared-api-client (createCepApi signature change: now requires AxiosInstance)"
    - "mobile/src/lib/api.ts (updated to match new createCepApi signature)"
tech-stack:
  added:
    - "react-dropzone ^15"
    - "browser-image-compression ^2"
  patterns:
    - "Shared API client factories instantiated once in frontend/src/lib/api.ts"
    - "Polling via useEffect+setInterval cleanup pattern"
    - "Zustand onboarding store extended with VerificationStatusDto cache"
key-files:
  created:
    - frontend/src/components/VerifiedBadge.tsx
    - frontend/src/components/ProofDropzone.tsx
    - frontend/src/lib/verification.ts
    - frontend/src/app/(main)/admin/verifications/page.tsx
    - .planning/phases/02-verification-neighborhoods/02-02-SUMMARY.md
  modified:
    - packages/shared-api-client/src/index.ts
    - packages/shared-validators/src/index.ts
    - frontend/src/lib/api.ts
    - frontend/src/lib/onboarding.ts
    - frontend/src/app/(onboarding)/cep-lookup/page.tsx
    - frontend/src/app/(onboarding)/proof-upload/page.tsx
    - frontend/src/app/(onboarding)/pending/page.tsx
    - frontend/src/app/(main)/profile/page.tsx
    - frontend/package.json
    - mobile/src/lib/api.ts
  deleted:
    - frontend/src/components/forms/CEPForm.tsx
    - frontend/src/components/forms/ProofUploadForm.tsx
decisions:
  - "Onboarding pages converted from server-component+form to single client pages (no separate form component) — fewer files, all state colocated"
  - "Old CEPForm/ProofUploadForm deleted instead of refactored — they referenced removed cep-service helpers and CepAddress type"
  - "ProofDropzone returns one File via onFile prop; parent owns FormData construction"
  - "Pending page polls every 5s; approved triggers a 2s setTimeout redirect to /feed for UX clarity"
  - "Admin reject UX uses window.prompt for reason — minimal, replaceable later with modal"
  - "Mobile createCepApi() call updated to pass apiClient — required by signature change"
metrics:
  duration: "~12min"
  completed: "2026-04-07"
---

# Phase 02 Plan 02: Web Onboarding + Admin Queue + Verified Badge Summary

Wired the entire Next.js trust loop against the real Phase 2 backend: backend-proxied CEP lookup, multipart proof upload with image compression, live status polling, profile view/edit with verified badge, and an admin review queue. Removed the last ViaCEP-direct call from shared-api-client and added three new shared API factories that mobile can also reuse.

## Commits

| Task | Commit  | Description                                                           |
| ---- | ------- | --------------------------------------------------------------------- |
| 1    | 93a8e29 | shared-api-client + shared-validators: verification factories, schemas |
| 2    | d8409e3 | frontend pages/components + mobile cepApi signature update             |

## What Shipped

### Shared packages
- `createCepApi(client)` now hits `/api/v1/cep/{cep}` (was viacep.com.br direct).
- `createVerificationApi(client)` — submit (multipart), getMyStatus.
- `createProfileApi(client)` — getMe, updateMe.
- `createAdminVerificationApi(client)` — listPending, approve, reject, getProofUrl.
- `proofUploadSchema`, `updateProfileSchema` zod schemas.

### Frontend
- `lib/api.ts` instantiates and exports all 4 new API clients alongside the existing axios instance.
- `lib/verification.ts` exposes `useVerificationPolling(intervalMs)`.
- `lib/onboarding.ts` extended with `status: VerificationStatusDto | null` + `setStatus`.
- `components/VerifiedBadge.tsx` — green pill with check icon and "Vizinho verificado" label.
- `components/ProofDropzone.tsx` — react-dropzone + browser-image-compression, 5MB cap, image/pdf accept.
- `app/(onboarding)/cep-lookup/page.tsx` — converted to client page; uses cepApi; warns if `bairroId === null`.
- `app/(onboarding)/proof-upload/page.tsx` — multipart POST to verificationApi.submit, then push /pending.
- `app/(onboarding)/pending/page.tsx` — polls every 5s; approved → 2s → /feed; rejected → reason + retry button.
- `app/(main)/profile/page.tsx` — real getMe/updateMe with edit toggle + VerifiedBadge.
- `app/(main)/admin/verifications/page.tsx` — pending queue table with approve/reject/proof link; 403 shows "Acesso negado".

### Mobile
- `mobile/src/lib/api.ts` updated to pass `apiClient` into `createCepApi` (signature change in shared package).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mobile broken by createCepApi signature change**
- **Found during:** Task 2 mobile typecheck after frontend build was green
- **Issue:** `createCepApi()` no longer takes zero args; mobile/src/lib/api.ts called it with no arguments
- **Fix:** Pass existing `apiClient` instance
- **Files:** mobile/src/lib/api.ts
- **Commit:** d8409e3

**2. [Rule 3 - Blocking] Legacy CEPForm/ProofUploadForm broke typecheck**
- **Found during:** Task 2 frontend typecheck
- **Issue:** Legacy form components referenced `CepAddress` and the old onboarding store shape; the store now uses `CepLookupResult`
- **Fix:** Deleted both files (no longer imported by any page; pages now own their own state)
- **Files:** frontend/src/components/forms/CEPForm.tsx, frontend/src/components/forms/ProofUploadForm.tsx
- **Commit:** d8409e3

**3. [Rule 3 - Blocking] react-dropzone v15 FileRejection type**
- **Found during:** Task 2 frontend typecheck
- **Issue:** Hand-typed reject callback signature mismatched `(File[], FileRejection[], DropEvent) => void`
- **Fix:** Imported `FileRejection` from `react-dropzone` and used the exported type
- **Files:** frontend/src/components/ProofDropzone.tsx
- **Commit:** d8409e3

**4. [Rule 3 - Blocking] Badge variant mismatch**
- **Found during:** Authoring pending page
- **Issue:** Used `variant="success"` and `variant="danger"` which the Badge component does not support (only primary/secondary/accent/muted)
- **Fix:** Mapped success→primary and danger→secondary
- **Files:** frontend/src/app/(onboarding)/pending/page.tsx
- **Commit:** d8409e3

## Verification

### Automated (passed)
- `pnpm --filter @bairronow/frontend exec tsc --noEmit` — exit 0
- `pnpm --filter @bairronow/frontend build` — exit 0, all 16 routes statically generated including /admin/verifications, /profile, /cep-lookup, /proof-upload, /pending
- `pnpm --filter mobile exec tsc --noEmit` — exit 0
- `grep` checks for all required identifiers in generated files — pass
- `grep "viacep.com.br" packages/shared-api-client/src/index.ts` — empty (ViaCEP-direct fully removed)

### Manual smoke (deferred — separate human-verify wave)
1. Visit /cep-lookup, enter Vila Velha CEP (29101-160) → sees bairro chip, continues
2. Upload test JPG on /proof-upload → /pending shows spinner
3. Toggle is_admin in DB, visit /admin/verifications → see entry → click Approve
4. /pending auto-redirects to /feed, profile shows Verified badge

## Known Stubs

None. Every page consumes a real API endpoint. The admin reject UX uses `window.prompt` (intentional MVP simplification — replaceable with a modal in a later polish wave).

## Self-Check: PASSED

- Created files exist:
  - frontend/src/components/VerifiedBadge.tsx — FOUND
  - frontend/src/components/ProofDropzone.tsx — FOUND
  - frontend/src/lib/verification.ts — FOUND
  - frontend/src/app/(main)/admin/verifications/page.tsx — FOUND
- Commits exist:
  - 93a8e29 — FOUND
  - d8409e3 — FOUND
