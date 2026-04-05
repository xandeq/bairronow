# Requirements: NossoVizinho

**Defined:** 2026-04-05
**Core Value:** Verified neighbor discovery — users must trust that people on the platform actually live in their neighborhood.
**Prioritization:** MoSCoW (Must/Should/Could/Nice)

## v1 Requirements

### Authentication (14)

- [ ] **AUTH-001** [Must]: User can sign up with email and password (min 8 chars, 1 upper, 1 number, 1 special). Email confirmation required.
- [ ] **AUTH-002** [Must]: Login with JWT (15min TTL) + refresh token (7 days, rotating, httpOnly cookie).
- [ ] **AUTH-003** [Must]: Logout removes tokens and invalidates refresh token server-side. Option to logout all devices.
- [ ] **AUTH-004** [Must]: Password reset via email with temporary link (1h TTL).
- [ ] **AUTH-005** [Must]: All user input sanitized against XSS/injection. Parameterized queries via EF Core. HTML encoding on outputs.
- [ ] **AUTH-006** [Must]: Rate limiting — 100 req/min authenticated, 20 req/min public (login, register). 429 with Retry-After header.
- [ ] **AUTH-007** [Must]: CORS configured for authorized domains only. Credentials enabled. Explicit allowed headers.
- [ ] **AUTH-008** [Must]: HTTPS/TLS on all endpoints. HTTP→HTTPS redirect. HSTS header.
- [ ] **AUTH-009** [Should]: 2FA for moderators/admins via TOTP (Google Authenticator, Authy). Backup codes on activation.
- [ ] **AUTH-010** [Should]: Editable user profile — display name, profile photo, bio (160 chars), reference bairro.
- [ ] **AUTH-011** [Should]: Account lockout after 5 failed login attempts (15min cooldown). Email notification.
- [ ] **AUTH-012** [Should]: Terms of use + privacy policy acceptance at signup. Versioned. Re-acceptance on update.
- [ ] **AUTH-013** [Could]: Social login via Google + Apple Sign-In (OAuth2). Link with existing account by email.
- [ ] **AUTH-014** [Nice]: Magic link login — passwordless via email link (10min TTL, single-use).

### Verification (12)

- [ ] **VER-001** [Must]: CEP lookup via ViaCEP API with address autocomplete. Real-time validation. Manual input fallback.
- [ ] **VER-002** [Must]: Upload proof of residence (utility bill image/PDF). Max 5MB. Type + size validation. Secure storage.
- [ ] **VER-003** [Must]: Admin review queue — view document, CEP, user data. Actions: approve, reject (with reason), request resubmit.
- [ ] **VER-004** [Must]: Verified neighbor badge on profile and all posts/comments. Badge irremovable by user.
- [ ] **VER-005** [Must]: User-to-bairro association derived from CEP. Bairro determines visible feed and map.
- [ ] **VER-006** [Must]: Neighborhood as aggregate root (DDD). Contains references to members, posts, marketplace items. Business rules encapsulated.
- [ ] **VER-007** [Should]: Re-verification every 12 months. 30-day grace period. Badge removed if not re-verified.
- [ ] **VER-008** [Should]: Basic fraud detection — same document used by multiple users, CEP/IP geolocation mismatch, abnormal signup volume at same address.
- [ ] **VER-009** [Should]: Real-time verification status — sent, in review, approved, rejected. Push/email on each change.
- [ ] **VER-010** [Should]: Soft delete for verification data. Data marked, not physically removed.
- [ ] **VER-011** [Could]: OCR on proof documents — auto-extract name, address, date. Pre-validation before manual review.
- [ ] **VER-012** [Could]: Neighbor vouching — 2 verified neighbors vouch for new user as equivalent to proof document.

### Feed & Posts (16)

