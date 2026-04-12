# NossoVizinho — Retrospective

## Milestone: v1.0 MVP

**Shipped:** 2026-04-12
**Phases:** 6 | **Plans:** 20 | **Commits:** 105
**Timeline:** 2026-04-05 → 2026-04-12 (7 days)

### What Was Built

1. **Phase 1** — .NET 8 API + Next.js 15 static export scaffold; JWT auth with BCrypt, refresh token rotation, lockout, and 21 passing unit tests; infrastructure provisioned on HostGator + SmarterASP
2. **Phase 2** — Address verification: CEP lookup (ViaCEP), proof-of-residence upload, admin review queue, bairro assignment, verified badge, fraud detection, re-verification scheduling
3. **Phase 3** — Neighborhood feed: posts with images, threaded comments, likes, full-text search, category filters, auto content moderation (offensive-word filter), SignalR notifications
4. **Phase 4** — Local marketplace: listings with photo pipeline reuse, private 1:1 chat (SignalR hub extension), seller ratings, favorites, moderation queue, mobile chat with forced-WebSocket
5. **Phase 5** — Interactive bairro map (Leaflet + react-native-maps, coordinate fuzzing), community groups (create/join, dedicated feeds, events + RSVP, SignalR group rooms, reminder service)
6. **Phase 6** — LGPD compliance (export/delete/anonymize), Google OAuth + magic link + TOTP, Resend email service, weekly digest scheduler, OCR service, vouching endpoint, dark mode (web + mobile), WhatsApp share, public preview routes

### What Worked

- **Wave-based parallel execution** — Wave 1 (backend) + Wave 2 (frontend+mobile) pattern kept each phase tight and predictable
- **Plan separation by layer** — backend plan → web plan → mobile plan prevented merge conflicts in parallel execution
- **GroupPost as separate entity** — keeping group posts separate from main posts avoided feed contamination and simplified moderation scope
- **Coordinate fuzzing with deterministic hash** — elegant privacy solution that's reproducible (same user always gets same offset) without storing the fuzz offset

### What Was Inefficient

- **REQUIREMENTS.md checkbox drift** — Phase 5 built all MAP and GRP features but REQUIREMENTS.md wasn't updated; milestone completion had to reconcile manually
- **ROADMAP.md status drift** — Some phases showed "Not started" in progress table even after completion; needs automated sync
- **Mobile as last plan** — Mobile was always the third plan in each phase wave; this could be parallelized earlier by not depending on frontend

### Patterns Established

- Layer separation for plan grouping: `XX-01` backend, `XX-02` web frontend, `XX-03` mobile
- SignalR hub extension pattern: reuse existing hub, add new group/channel per feature
- Proof upload pattern reused in marketplace (photo picker → same S3/blob pipeline)
- expo-auth-session id_token → backend exchange for Google OAuth mobile

### Key Lessons

1. **Requirements.md needs phase-end auto-update** — add requirements sync step to execute-phase workflow
2. **Mobile can sometimes run in Wave 1** — when mobile changes don't depend on new API shape, parallelize earlier
3. **Coordinate fuzzing should be deterministic** — prevents "the pin moved" UX bugs on re-fetch
4. **LGPD document retention (90-day policy)** — build retention from day 1, not as an afterthought

### Cost Observations

- Model mix: ~80% Opus (execution), ~20% Sonnet (verification, planning)
- Sessions: ~3 sessions across 7 days
- Notable: Parallel wave execution saved significant wall-clock time vs sequential; Wave 1+2 parallelism cut per-phase time roughly in half

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Days | Deviations |
|-----------|--------|-------|------|------------|
| v1.0 MVP | 6 | 20 | 7 | ~8 auto-fixed |

