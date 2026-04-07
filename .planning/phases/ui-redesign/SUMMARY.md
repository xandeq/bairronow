---
phase: ui-redesign
completed: 2026-04-07
plans: [ui-01, ui-02, ui-03, ui-04]
build_status: success
---

# UI Redesign Phase — Summary

Flat, bold, zero-shadow design system applied end-to-end across the BairroNow frontend, plus auth refactor, onboarding flow, and Phase 2 feed/profile/marketplace stubs.

## Sub-Plans

### UI-01 — Design System Foundation
**Commit:** `0ab8862`
- Replaced `src/app/globals.css` with Tailwind v4 `@theme inline` block defining all color/font/radius tokens. Removed dark-mode media query and undefined `--font-geist-*` references. Added a global `* { box-shadow: none !important }` to enforce the zero-shadow rule even if a stray `shadow-*` utility leaks in.
- Updated `src/app/layout.tsx` to load **Outfit** via `next/font/google` (weights 400/500/600/700/800) instead of Inter. Removed the old global header/footer chrome — layouts are now per-route via `AuthLayout` / `PageLayout`.
- Created `src/styles/tokens.ts` exporting design tokens as JS constants for use in non-Tailwind contexts.

**Tailwind v4 deviation:** The plan originally specified creating `tailwind.config.ts`. Tailwind v4 uses `@theme` in CSS instead — `tailwind.config.ts` is no longer the canonical place for tokens. Tokens were defined in `globals.css` as instructed by the executor brief.

### UI-02 — UI Component Library + Layouts
**Commit:** `c411f51`
- `src/components/ui/Button.tsx` — variants `primary | secondary | outline`, sizes `sm | md | lg`, `loading`, `fullWidth`, hover scale-105. `forwardRef`.
- `src/components/ui/Input.tsx` — flat muted bg, focus → white bg + primary border. Error state. `forwardRef`.
- `src/components/ui/Card.tsx` — flat color-blocked container, `interactive` prop adds hover scale-[1.02], `bgColor` (white/muted/primary/secondary/accent), `padding` (sm/md/lg).
- `src/components/ui/FormField.tsx` — wraps label + Input + error message, `forwardRef` (RHF compatible).
- `src/components/ui/Badge.tsx` — accent/primary/secondary/muted variants.
- `src/components/ui/Decorative.tsx` — `DecorativeCircle`, `DecorativeSquare`, and a default `Decorative` component that composes them as absolute-positioned background shapes for hero/auth scenes.
- Layouts: `AuthLayout` (centered card + decorative bg), `PageLayout` (header + main + footer), `AuthHeader`, `MainHeader` (with logout), `Footer`.

### UI-03 — Auth Refactor + Onboarding
**Commit:** `c9747d9`
- **Refactored** `LoginForm` and `RegisterForm` to use `FormField` + `Button` (zero inline form styling, Zod schemas preserved).
- **Extracted** the previously inline `forgot-password` and `reset-password` forms into `ForgotPasswordForm.tsx` and `ResetPasswordForm.tsx` so the page files become thin shells over `AuthLayout`.
- **All 4 auth pages** now use `AuthLayout` with title + subtitle.
- `src/lib/cep-service.ts` — ViaCEP primary, BrasilAPI fallback (returns lat/lng when available), `formatCep()` helper for the `00000-000` mask.
- `src/lib/onboarding.ts` — Zustand store with `persist` + `createJSONStorage(localStorage)` middleware. State: `step | cep | address | proofFileName | proofStatus`.
- `src/lib/auth.ts` — **upgraded** to use `persist` middleware so the auth-gated `(main)` layout can detect a logged-in user across reloads.
- `src/types/onboarding.ts` — `CepAddress`, `ProofStatus`, `OnboardingStep`.
- `src/components/forms/CEPForm.tsx` — masked CEP input, lookup button, address preview card, confirm-and-continue navigation.
- `src/components/forms/ProofUploadForm.tsx` — drag-and-drop file zone (no `react-dropzone` dependency — see deviation), 5MB / image+PDF validation, preview thumbnail.
- 3 onboarding pages under `src/app/(onboarding)/{cep-lookup,proof-upload,pending}/page.tsx`, each wrapped in `AuthLayout`.

**Deviation: react-dropzone not installed.** Built a native HTML5 drag-and-drop handler in `ProofUploadForm` instead. Same UX (drag, drop, click to browse, preview, validation) but zero new dependencies — appropriate for the shared-hosting + minimal-deps constraint.

### UI-04 — Phase 2 Feed Stubs + Main Layout
**Commit:** `750ac31`
- `src/types/feed.ts` — `Author`, `Post`, `Comment`, `Listing` stub types.
- `src/components/features/feed/PostCard.tsx` — flat interactive card with author avatar (initial), verified badge, relative timestamp, like/comment counts.
- `src/components/features/feed/FeedList.tsx` — renders an array of `PostCard`, empty state.
- `src/components/features/profile/ProfileCard.tsx` — avatar (initial), name, bairro, verified badge.
- `src/components/features/marketplace/ListingCard.tsx` — image placeholder, title, BRL price, seller info.
- `src/app/(main)/layout.tsx` — `'use client'`, wraps `PageLayout`, redirects to `/login/` if `useAuthStore` is not authenticated (waits one tick for zustand-persist hydration).
- `src/app/(main)/feed/page.tsx` — 4 stub posts in pt-BR (Vila Velha bairros).
- `src/app/(main)/profile/page.tsx` — pulls user from auth store, renders `ProfileCard` + edit/settings buttons.
- `src/app/(main)/marketplace/page.tsx` — grid of 4 stub listings (responsive 2/3/4 cols).
- `src/app/page.tsx` — root redirects to `/feed/` if authenticated, else `/login/`.

