---
phase: 06-polish-deploy
plan: 02
subsystem: ui
tags: [next-themes, dark-mode, tailwind-v4, google-oauth, totp, magic-link, whatsapp-share, lgpd, og-metadata, zustand]

# Dependency graph
requires:
  - phase: 06-polish-deploy/01
    provides: "Backend auth endpoints (Google OAuth, magic link, TOTP, LGPD export/delete)"
  - phase: 06-polish-deploy/01b
    provides: "Vouching, verification endpoints"
provides:
  - "Dark mode toggle with next-themes and Tailwind v4 custom variant"
  - "Google Sign-In button on login AND register pages"
  - "TOTP verification gate after login"
  - "Magic link passwordless login page"
  - "OAuth/magic-link callback handler"
  - "WhatsApp share buttons on posts and listings"
  - "Public preview routes /p/[postId] and /m/[listingId] with OG metadata"
  - "LGPD settings page with data export and account deletion"
  - "Digest notification opt-out toggle"
affects: [06-polish-deploy/03, 06-polish-deploy/04]

# Tech tracking
tech-stack:
  added: [next-themes@0.4.6]
  patterns: [Tailwind v4 @custom-variant dark, Providers wrapper for client context, Suspense boundary for useSearchParams]

key-files:
  created:
    - frontend/src/components/Providers.tsx
    - frontend/src/components/ThemeToggle.tsx
    - frontend/src/components/WhatsAppShareButton.tsx
    - frontend/src/app/(auth)/auth/callback/page.tsx
    - frontend/src/app/(auth)/auth/magic-link/page.tsx
    - frontend/src/app/p/[postId]/page.tsx
    - frontend/src/app/p/[postId]/PostPreviewClient.tsx
    - frontend/src/app/m/[listingId]/page.tsx
    - frontend/src/app/m/[listingId]/ListingPreviewClient.tsx
    - frontend/src/app/(main)/profile/settings/page.tsx
    - frontend/src/stores/settings-store.ts
    - frontend/public/og-default.png
  modified:
    - frontend/src/app/globals.css
    - frontend/src/app/layout.tsx
    - frontend/src/components/layouts/MainHeader.tsx
    - frontend/src/components/forms/LoginForm.tsx
    - frontend/src/components/forms/RegisterForm.tsx
    - frontend/src/components/features/feed/PostCard.tsx
    - frontend/src/components/features/marketplace/ListingCard.tsx
    - frontend/src/app/(main)/profile/page.tsx
    - frontend/package.json

key-decisions:
  - "Providers.tsx wrapper for ThemeProvider to avoid server/client boundary issues in layout.tsx"
  - "Suspense boundaries required for useSearchParams in Next.js 16 static export (callback + magic-link pages)"
  - "Dark theme uses CSS variable overrides in .dark class (slate-900 bg, slate-100 fg, green-400 primary)"
  - "WhatsApp share uses wa.me deep link (no SDK dependency)"

patterns-established:
  - "@custom-variant dark for Tailwind v4 class-based dark mode"
  - "Suspense wrapper pattern for pages using useSearchParams in static export"
  - "Public preview route pattern: server page.tsx (metadata + generateStaticParams) + client *Client.tsx"

requirements-completed: [AUTH-009, AUTH-013, AUTH-014, UXDS-02, SHAR-01, SHAR-02, SHAR-03, LGPD-02, LGPD-03, NOTF-01]

# Metrics
duration: 9min
completed: 2026-04-12
---

# Phase 06 Plan 02: Frontend Web Summary

**Dark mode with next-themes + Tailwind v4, Google OAuth on login/register, TOTP gate, magic link, WhatsApp share buttons, public preview routes with OG metadata, LGPD settings page**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-12T19:02:30Z
- **Completed:** 2026-04-12T19:11:00Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Dark mode fully wired: Tailwind v4 @custom-variant, next-themes provider, toggle in nav header with sun/moon icons
- Auth pages extended: Google Sign-In on both login and register, TOTP 6-digit gate after login, magic link passwordless flow
- Public preview routes /p/[postId] and /m/[listingId] with OG metadata and signup CTA for non-logged users
- WhatsApp share buttons on PostCard and ListingCard with wa.me deep links
- LGPD settings page with data export download, account deletion with 30-day grace period confirmation, and digest opt-out toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Dark mode (next-themes + Tailwind v4) and theme toggle in nav** - `1d8cbb1` (feat)
2. **Task 2: Auth page extensions, public previews, WhatsApp share, LGPD settings** - `2f3c320` (feat)

