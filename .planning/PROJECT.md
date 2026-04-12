# NossoVizinho

## What This Is

A neighborhood operating system for Brazil — a "Nextdoor brasileiro" where verified residents, building sindicos, local businesses, and public agencies connect on a centralized, geo-scoped platform. Residents share news, buy/sell/donate in a trusted marketplace, organize events, and form community groups. Sindicos manage building communities. Local businesses (gardening, food, retail, real estate, personal care, medical, salons) maintain profiles with deals and reviews. Public agencies send geo-targeted alerts and emergency messages. Everything is scoped to your bairro or building, and trust is built through address verification.

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

### Active

- [ ] Address verification via CEP + utility bill upload (proof of residence)
- [ ] Neighborhood-scoped feed with posts (text + images)
- [ ] Local marketplace (buy/sell between verified neighbors)
- [ ] Event creation with RSVP
- [ ] Community groups within neighborhoods
- [ ] Neighbor map showing verified residents
- [ ] User profiles with neighborhood affiliation
- [ ] JWT authentication with refresh tokens
- [ ] Rate limiting (100 req/min per user)
- [ ] Audit logging (who did what, when)
- [ ] Soft deletes across all entities
- [ ] Real-time updates (SignalR)
- [ ] Local business ads (revenue model)

### Out of Scope

- Mobile native app — web-first, responsive design sufficient for MVP
- Multi-language — Portuguese only for Brazil launch
- Payment processing — marketplace is contact-only in MVP (no transactions)
- Video posts — storage/bandwidth costs, defer to v2+
- OAuth/social login — email/password sufficient for MVP
- Multi-region deployment — single SmarterASP instance for MVP
- ClamAV file scanning — defer to v2, use image type/size validation for MVP

## Context

- **Market**: Brazil has no dominant neighborhood social network. Nextdoor doesn't operate here.
- **Pilot**: Vila Velha, ES — smaller market for fast validation, then prove scalability in SP.
- **Revenue**: Local business ads targeting specific neighborhoods.
- **Verification**: CEP + uploaded proof document (utility bill). This is the core trust mechanism.
- **Stack decided**: Next.js 15 frontend (HostGator cPanel), .NET Core 8 API (SmarterASP), SQL Server (SmarterASP), Cloudflare DNS.
- **Infrastructure**: HostGator reseller (alexa084), SmarterASP existing account, Cloudflare account ready.
- **Domain**: bairronow.com.br to be registered at Registro.br.

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
| CEP + proof of residence verification | Core value is trust — self-declaration too easy to game | — Pending |
| Vila Velha as pilot city | Smaller market for fast validation before SP | — Pending |
| Local ads as revenue model | Non-intrusive, aligns with local business value | — Pending |
| Next.js + .NET Core + SQL Server | Leverages existing hosting (HostGator + SmarterASP) | — Pending |
| In-memory cache instead of Redis | SmarterASP free tier has no Redis | — Pending |
| SignalR for real-time | Native .NET Core integration, no extra infra | — Pending |
| Contact-only marketplace (no payments) | Avoids payment complexity in MVP | — Pending |

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
*Last updated: 2026-04-12 — Phase 06 (polish-deploy) complete. All 6 phases done. v1.0 milestone ready for deploy.*
