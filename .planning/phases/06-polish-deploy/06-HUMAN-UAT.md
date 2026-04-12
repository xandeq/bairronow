---
status: partial
phase: 06-polish-deploy
source: [06-VERIFICATION.md]
started: 2026-04-12T00:00:00Z
updated: 2026-04-12T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Google OAuth web redirect flow
expected: Clicking "Entrar com Google" on /login and /register opens Google consent screen, completes OAuth, redirects to /feed with JWT token issued
result: [pending]

### 2. Magic link email delivery
expected: Requesting magic link sends email via Resend API; clicking link in email authenticates user
result: [pending]

### 3. Dark mode visual appearance (web)
expected: ThemeToggle switches app between light/dark; dark colors apply consistently across all pages; preference persists on reload
result: [pending]

### 4. WhatsApp share on mobile device
expected: WhatsApp share button opens WhatsApp with pre-filled message containing post/listing link; works on real device with WhatsApp installed
result: [pending]

### 5. LGPD data export file download (web)
expected: /profile/settings → Export Data triggers download of JSON file with user data; Delete Account shows confirmation, calls DELETE /api/v1/account, logs out
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
