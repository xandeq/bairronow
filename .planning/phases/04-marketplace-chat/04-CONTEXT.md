# Phase 4: Marketplace + Chat - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning (execution blocked until Phase 2 QA bugs closed + 02-03 mobile shipped)

<domain>
## Phase Boundary

Verified Vila Velha neighbors can create listings with photos, browse a bairro-scoped marketplace grid, search and filter, open a private 1:1 chat (text+image) with sellers tied to a listing, mark listings sold, edit/remove, report abuse into a shared moderation queue, favorite listings, and rate sellers after transactions.

**Out of scope (deferred):**
- MKT-012 Paid spotlight → Phase 6 (monetization)
- MKT-013 Service scheduling → backlog
- Group chat → Phase 6 (groups feature handles it)
- Block user → Phase 6
- Cross-bairro visibility → Phase 5+
- Auto-expire stale listings → Phase 5
- Save-search / recent searches → Phase 5
- Admin CRUD on taxonomy → Phase 5

</domain>

<decisions>
## Implementation Decisions

### Listing creation
- **D-01:** Photos — min 1 required, max 6; drag-drop reorderable; first photo = cover automatically
- **D-02:** Price — numeric required (no "a combinar"); forces clarity and filterability
- **D-03:** Category picker — 2-step flow (category → subcategory) using chip grid UI, not dropdowns
- **D-04:** No drafts/preview — publish directly; edits after publish are unrestricted

### Marketplace grid & discovery
- **D-05:** 2-column card grid on web and mobile; card shows thumbnail, title (1-2 lines), price, verified badge
- **D-06:** Default sort: most recent
- **D-07:** Visibility scoped to own bairro only (Vila Velha pilot = 1 bairro)
- **D-08:** Filter UI: top chips (category, verified, price range). No drawer/modal until filters exceed 5.

### Search & filters
- **D-09:** Full-text search over title + description; description capped at 500 chars in form
- **D-10:** "Verified seller" filter defaults ON; unverified listings still visible with "⚠️ Vendedor não verificado" warning
- **D-11:** No distance filter in Phase 4 (no map yet — bairro is proxy)

### Chat (1:1)
- **D-12:** Reuse existing SignalR hub from Phase 1; add `ChatMessageHub` handler within same hub (shared auth/connection)
- **D-13:** Message history persisted forever; soft-delete only on user request; no automatic cleanup
- **D-14:** Chat images reuse ImageSharp pipeline from listings (jpg/png, 5MB, 1920x1080 max)
- **D-15:** Entry points — bottom-nav chat/envelope tab AND "Chat com vendedor" button on listing detail
- **D-16:** 1:1 only; no group chat; no block user in this phase

### Listing lifecycle
- **D-17:** Mark sold → "Vendido" badge for 7 days → soft-delete from grid; remains in seller profile "Vendidos" history
- **D-18:** Edit after publish unrestricted (price, description, photos); all mutations logged to audit trail for anti-scam
- **D-19:** No auto-expire stale listings in this phase

### Trust & safety
- **D-20:** Report reasons fixed list: "Prohibited item", "Scam/fraud suspicion", "Abusive pricing", "Misleading description"
- **D-21:** Moderation queue SHARED with Phase 3 post reports; item type (post vs listing) surfaced in admin dashboard
- **D-22:** Ratings — 1-way only: buyer rates seller after seller marks "sold"; seller receives "rate this transaction" notification
- **D-23:** Buyer can edit rating within 7 days; admin can delete flagged/spam ratings; no mutual ratings

### Taxonomy
- **D-24:** Seed categories (pt-BR, hardcoded in `Constants/Categories.cs`):
  1. Eletrônicos & Informática
  2. Móveis & Decoração
  3. Roupas, Calçados & Acessórios
  4. Veículos & Peças
  5. Casa & Jardim
  6. Esportes & Lazer
  7. Infantil & Bebê
  8. Livros & Revistas
  9. Serviços
  10. Outros
