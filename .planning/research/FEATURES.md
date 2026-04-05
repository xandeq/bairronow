# Feature Landscape

**Domain:** Neighborhood social network (Brazil)
**Researched:** 2026-04-05

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Address verification (CEP + doc upload) | Core trust mechanism. Without it, no reason to use over WhatsApp groups | High | CEP lookup + image upload + admin review |
| Neighborhood-scoped feed | Users expect to see posts only from their bairro | Medium | Filter by bairro from CEP data |
| User profiles | Basic identity: name, photo, neighborhood, join date | Low | |
| Post creation (text + images) | Core interaction unit | Medium | Image compression + upload to server |
| Notifications (real-time) | Users expect to know when neighbors interact | Medium | SignalR + in-app notification center |
| Search within neighborhood | Find posts, neighbors, events | Medium | SQL Server full-text search |
| Mobile-responsive design | 85%+ of Brazilian internet users are on mobile | Low | Tailwind responsive classes |
| Registration + login | Email/password with JWT | Medium | JWT + refresh tokens |

## Differentiators

Features that set product apart from WhatsApp groups (the real competitor).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Verified neighbor badge | Trust that person actually lives nearby | Low (UI) | Display based on verification status |
| Local marketplace | Buy/sell with trusted neighbors (contact-only MVP) | Medium | Category-based listings with images |
| Event creation + RSVP | Organize neighborhood meetups | Medium | Calendar view, attendee list |
| Community groups | Sub-communities within bairro (pet owners, parents, etc.) | Medium | Group feed, membership |
| Neighbor map | Visual representation of verified residents | High | Requires lat/lng from BrasilAPI CEP v2 |
| Local business ads | Relevant ads from nearby businesses | Medium | Revenue model, geo-targeted |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| In-app payments/transactions | Legal complexity (PCI, Brazilian payment regulations), high dev cost | Contact-only marketplace: show phone/WhatsApp |
| Video posts | Storage/bandwidth costs destroy free-tier hosting | Image-only posts, link to YouTube if needed |
| Private messaging (DM) | Liability for private conversations, moderation nightmare | Show WhatsApp number on profile (opt-in) |
| Social login (Google/Facebook) | Extra complexity, privacy concerns in Brazil (LGPD) | Email/password is sufficient for MVP |
| Multi-city at launch | Dilutes focus, harder to validate | Pilot in Vila Velha only |
| AI content moderation | Cost, complexity, false positives | Manual admin moderation for MVP |

## Feature Dependencies

```
CEP Lookup API -> Address Verification -> Neighborhood Assignment -> Neighborhood Feed
Registration -> Profile -> Post Creation -> Feed
Registration -> Verification -> Marketplace Listing
Registration -> Verification -> Event Creation
SignalR Connection -> Real-time Notifications
```

## MVP Recommendation

Prioritize (Phase 1):
1. Auth (register/login/JWT) - gate to everything
2. CEP lookup + address verification - core value
3. Neighborhood feed (posts with images) - daily engagement
4. User profiles - identity

Phase 2:
5. Marketplace (contact-only listings)
6. Real-time notifications
7. Events + RSVP
8. Community groups

Defer: Neighbor map (requires good lat/lng data, complex UI), local business ads (need users first).