- [ ] **FEED-001** [Must]: Create text post (max 2000 chars, basic formatting). Mandatory categories: Dica, Alerta, Pergunta, Evento, Geral.
- [ ] **FEED-002** [Must]: Post with up to 4 images. Auto-resize. Type validation (jpg, png, webp). Max 5MB each.
- [ ] **FEED-003** [Must]: Neighborhood-scoped feed (only user's bairro). Reverse chronological. Infinite scroll pagination.
- [ ] **FEED-004** [Must]: Comments on posts. 1-level threading (reply to comment). Max 500 chars. Edit/delete own.
- [ ] **FEED-005** [Must]: Like/reaction on posts. Toggle on/off. Visible counter. "Who liked" list accessible.
- [ ] **FEED-006** [Must]: Edit post within 30min. Soft delete anytime. "Edited" indicator visible.
- [ ] **FEED-007** [Must]: Full-text search in bairro posts. Filter by category, date, author. Relevance-sorted results.
- [ ] **FEED-008** [Must]: Report posts/comments — categories: spam, offensive, discrimination, misinformation, other. Moderation queue.
- [ ] **FEED-009** [Must]: Proactive moderation — auto-filter offensive words (admin-customizable list). Flagged posts go to review before publishing.
- [ ] **FEED-010** [Should]: Activity notifications — push + in-app for: comment on your post, like, mention, reply.
- [ ] **FEED-011** [Should]: Admin/mod can pin up to 3 posts at feed top. Differentiated visual.
- [ ] **FEED-012** [Should]: Posts restricted to verified neighbors only (optional per post).
- [ ] **FEED-013** [Should]: Simple polls — 2-4 options, single vote, real-time results, optional expiration.
- [ ] **FEED-014** [Could]: Adjacent neighborhood feed — toggle to see nearby bairros. Visual indicator for other-bairro posts.
- [ ] **FEED-015** [Could]: Trending topics — most discussed in last 24h based on volume + engagement. Updated hourly.
- [ ] **FEED-016** [Nice]: Scheduled posts — publish at future date/time. Cancel before publication.

### Marketplace (13)

- [ ] **MKT-001** [Must]: Verified users create listings — title, description, price (or "a combinar"), category, up to 6 photos.
- [ ] **MKT-002** [Must]: Bairro marketplace grid — thumbnail, title, price. Filter by category + price range. Sort by recency/price.
- [ ] **MKT-003** [Must]: Listing detail page — photo gallery, description, price, seller profile (with badge), approximate location, date.
- [ ] **MKT-004** [Must]: Private 1:1 chat between buyer and seller. Text + image. Linked to listing. New message notifications.
- [ ] **MKT-005** [Must]: Mark listing as sold. "Sold" visual for 7 days, then soft deleted.
- [ ] **MKT-006** [Must]: Edit/remove listing. Seller edits all fields anytime. Remove via soft delete with confirmation.
- [ ] **MKT-007** [Must]: Full-text search in listings. Combined filters: category, price, distance, verified seller.
- [ ] **MKT-008** [Must]: Report listing — prohibited item, scam, abusive price, misinformation. Separate moderation queue.
- [ ] **MKT-009** [Should]: Favorite listings. Notification on price change. Favorites counter visible to seller.
- [ ] **MKT-010** [Should]: Seller ratings — 1-5 stars + comment after transaction. Average rating on seller profile.
- [ ] **MKT-011** [Should]: Categories + subcategories taxonomy. Browse + filter navigation.
- [ ] **MKT-012** [Could]: Paid spotlight for local businesses — "Verified Business" badge. Featured listings. Monthly plan R$200-500.
- [ ] **MKT-013** [Nice]: Service listings with scheduling — service providers offer time slots, neighbors book directly.

### Map (10)

- [ ] **MAP-001** [Must]: Interactive bairro map showing approximate location of verified neighbors (block-level, not exact address).
- [ ] **MAP-002** [Must]: Geolocation from CEP (not real GPS). Random offset within block for privacy.
- [ ] **MAP-003** [Must]: Pin click shows mini-profile — name, photo, verified badge, short bio, contact button.
- [ ] **MAP-004** [Must]: Location privacy toggle — user can opt out of map. Default: visible. No real-time tracking.
- [ ] **MAP-005** [Should]: Map filters — verified, unverified, businesses, new neighbors (last month).
- [ ] **MAP-006** [Should]: Activity heatmap overlay — most active areas of bairro. Toggle on/off.
- [ ] **MAP-007** [Should]: Admin can add POIs — shops, schools, parks, health centers. Differentiated pins.
- [ ] **MAP-008** [Should]: Marketplace pins on map. Click opens listing details.
- [ ] **MAP-009** [Could]: Google Street View integration — opens in modal.
- [ ] **MAP-010** [Could]: Bairro boundary polygon — subtle dashed line showing neighborhood limits.

### Groups (9)

- [ ] **GRP-001** [Must]: Verified users create themed groups — sports, pets, parents, security, gardening, etc.
- [ ] **GRP-002** [Must]: Join/leave groups. Open groups (direct entry) or closed (admin approval).
- [ ] **GRP-003** [Must]: Group-exclusive feed — same features as main feed (text, image, comments, likes).
- [ ] **GRP-004** [Must]: Bairro groups listing page — cards with name, description, member count, category.
- [ ] **GRP-005** [Should]: Group moderation — admin can remove members, delete posts, edit rules, assign co-admins. Action log.
- [ ] **GRP-006** [Should]: Group notifications — per-group config: all, mentions only, none. Unread badge.
- [ ] **GRP-007** [Should]: Group events — create events within group. RSVP. Auto-reminder.
- [ ] **GRP-008** [Could]: Cross-bairro groups — groups spanning adjacent neighborhoods (e.g., park running group serving 3 bairros).
- [ ] **GRP-009** [Nice]: Group templates — pre-configured: "Running Group", "Neighborhood Pets", "Parents". Suggested rules + categories.

### Infrastructure & Security (4)

- [ ] **INF-001** [Must]: Audit logging — all admin/moderation actions logged: who, when, what, IP. 12-month retention.
- [ ] **INF-002** [Must]: SignalR for real-time — new posts, notifications, verification status, marketplace chat.
- [ ] **INF-003** [Must]: All secrets in environment variables. Zero hardcoded keys/connection strings.
- [ ] **INF-004** [Must]: RESTful API versioned (/api/v1/) with OpenAPI/Swagger documentation. All endpoints with examples.

### LGPD Compliance

- [ ] **LGPD-01** [Must]: Privacy consent at signup (terms + data usage acceptance).
- [ ] **LGPD-02** [Should]: User can export personal data (JSON/ZIP download).
- [ ] **LGPD-03** [Should]: User can request account deletion (anonymize data, remove PII).
- [ ] **LGPD-04** [Should]: Verification documents have retention policy (delete after X days post-approval).
- [ ] **LGPD-05** [Must]: Privacy policy page accessible from all screens.

### Sharing & Growth

- [ ] **SHAR-01** [Should]: WhatsApp share button on posts (deep link).
- [ ] **SHAR-02** [Should]: WhatsApp share button on marketplace listings.
- [ ] **SHAR-03** [Should]: Shared links show public preview + CTA to sign up for non-logged-in users.

### UX & Design

- [ ] **UXDS-01** [Must]: Fully responsive mobile-first design (Tailwind CSS).
- [ ] **UXDS-02** [Should]: Dark mode support (toggle in settings).
- [ ] **UXDS-03** [Must]: Portuguese (PT-BR) only — no i18n.

### Notifications

- [ ] **NOTF-01** [Should]: Weekly email digest "O que aconteceu no seu bairro" with top posts/events.

## v2 Requirements

### Mobile App
- **MOB-01**: Native mobile app (React Native or Flutter) after MVP validation
- **MOB-02**: Push notifications via FCM/APNs

### Marketplace Enhanced
- **MKTV-01**: PIX integration for in-app payments
- **MKTV-02**: Seller ratings and reviews (if not shipped in v1)

### Performance
- **PERF-01**: Redis caching layer
- **PERF-02**: Cloudflare CDN for static assets
- **PERF-03**: DB read replicas

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video posts | Storage/bandwidth costs destroy free-tier hosting |
| Multi-city launch | Dilutes focus; pilot Vila Velha first |
| AI content moderation | Cost/complexity; manual admin moderation for MVP |
| In-app payments | PCI compliance + Brazilian payment regulations; contact-only marketplace first |
| Multi-language (i18n) | PT-BR only for Brazil launch |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-001 | Phase 1 | Pending |
| AUTH-002 | Phase 1 | Pending |
| AUTH-003 | Phase 1 | Pending |
| AUTH-004 | Phase 1 | Pending |
| AUTH-005 | Phase 1 | Pending |
| AUTH-006 | Phase 1 | Pending |
| AUTH-007 | Phase 1 | Pending |
| AUTH-008 | Phase 1 | Pending |
| AUTH-009 | Phase 6 | Pending |
| AUTH-010 | Phase 2 | Pending |
| AUTH-011 | Phase 1 | Pending |
| AUTH-012 | Phase 2 | Pending |
| AUTH-013 | Phase 6 | Pending |
| AUTH-014 | Phase 6 | Pending |
| VER-001 | Phase 2 | Pending |
| VER-002 | Phase 2 | Pending |
| VER-003 | Phase 2 | Pending |
| VER-004 | Phase 2 | Pending |
| VER-005 | Phase 2 | Pending |
| VER-006 | Phase 2 | Pending |
| VER-007 | Phase 2 | Pending |
| VER-008 | Phase 2 | Pending |
| VER-009 | Phase 2 | Pending |
| VER-010 | Phase 2 | Pending |
| VER-011 | Phase 6 | Pending |
| VER-012 | Phase 6 | Pending |
| FEED-001 | Phase 3 | Pending |
| FEED-002 | Phase 3 | Pending |
| FEED-003 | Phase 3 | Pending |
| FEED-004 | Phase 3 | Pending |
| FEED-005 | Phase 3 | Pending |
| FEED-006 | Phase 3 | Pending |
| FEED-007 | Phase 3 | Pending |
| FEED-008 | Phase 3 | Pending |
| FEED-009 | Phase 3 | Pending |
| FEED-010 | Phase 3 | Pending |
| FEED-011 | Phase 3 | Pending |
| FEED-012 | Phase 3 | Pending |
| FEED-013 | Phase 3 | Pending |
| FEED-014 | Phase 3 | Pending |
| FEED-015 | Phase 3 | Pending |
| FEED-016 | Phase 3 | Pending |
| MKT-001 | Phase 4 | Pending |
| MKT-002 | Phase 4 | Pending |
| MKT-003 | Phase 4 | Pending |
| MKT-004 | Phase 4 | Pending |
| MKT-005 | Phase 4 | Pending |
| MKT-006 | Phase 4 | Pending |
| MKT-007 | Phase 4 | Pending |
| MKT-008 | Phase 4 | Pending |
| MKT-009 | Phase 4 | Pending |
| MKT-010 | Phase 4 | Pending |
| MKT-011 | Phase 4 | Pending |
| MKT-012 | Phase 4 | Pending |
| MKT-013 | Phase 4 | Pending |
| MAP-001 | Phase 5 | Pending |
| MAP-002 | Phase 5 | Pending |
| MAP-003 | Phase 5 | Pending |
| MAP-004 | Phase 5 | Pending |
| MAP-005 | Phase 5 | Pending |
| MAP-006 | Phase 5 | Pending |
| MAP-007 | Phase 5 | Pending |
| MAP-008 | Phase 5 | Pending |
| MAP-009 | Phase 5 | Pending |
| MAP-010 | Phase 5 | Pending |
| GRP-001 | Phase 5 | Pending |
| GRP-002 | Phase 5 | Pending |
| GRP-003 | Phase 5 | Pending |
| GRP-004 | Phase 5 | Pending |
| GRP-005 | Phase 5 | Pending |
| GRP-006 | Phase 5 | Pending |
| GRP-007 | Phase 5 | Pending |
| GRP-008 | Phase 5 | Pending |
| GRP-009 | Phase 5 | Pending |
| INF-001 | Phase 1 | Pending |
| INF-002 | Phase 1 | Pending |
| INF-003 | Phase 1 | Pending |
| INF-004 | Phase 1 | Pending |
| LGPD-01 | Phase 1 | Pending |
| LGPD-02 | Phase 6 | Pending |
| LGPD-03 | Phase 6 | Pending |
| LGPD-04 | Phase 6 | Pending |
| LGPD-05 | Phase 1 | Pending |
| SHAR-01 | Phase 6 | Pending |
| SHAR-02 | Phase 6 | Pending |
| SHAR-03 | Phase 6 | Pending |
| UXDS-01 | Phase 1 | Pending |
| UXDS-02 | Phase 6 | Pending |
| UXDS-03 | Phase 1 | Pending |
| NOTF-01 | Phase 6 | Pending |

**Coverage:**
- Must have: 42
- Should have: 22
- Could have: 10
- Nice to have: 4
- **Total v1 requirements: 90** (corrected -- actual count of all requirement IDs)
- Mapped to phases: 90
- Unmapped: 0

**By Phase:**
- Phase 1 (Foundation + Auth): 17 requirements
- Phase 2 (Verification + Neighborhoods): 12 requirements
- Phase 3 (Feed + Posts): 16 requirements
- Phase 4 (Marketplace + Chat): 13 requirements
- Phase 5 (Map + Groups): 19 requirements
- Phase 6 (Polish + Deploy): 13 requirements

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
