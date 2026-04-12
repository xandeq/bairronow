---
phase: 06-polish-deploy
plan: 03
subsystem: mobile
tags: [expo, react-native, dark-mode, google-oauth, whatsapp, lgpd, async-storage]

# Dependency graph
requires:
  - phase: 06-01
    provides: "Backend auth endpoints (magic-link, LGPD export/delete)"
  - phase: 06-01b
    provides: "POST /api/v1/auth/google/mobile endpoint for id_token exchange"
provides:
  - "Mobile dark mode with ThemeContext + AsyncStorage persistence + nav header toggle"
  - "Mobile Google OAuth via expo-auth-session exchanging id_token via backend mobile endpoint"
  - "Mobile magic link request screen"
  - "Mobile deep link auth callback"
  - "Mobile WhatsApp share via Linking API with fallback"
  - "Mobile Settings screen with 3-mode theme picker"
  - "Mobile LGPD screen with data export and account deletion"
affects: [mobile-testing, deployment]

# Tech tracking
tech-stack:
  added: [expo-crypto, expo-auth-session, expo-web-browser, expo-file-system, expo-sharing, "@expo/vector-icons"]
  patterns: [ThemeContext with AsyncStorage persistence, ThemeToggleButton in nav header, feature-folder screens with Expo Router re-exports]

key-files:
  created:
    - mobile/src/theme/ThemeContext.tsx
    - mobile/src/theme/colors.ts
    - mobile/app/magic-link.tsx
    - mobile/app/auth-callback.tsx
    - mobile/app/settings.tsx
    - mobile/app/lgpd.tsx
    - mobile/src/features/share/utils/share.ts
    - mobile/src/features/share/components/WhatsAppShareButton.tsx
    - mobile/src/features/settings/screens/SettingsScreen.tsx
    - mobile/src/features/settings/screens/LgpdScreen.tsx
  modified:
    - mobile/app/_layout.tsx
    - mobile/app/login.tsx
    - mobile/app/marketplace/[id].tsx
    - mobile/package.json

key-decisions:
  - "expo-file-system v55 uses class-based API (File/Directory), used RN Share.share() instead of FileSystem.downloadAsync for LGPD export"
  - "ThemeToggleButton as separate component to use useTheme() inside ThemeProvider context"
  - "TOTP gate handled inline in LoginScreen with temp token flow"

patterns-established:
  - "ThemeContext pattern: system/light/dark modes, AsyncStorage key 'theme_mode', useTheme() hook"
  - "Route re-export pattern: app/settings.tsx re-exports from src/features/settings/screens/SettingsScreen"
  - "WhatsApp share: Linking.openURL whatsapp://send with fallback to Share.share"

requirements-completed: [AUTH-013, AUTH-014, UXDS-02, SHAR-01, SHAR-02, LGPD-02, LGPD-03]

# Metrics
duration: 9min
completed: 2026-04-12
---

# Phase 06 Plan 03: Mobile Expo Polish Summary

**Dark mode with nav toggle + Google OAuth via expo-auth-session + WhatsApp share + LGPD data export/deletion for Expo mobile app**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-12T19:14:20Z
- **Completed:** 2026-04-12T19:23:30Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Dark mode theme context with AsyncStorage persistence and system/light/dark modes, with toggle button (sun/moon icon) in navigation header across all screens
- Google OAuth flow via expo-auth-session that exchanges id_token through POST /api/v1/auth/google/mobile, plus TOTP gate handling
- Magic link request screen and deep link auth callback screen (bairronow://auth/callback?token=)
- WhatsApp share button integrated into listing detail screen with Linking API and system share fallback
- Settings screen with 3-mode dark theme picker (Claro/Escuro/Sistema) and digest notification placeholder
- LGPD screen with data export via Share API and account deletion request with 30-day cancellation window

## Task Commits

Each task was committed atomically:

1. **Task 1: Dark mode theme context + Google OAuth + magic link screens** - `1a3945e` (feat)
2. **Task 2: WhatsApp share + LGPD settings screens** - `27fc397` (feat)

## Files Created/Modified
- `mobile/src/theme/ThemeContext.tsx` - Dark mode context provider with AsyncStorage persistence
- `mobile/src/theme/colors.ts` - Light and dark color palettes (green-700/green-400 primary)
- `mobile/app/_layout.tsx` - Root layout wrapped with ThemeProvider, ThemeToggleButton in header
- `mobile/app/login.tsx` - Google OAuth via expo-auth-session, TOTP gate, magic link navigation
- `mobile/app/magic-link.tsx` - Email input, POST to /api/v1/auth/magic-link/request
- `mobile/app/auth-callback.tsx` - Deep link handler for magic link verification
- `mobile/app/settings.tsx` - Route re-export for SettingsScreen
- `mobile/app/lgpd.tsx` - Route re-export for LgpdScreen
- `mobile/src/features/share/utils/share.ts` - WhatsApp share via Linking API with fallback
- `mobile/src/features/share/components/WhatsAppShareButton.tsx` - Green WhatsApp share button
- `mobile/src/features/settings/screens/SettingsScreen.tsx` - Theme 3-mode picker + LGPD link
- `mobile/src/features/settings/screens/LgpdScreen.tsx` - Data export + account deletion
- `mobile/app/marketplace/[id].tsx` - WhatsApp share button integrated
- `mobile/package.json` - Added expo-crypto, expo-auth-session, expo-web-browser, expo-file-system, expo-sharing, @expo/vector-icons

## Decisions Made
- Used RN Share.share() for LGPD data export instead of expo-file-system v55 class-based API (documentDirectory no longer exists in v55)
- Extracted ThemeToggleButton as separate component to avoid useTheme() call outside ThemeProvider context boundary
- TOTP gate handled inline in LoginScreen with tempToken state rather than a separate screen

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] expo-file-system v55 API change**
- **Found during:** Task 2 (LGPD screen)
- **Issue:** `FileSystem.documentDirectory` and `FileSystem.writeAsStringAsync` do not exist in expo-file-system v55 (class-based API)
- **Fix:** Replaced with React Native's built-in `Share.share()` to share exported JSON as text
- **Files modified:** mobile/src/features/settings/screens/LgpdScreen.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 27fc397

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal - used native RN Share API instead of expo-file-system. Same user experience.

## Issues Encountered
- pnpm not on PATH in bash shell - resolved by using `npx pnpm` wrapper
- Pre-existing TypeScript errors in groups/map/chat test files (from earlier phases) - not caused by this plan, ignored

## Known Stubs
- `SettingsScreen.tsx` digest notification toggle shows "Em breve" - notification preference API not yet implemented (future plan)
- `LoginScreen.tsx` GOOGLE_CLIENT_ID reads from `Constants.expoConfig?.extra?.googleClientId` which defaults to empty string - requires app.json config with actual client ID before Google OAuth works in production

## User Setup Required
None - no external service configuration required for development. Google OAuth requires a valid `googleClientId` in app.json extra config for production.

## Next Phase Readiness
- All Phase 6 mobile features implemented (auth, dark mode, share, LGPD)
- Ready for integration testing with backend endpoints
- Google OAuth needs real client ID configured in app.json for production use

---
*Phase: 06-polish-deploy*
*Completed: 2026-04-12*