- **D-25:** Subcategories are a flat list per category (2-3 per cat, e.g., Eletrônicos → Celular, Notebook, TV, Outros) — no deep trees
- **D-26:** Admin can ON/OFF categories via toggles, but cannot create/delete (Phase 5)

### Claude's Discretion
- Exact card spacing, typography, image lazy-loading strategy
- Audit log schema for listing edits
- Chat unread-count indicator style
- SignalR reconnection UX
- Image compression thresholds within ImageSharp limits
- Rating notification copy and timing

</decisions>

<specifics>
## Specific Ideas

- Grid alignment mirrors Mercado Livre / Facebook Marketplace BR patterns (visual, 2-col, price-forward)
- Pragmatic pilot stance: validate usage in Vila Velha before over-building (no drafts, no mutual ratings, no blocking, no auto-expire)
- "Verified seller default ON" reinforces the trust-first positioning of the whole product
- Chat must feel continuous with existing SignalR infra — no parallel realtime stack

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §MKT-001..MKT-013 — marketplace and chat requirements (MKT-012/013 deferred)
- `.planning/ROADMAP.md` §"Phase 4: Marketplace + Chat" — goal + success criteria

### Prior phases (locked decisions to build on)
- `.planning/phases/01-infrastructure-auth/` — SignalR hub setup, JWT auth, ImageSharp pipeline, audit logging baseline
- `.planning/phases/02-verification-neighborhoods/` — VerifiedBadge component, bairro scoping, admin dashboard shell
- `.planning/phases/03-feed-posts/` — post report flow and moderation queue (Phase 4 SHARES this queue)

### Project context
- `CLAUDE.md` §Technology Stack — EF Core 8, FluentValidation, ImageSharp, IMemoryCache, SignalR, Next.js 15, Zustand, react-hook-form + zod
- `.planning/PROJECT.md` — Vila Velha pilot scope, verification-first trust model

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SignalR hub (Phase 1):** extend with `ChatMessageHub` handler — do not create a parallel hub
- **ImageSharp upload pipeline (Phase 2 verification proofs):** reuse for listing photos and chat images (same size/format limits)
- **VerifiedBadge component (Phase 2):** reuse on listing cards and seller profiles
- **Admin moderation queue (Phase 3):** extend schema with `ReportTargetType` discriminator (post | listing)
- **Audit logging (Phase 1 Serilog + SQL sink):** reuse for listing edit history
- **Bairro scoping middleware (Phase 2):** reuse to enforce marketplace grid filtering
- **IMemoryCache:** use for hot category list and marketplace first-page cache

### Established Patterns
- JWT + refresh token cross-origin (HostGator ↔ SmarterASP) — chat and listing APIs must follow same auth flow
- Zod + react-hook-form for all forms — listing create/edit must use same stack
- Zustand stores for client state — add `marketplaceStore` and `chatStore`

### Integration Points
- Feed (Phase 3) and Marketplace (Phase 4) both live in bottom nav — ensure nav state survives route switch
- Report flow reuses Phase 3 endpoint shape with new `targetType` field
- Notification system (from Phase 3 for new posts/comments) extended for new chat messages and rating prompts

</code_context>

<deferred>
## Deferred Ideas

- MKT-012 Paid spotlight / Verified Business badge → Phase 6 (monetization)
- MKT-013 Service scheduling with time slots → backlog
- Block user / user-level mute → Phase 6
- Group chat → Phase 6 (handled by groups feature)
- Cross-bairro / neighboring-bairro visibility → Phase 5+
- Auto-expire stale listings (60d no activity) → Phase 5
- Save-search and recent searches → Phase 5
- Admin CRUD on taxonomy (create/delete categories) → Phase 5
- Mutual buyer↔seller ratings → reassess post-pilot
- Price-change notification for favorites (MKT-009 notification piece) → confirm during planning whether in scope or light-touch

</deferred>

---

*Phase: 04-marketplace-chat*
*Context gathered: 2026-04-07*
