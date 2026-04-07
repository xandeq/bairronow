---
phase: 02-verification-neighborhoods
plan: 03
subsystem: mobile-onboarding
tags: [mobile, expo, react-native, verification, onboarding]
requires:
  - 02-01 (backend verification API + shared DTOs)
  - 02-02 (shared client factories: createVerificationApi, createProfileApi, backend-proxied createCepApi)
provides:
  - mobile verification onboarding parity (CEP → proof → pending → profile)
  - reusable VerifiedBadge + ProofPicker RN components
  - useVerificationPolling hook
affects:
  - mobile/app/* onboarding screens
  - mobile/src/lib api wiring
tech-stack:
  added:
    - expo-document-picker ~14.0.8
    - expo-image-manipulator ~14.0.8
  patterns:
    - zustand persist via AsyncStorage for onboarding state
    - React Native FormData multipart with `{uri,name,type}` asset shape
    - polling hook with cancel-on-unmount via useRef
key-files:
  created:
    - mobile/src/lib/onboarding-store.ts
    - mobile/src/lib/verification-polling.ts
    - mobile/src/components/VerifiedBadge.tsx
    - mobile/src/components/ProofPicker.tsx
    - mobile/app/profile.tsx
  modified:
    - mobile/src/lib/api.ts
    - mobile/app/cep-lookup.tsx
    - mobile/app/proof-upload.tsx
    - mobile/app/pending.tsx
    - mobile/app/_layout.tsx
    - mobile/package.json
    - mobile/app.json
decisions:
  - Use AsyncStorage (not SecureStore) for onboarding persist — non-secret state, AsyncStorage size limits aren't an issue.
  - Compress images client-side via expo-image-manipulator (resize 1600px, JPEG q=0.8) to keep uploads under 5MB.
  - Add deps directly to mobile/package.json (pinned to expo SDK 54 versions ~14.0.8) since `npx expo install` requires `pnpm` on PATH which corepack doesn't expose globally.
metrics:
  duration: ~25min
  tasks: 2
  files-changed: 13
  completed: 2026-04-07
---

# Phase 02 Plan 03: Mobile Verification Onboarding Summary

Mobile feature parity for the verification flow on Expo/React Native, fully wired against the real backend API and the shared monorepo client.

## What shipped

- **api.ts** now exports `cepApi`, `verificationApi`, `profileApi` built from `@bairronow/shared-api-client` factories with the same authenticated axios client used by `authApi`. ViaCEP-direct usage removed.
- **onboarding-store.ts** — zustand store (persisted to AsyncStorage) tracking `address: CepLookupResult | null` and `status: VerificationStatusDto | null`.
- **verification-polling.ts** — `useVerificationPolling(enabled, intervalMs=5000)` hook polling `/api/v1/verification/me`, with proper unmount cancellation via `useRef`.
- **VerifiedBadge.tsx** — small RN pill, green "Verificado ✓" or grey "Não verificado".
- **ProofPicker.tsx** — three-button picker (library / camera / PDF) using `expo-image-picker` + `expo-document-picker`. Images run through `ImageManipulator.manipulateAsync` (1600w / 0.8 JPEG). Enforces 5 MB limit with `Alert`.
- **cep-lookup.tsx** — backend `cepApi.lookup`, stores result, warns when `bairroId == null` ("Ainda não atendemos este bairro") but still allows continue.
- **proof-upload.tsx** — uses `ProofPicker`, builds `FormData` with `cep`, optional `numero`, and `proof: { uri, name, type } as any` (RN multipart pattern). On success replaces to `/pending`.
- **pending.tsx** — drives `useVerificationPolling`, renders distinct UI per `pending | approved | rejected`, auto-navigates to `/feed` 2s after approval, offers retry on rejection.
- **profile.tsx** (new) — `profileApi.getMe()` on mount, editable `displayName` + `bio`, shows `<VerifiedBadge>` and bairro name, saves via `profileApi.updateMe`.
- **_layout.tsx** — registers `profile` route in the Stack.
- **app.json** — added iOS `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` strings in PT-BR.

## Verification

- `pnpm --filter mobile exec tsc --noEmit` exits 0 (zero output, zero errors) on both task commits.
- Manual smoke deferred to mobile-build.yml workflow_dispatch (EAS preview build) — not triggered per user instruction.

## Commits

| Commit  | Task                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| f8caefe | feat(02-03): mobile api wiring + onboarding store + ProofPicker + VerifiedBadge |
| d206355 | feat(02-03): rewire mobile onboarding screens + profile against real API      |

## Deviations from Plan

None — both tasks executed exactly as planned.

## Known Stubs

None.

## Follow-ups

- Trigger `mobile-build.yml` workflow_dispatch when ready for EAS preview build (requires `EXPO_TOKEN` secret).
- Real-device smoke against bairronow.com.br API for the full CEP → proof → admin-approve → badge cycle.
