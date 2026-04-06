# Roadmap: NossoVizinho

## Overview

NossoVizinho delivers a neighborhood social network for Brazil in 6 phases: starting with infrastructure and authentication to prove cross-origin hosting works, then building the core trust mechanism (address verification), followed by the daily engagement loop (feed), the marketplace, community features (map + groups), and finally polish with LGPD compliance and deployment. Every phase delivers a coherent, verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation + Auth** - Both projects scaffolded, CORS proven, JWT auth working end-to-end
- [ ] **Phase 2: Verification + Neighborhoods** - CEP lookup, proof upload, admin review, bairro assignment
- [ ] **Phase 3: Feed + Posts** - Neighborhood-scoped feed with posts, comments, likes, search, moderation
- [ ] **Phase 4: Marketplace + Chat** - Listings, search, private 1:1 chat, reporting
- [ ] **Phase 5: Map + Groups** - Neighbor map, community groups, group feeds
- [ ] **Phase 6: Polish + Deploy** - LGPD, sharing, dark mode, advanced auth, domain + DNS, final deploy

## Phase Details

### Phase 1: Infrastructure + Auth
**Goal**: Domain registered, hosting provisioned, both apps deployed, CORS proven, JWT auth working end-to-end
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-001, AUTH-002, AUTH-003, AUTH-004, AUTH-005, AUTH-006, AUTH-007, AUTH-008, AUTH-011, INF-001, INF-002, INF-003, INF-004, UXDS-01, UXDS-03, LGPD-01, LGPD-05
**Success Criteria** (what must be TRUE):
  1. Domain nossovizinho.com.br registered at Registro.br and DNS configured via Cloudflare
  2. cPanel site provisioned on HostGator (WHM API) with Next.js static export deployed and serving
  3. .NET Core 8 API + SQL Server database provisioned on SmarterASP and responding
  4. User can sign up on frontend and JWT + refresh token flow works across the cross-origin boundary (HostGator <> SmarterASP)
  5. API has CORS, rate limiting (429), HTTPS, Swagger docs at /api/v1/swagger, and audit logging
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Backend foundation: .NET 8 API scaffold, EF Core entities, middleware pipeline (CORS, rate limiting, Swagger, audit logging, SignalR hub)
- [x] 01-02-PLAN.md — Frontend foundation: Next.js 15 static export, Tailwind, auth pages, privacy policy, Axios client, Zustand auth store
- [x] 01-03-PLAN.md — Auth implementation: JWT auth service, token rotation, registration, login, logout, password reset, account lockout, unit tests
- [ ] 01-04-PLAN.md — Infrastructure provisioning + deploy: domain, DNS, cPanel, SmarterASP, cross-origin auth proof

### Phase 2: Verification + Neighborhoods
**Goal**: Users can verify their address and get assigned to a bairro, establishing the core trust layer
**Depends on**: Phase 1
**Requirements**: VER-001, VER-002, VER-003, VER-004, VER-005, VER-006, VER-007, VER-008, VER-009, VER-010, AUTH-010, AUTH-012
**Success Criteria** (what must be TRUE):
  1. User can enter their CEP and see auto-completed address with bairro assignment
  2. User can upload a proof-of-residence document and track its verification status in real time
  3. Admin can review pending verifications and approve/reject with reasons
  4. Verified users display a badge on their profile, and profiles show display name, photo, bio, and bairro
  5. Fraud detection flags duplicate documents and suspicious patterns
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Feed + Posts
**Goal**: Verified neighbors can post, comment, like, search, and engage in their bairro feed
**Depends on**: Phase 2
**Requirements**: FEED-001, FEED-002, FEED-003, FEED-004, FEED-005, FEED-006, FEED-007, FEED-008, FEED-009, FEED-010, FEED-011, FEED-012, FEED-013, FEED-014, FEED-015, FEED-016
**Success Criteria** (what must be TRUE):
  1. User can create a categorized post (with up to 4 images) and see it in their bairro feed with infinite scroll
  2. User can comment on posts (with threading), like posts, and edit/delete their own content
  3. User can search posts by text, filter by category/date/author, and see relevance-sorted results
  4. Reported posts enter a moderation queue, and offensive-word filter auto-flags content before publishing
  5. User receives in-app notifications for comments, likes, and mentions on their posts
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Marketplace + Chat
**Goal**: Verified neighbors can buy/sell items locally with private chat and trusted seller profiles
**Depends on**: Phase 3
**Requirements**: MKT-001, MKT-002, MKT-003, MKT-004, MKT-005, MKT-006, MKT-007, MKT-008, MKT-009, MKT-010, MKT-011, MKT-012, MKT-013
**Success Criteria** (what must be TRUE):
  1. Verified user can create a listing with photos, price, and category, and it appears in the bairro marketplace grid
  2. Buyer can browse, search, and filter listings, then open a private 1:1 chat with the seller
  3. Seller can mark listings as sold, edit them, and see favorites count and ratings from past transactions
  4. Users can report suspicious listings and they enter a separate moderation queue
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Map + Groups
**Goal**: Users can discover neighbors on a map and form community groups with dedicated feeds
**Depends on**: Phase 2
**Requirements**: MAP-001, MAP-002, MAP-003, MAP-004, MAP-005, MAP-006, MAP-007, MAP-008, MAP-009, MAP-010, GRP-001, GRP-002, GRP-003, GRP-004, GRP-005, GRP-006, GRP-007, GRP-008, GRP-009
**Success Criteria** (what must be TRUE):
  1. User can view an interactive bairro map with approximate neighbor locations (privacy-safe block-level pins)
  2. User can click a pin to see a mini-profile and contact the neighbor, with a toggle to opt out of the map
  3. User can create/join themed groups, post in group-exclusive feeds, and browse all bairro groups
  4. Group admins can moderate members, posts, and rules, and create group events with RSVP
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Polish + Deploy
**Goal**: Platform is LGPD-compliant, shareable, polished, and live on nossovizinho.com.br
**Depends on**: Phase 5
**Requirements**: AUTH-009, AUTH-013, AUTH-014, VER-011, VER-012, LGPD-02, LGPD-03, LGPD-04, SHAR-01, SHAR-02, SHAR-03, UXDS-02, NOTF-01
**Success Criteria** (what must be TRUE):
  1. User can export their personal data as JSON/ZIP and request full account deletion (LGPD compliance)
  2. User can share posts and listings to WhatsApp with rich preview, and non-logged-in visitors see a public preview with signup CTA
  3. Dark mode toggle works across all screens, and weekly email digest delivers top bairro content
  4. All advanced auth features (2FA, social login, magic link) deployed and working
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Auth | 0/4 | Planning complete | - |
| 2. Verification + Neighborhoods | 0/3 | Not started | - |
| 3. Feed + Posts | 0/3 | Not started | - |
| 4. Marketplace + Chat | 0/3 | Not started | - |
| 5. Map + Groups | 0/3 | Not started | - |
| 6. Polish + Deploy | 0/3 | Not started | - |