## Files Created (33)

Tokens & layout:
- `frontend/src/styles/tokens.ts`
- `frontend/src/app/layout.tsx` (modified)
- `frontend/src/app/globals.css` (modified)
- `frontend/src/app/page.tsx` (modified)

UI components (6):
- `frontend/src/components/ui/{Button,Input,Card,FormField,Badge,Decorative}.tsx`

Layouts (5):
- `frontend/src/components/layouts/{AuthLayout,PageLayout,AuthHeader,MainHeader,Footer}.tsx`

Forms (4 new + 2 refactored):
- new: `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `CEPForm.tsx`, `ProofUploadForm.tsx`
- refactored: `LoginForm.tsx`, `RegisterForm.tsx`

Auth pages (4 modified):
- `frontend/src/app/(auth)/{login,register,forgot-password,reset-password}/page.tsx`

Onboarding pages (3 new):
- `frontend/src/app/(onboarding)/{cep-lookup,proof-upload,pending}/page.tsx`

Main app (4 new):
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/app/(main)/{feed,profile,marketplace}/page.tsx`

Feature components (4 new):
- `frontend/src/components/features/feed/{PostCard,FeedList}.tsx`
- `frontend/src/components/features/profile/ProfileCard.tsx`
- `frontend/src/components/features/marketplace/ListingCard.tsx`

Lib & types (5 new/modified):
- new: `frontend/src/lib/cep-service.ts`, `frontend/src/lib/onboarding.ts`, `frontend/src/types/onboarding.ts`, `frontend/src/types/feed.ts`
- modified: `frontend/src/lib/auth.ts` (added persist middleware)

## Build Status

`npm run build` — **SUCCESS** (Next.js 16.2.2 Turbopack, static export). All 13 routes prerender as static content:

```
/, /_not-found, /cep-lookup, /feed, /forgot-password, /login,
/marketplace, /pending, /privacy-policy, /profile, /proof-upload,
/register, /reset-password
```

TypeScript clean. No lint errors. No console warnings.

## Constraint Verification

- **Zero box-shadows:** verified — `grep -rn "shadow-" src/` returns only `--shadow-none: none` in `globals.css` (the design token declaration). Plus a global `* { box-shadow: none !important }` enforces it at runtime.
- **No hardcoded hex colors in components:** all colors via Tailwind classes mapped to `@theme` tokens (`bg-primary`, `text-fg`, `border-border`, etc.).
- **Mobile-first responsive:** marketplace grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, headers collapse nav gaps with `gap-2 sm:gap-6`.
- **API contracts unchanged:** `lib/api.ts` not modified. `lib/auth.ts` only gained `persist` middleware around the existing store shape — same `login/logout/setAccessToken/setUser` API.
- **Portuguese error messages:** all Zod schemas and form errors in pt-BR.

## Deviations

1. **Tailwind v4 token approach** — Plan said `tailwind.config.ts`; reality is Tailwind v4 uses `@theme` in CSS. Followed executor brief and put tokens in `globals.css`. (Rule 3 — blocking technical correction.)
2. **react-dropzone not installed** — Built native HTML5 drag-and-drop in `ProofUploadForm`. Same UX, one fewer dependency. (Rule 3 — kept dependency tree minimal for shared hosting.)
3. **Auth store gained persist middleware** — Required by `(main)/layout.tsx` auth gate to survive page reloads. The plan implied auth check via Zustand without specifying persistence; this is the only way it actually works after F5. (Rule 2 — missing critical functionality.)
4. **Removed global header/footer from `app/layout.tsx`** — The old root layout had a hardcoded green header and footer that conflicted with `AuthLayout` and `PageLayout`. Per-route layouts replace it.

## Commits

| Plan  | Hash      | Message                                                                                                  |
| ----- | --------- | -------------------------------------------------------------------------------------------------------- |
| UI-01 | `0ab8862` | feat(ui-01): design system foundation — Outfit font, design tokens, flat globals                         |
| UI-02 | `c411f51` | feat(ui-02): UI component library + layouts (Button/Input/Card/FormField/Badge/Decorative + Auth/Page)   |
| UI-03 | `c9747d9` | feat(ui-03): refactor auth pages + add onboarding flow (CEP lookup, proof upload, pending)               |
| UI-04 | `750ac31` | feat(ui-04): Phase 2 feed/profile/marketplace stubs + main layout + auth-gated routing                   |

## Next Steps

- Visual QA on the live build (DEV server or static export served)
- Wire onboarding `pending` page to a real verification API once backend supports it
- Implement actual feed/profile/marketplace endpoints (current data is stubbed)
- Consider removing the global `* { box-shadow: none !important }` once team agrees no shadows will ever sneak in via 3rd-party components

## Self-Check: PASSED

- All commits exist on `master` (verified via `git log`)
- All listed files created (verified during execution)
- Build clean (`npm run build` exit 0)
- Zero stray `shadow-*` utility usages outside the design token declaration
