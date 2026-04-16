# NossoVizinho

## Current State (v1.0 — Shipped 2026-04-12)

NossoVizinho v1.0 MVP is complete. The platform is deployed on bairronow.com.br with:
- Full JWT + Google OAuth + magic link + TOTP authentication
- Address verification (CEP + proof-of-residence upload, admin review queue)
- Neighborhood-scoped feed (posts, comments, likes, search, moderation)
- Local marketplace (listings, private chat, ratings, favorites)
- Interactive bairro map (privacy-safe pins with coordinate fuzzing)
- Community groups (create/join, group feeds, events + RSVP)
- LGPD compliance (data export, account deletion, document retention)
- WhatsApp sharing + public preview routes
- Dark mode (web + mobile)
- Weekly email digest

**Stack**: Next.js 15 (HostGator cPanel) + .NET 8 API (SmarterASP) + SQL Server + SignalR + Cloudflare DNS
**Codebase**: ~105 commits, 6 phases, 20 plans executed

## What This Is

A neighborhood social network ("Nextdoor brasileiro") for Brazil where verified residents connect on a geo-scoped platform. Users share news, buy/sell in a trusted marketplace, form community groups, and discover neighbors on an interactive map. Trust is built through address verification (CEP + proof-of-residence document).

## Core Value

Verified neighbor discovery — users must be able to find and trust that the people on the platform actually live in their neighborhood. Without this trust layer, nothing else works.

## Requirements

### Validated

- [x] JWT authentication with refresh tokens — Validated in Phase 01
- [x] Address verification via CEP + utility bill upload (proof of residence) — Validated in Phase 02
- [x] Neighborhood-scoped feed with posts (text + images) — Validated in Phase 03
- [x] Local marketplace (buy/sell between verified neighbors) — Validated in Phase 04
- [x] Community groups within neighborhoods — Validated in Phase 05
- [x] Neighbor map showing verified residents — Validated in Phase 05
- [x] Rate limiting (100 req/min per user) — Validated in Phase 05
- [x] Soft deletes across all entities — Validated in Phase 05
- [x] Google OAuth, magic link, TOTP auth flows — Validated in Phase 06
- [x] LGPD compliance (data export + account deletion) — Validated in Phase 06
- [x] Dark mode (web + mobile) — Validated in Phase 06
- [x] WhatsApp share buttons — Validated in Phase 06
- [x] Public preview routes (/p/[postId], /m/[listingId]) — Validated in Phase 06

### Active (v1.1 candidates)

- [ ] Post pinning (admin pins up to 3 posts at feed top) — FEED-011
- [ ] Simple polls on posts — FEED-013
- [ ] Business spotlight / "Verified Business" badge — MKT-012
- [ ] Expo native app (currently Expo web only) — MOB-01
- [ ] Push notifications via FCM/APNs — MOB-02
- [ ] PIX in-app payments for marketplace — MKTV-01
- [ ] Redis caching layer — PERF-01

### Out of Scope

- Video posts — storage/bandwidth costs, defer to v2+
- Multi-language (i18n) — PT-BR only for Brazil launch
- Payment processing in MVP — marketplace is contact-only (contacts seller via chat)
- Multi-region deployment — single SmarterASP instance
- ClamAV file scanning — using image type/size validation
- Scheduled posts — FEED-016, low priority
- Cross-bairro groups spanning adjacent neighborhoods — GRP-008, defer to v1.1
- Google Street View integration — MAP-009, defer to v1.1

## Context

- **Market**: Brazil has no dominant neighborhood social network. Nextdoor doesn't operate here.
- **Pilot**: Vila Velha, ES — smaller market for fast validation, then prove scalability in SP.
- **Revenue**: Local business ads targeting specific neighborhoods.
- **Verification**: CEP + uploaded proof document (utility bill). This is the core trust mechanism.
- **Stack (shipped)**: Next.js 15 frontend (HostGator cPanel), .NET 8 API (SmarterASP), SQL Server (SmarterASP), Cloudflare DNS.
- **Domain**: bairronow.com.br — registered and configured.
- **v1.0 shipped**: 2026-04-12 — 6 phases, 20 plans, 105 commits, 7-day build.

## Constraints

- **Hosting (Frontend)**: HostGator cPanel (alexa084 reseller) — shared hosting limitations, no Docker
- **Hosting (Backend)**: SmarterASP — .NET Core 8, SQL Server, no Redis (use in-memory cache)
- **Budget**: Free-tier infrastructure only — no Redis, no separate CDN beyond Cloudflare
- **Timeline**: MVP in 1 week
- **Domain**: Must register bairronow.com.br via Registro.br (Brazilian registry)
- **Security**: OWASP top 10, parametrized queries, XSS sanitization, CORS, HTTPS/TLS
- **Credentials**: All secrets in ~/.claude/.secrets.env — never hardcoded
- **Automation**: All provisioning via API/CLI — no manual portal logins

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CEP + proof of residence verification | Core value is trust — self-declaration too easy to game | ✓ Shipped — admin queue working |
| Vila Velha as pilot city | Smaller market for fast validation before SP | ✓ Seeded in Phase 2 |
| Local ads as revenue model | Non-intrusive, aligns with local business value | — Pending (v1.1) |
| Next.js + .NET Core + SQL Server | Leverages existing hosting (HostGator + SmarterASP) | ✓ Deployed and working |
| In-memory cache instead of Redis | SmarterASP free tier has no Redis | ✓ Works at MVP scale |
| SignalR for real-time | Native .NET Core integration, no extra infra | ✓ Used in feed, chat, groups, notifications |
| Contact-only marketplace (no payments) | Avoids payment complexity in MVP | ✓ Private chat between buyer/seller |
| Coordinate fuzzing (±0.001°) for map privacy | Block-level precision without exposing exact address | ✓ Deterministic hash-based fuzzing |
| GroupPost as separate entity (not extending Post) | Groups have different moderation and scope rules | ✓ Avoids feed contamination |
| expo-auth-session for Google OAuth mobile | No custom URI scheme needed, works with Expo Go | ✓ id_token exchange via /auth/google/mobile |
| Resend for transactional email | Simple REST API, LGPD-friendly EU data handling | ✓ Used for magic links + weekly digest |
| Confirmação do stack backend (.NET 8) pós-MVP | Escolha original de Phase 1 (linha acima) validada pelo entregue; lacunas arquiteturais identificadas são portáveis entre stacks | ✓ ADR-001 aceito 2026-04-15 — gatilhos de reavaliação documentados |

## Architectural Decision Records (ADRs)

Decisões arquiteturais estratégicas ficam em `.planning/decisions/ADR-NNN-*.md`.
Use este formato quando a decisão tiver custo alto de reversão, impactar múltiplas phases,
ou exigir justificativa rastreável para auditoria futura.

| ADR | Status | Título |
|-----|--------|--------|
| [ADR-001](./decisions/ADR-001-backend-stack.md) | ✅ Accepted | Confirmação do stack de backend (.NET 8) e condições para reavaliação |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after v1.0 milestone*