## Files Created/Modified
- `frontend/src/components/Providers.tsx` - Client wrapper for ThemeProvider
- `frontend/src/components/ThemeToggle.tsx` - Sun/moon toggle with mounted guard
- `frontend/src/app/globals.css` - @custom-variant dark + .dark CSS variables
- `frontend/src/app/layout.tsx` - suppressHydrationWarning + Providers wrapper
- `frontend/src/components/layouts/MainHeader.tsx` - ThemeToggle added to nav
- `frontend/src/components/forms/LoginForm.tsx` - Google button, TOTP gate, magic link option
- `frontend/src/components/forms/RegisterForm.tsx` - Google button with "ou" divider
- `frontend/src/app/(auth)/auth/callback/page.tsx` - OAuth/magic-link token consumer with Suspense
- `frontend/src/app/(auth)/auth/magic-link/page.tsx` - Passwordless email link request with Suspense
- `frontend/src/components/WhatsAppShareButton.tsx` - Reusable wa.me deep link button
- `frontend/src/components/features/feed/PostCard.tsx` - WhatsApp share in footer
- `frontend/src/components/features/marketplace/ListingCard.tsx` - WhatsApp share in card
- `frontend/src/app/p/[postId]/page.tsx` - Server page with OG metadata + generateStaticParams
- `frontend/src/app/p/[postId]/PostPreviewClient.tsx` - Client-side post preview with CTA
- `frontend/src/app/m/[listingId]/page.tsx` - Server page with OG metadata + generateStaticParams
- `frontend/src/app/m/[listingId]/ListingPreviewClient.tsx` - Client-side listing preview with CTA
- `frontend/src/app/(main)/profile/settings/page.tsx` - LGPD export + deletion + digest opt-out
- `frontend/src/stores/settings-store.ts` - Zustand store for user settings/digest preference
- `frontend/src/app/(main)/profile/page.tsx` - Added settings link
- `frontend/public/og-default.png` - 1200x630 green branded OG image

## Decisions Made
- Created Providers.tsx wrapper component rather than making layout.tsx a client component (preserves server component benefits for root layout)
- Used Suspense boundaries around useSearchParams usage in callback and magic-link pages (required by Next.js 16 static export)
- Dark theme palette: slate-900 bg, slate-100 fg, green-400 primary (high contrast, accessible)
- WhatsApp share uses wa.me deep link rather than WhatsApp Business API (zero dependencies, works everywhere)
- OG default image is a minimal programmatic PNG (no image generation dependency needed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Suspense boundaries for useSearchParams**
- **Found during:** Task 2 (auth callback/magic-link pages)
- **Issue:** Next.js 16 static export requires useSearchParams to be wrapped in Suspense boundary
- **Fix:** Extracted component logic into inner component wrapped with Suspense fallback
- **Files modified:** frontend/src/app/(auth)/auth/callback/page.tsx, frontend/src/app/(auth)/auth/magic-link/page.tsx
- **Verification:** pnpm build succeeds with both pages generating as static content
- **Committed in:** 2f3c320

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for Next.js 16 static export compatibility. No scope creep.

## Issues Encountered
None beyond the Suspense boundary requirement.

## Known Stubs
None - all components wire to real API endpoints. The OG default image is a minimal branded PNG (sufficient for social sharing).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All frontend web features for Phase 6 are complete and build-verified
- Ready for mobile plan (06-03) and deployment plan (06-04)
- Google OAuth requires backend GOOGLE_CLIENT_ID/SECRET configuration (done in 06-01)

## Self-Check: PASSED

All 13 created files verified on disk. Both task commits (1d8cbb1, 2f3c320) verified in git log.

---
*Phase: 06-polish-deploy*
*Completed: 2026-04-12*
