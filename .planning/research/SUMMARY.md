# Research Summary: NossoVizinho

**Domain:** Neighborhood social network (Brazil)
**Researched:** 2026-04-05
**Overall confidence:** HIGH

## Executive Summary

NossoVizinho's stack is pre-decided (Next.js 15 + .NET Core 8 + SQL Server) with clear hosting constraints (HostGator for static frontend, SmarterASP for API). The research focused on selecting the best libraries within these constraints. The .NET ecosystem is mature and well-suited: built-in rate limiting, JWT auth, and SignalR eliminate the need for third-party dependencies in those areas. EF Core 8, FluentValidation 12, and ImageSharp 3.1 are the clear winners for ORM, validation, and image processing respectively.

The most critical architectural decision is how Next.js is deployed: it must be a static export (`output: 'export'`), which disables server components, API routes, middleware, and image optimization. Every frontend feature must be built with this constraint in mind from day 1.

Brazil-specific concerns are well-served by free APIs: ViaCEP for primary CEP lookup, BrasilAPI v2 as fallback with geolocation data. The key insight is that CEP does not map 1:1 to neighborhoods -- a normalization layer is required to group multiple CEPs into a single bairro.

The biggest risks are cross-origin auth (frontend and backend on different hosts), static export limitations being discovered late, and SmarterASP app pool recycling clearing in-memory cache. All are manageable with upfront configuration.

## Key Findings

**Stack:** EF Core 8 + FluentValidation 12 + ImageSharp 3.1 + built-in rate limiting/JWT/SignalR. Zustand + react-hook-form + zod on frontend.
**Architecture:** Static Next.js export (HostGator) calling .NET 8 API (SmarterASP). Clean Architecture with MediatR. CEP cached in IMemoryCache.
**Critical pitfall:** Next.js static export disables most server features. Must be enforced from project init.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation + Auth** - Set up both projects, configure CORS, implement JWT + refresh tokens, deploy skeleton to both hosts
   - Addresses: Registration, login, cross-origin setup
   - Avoids: CORS pitfall (#3) by proving it works before building on top

2. **CEP + Verification** - CEP lookup service with caching, neighborhood normalization table, address verification flow
   - Addresses: Core trust mechanism, neighborhood assignment
   - Avoids: CEP mapping pitfall (#4) by building normalization early

3. **Feed + Posts** - Neighborhood-scoped feed, post creation with image upload, basic profiles
   - Addresses: Daily engagement features, image handling
   - Avoids: Image upload pitfalls (#5, #10) with proper config

4. **Real-time + Social** - SignalR notifications, marketplace, events, groups
   - Addresses: Engagement and retention features
   - Avoids: SignalR JWT pitfall (#2) with short-lived tokens

**Phase ordering rationale:**
- Auth must come first because everything requires it and CORS must be proven early
- CEP/verification is the core value prop and creates the neighborhood data model other features depend on
- Feed is the daily engagement loop, needs working auth + neighborhoods
- Social features build on the established user base and feed

**Research flags for phases:**
- Phase 1: Needs careful CORS + cookie testing between HostGator and SmarterASP
- Phase 2: CEP-to-neighborhood mapping needs real Vila Velha data validation
- Phase 3: SmarterASP file upload limits need web.config testing
- Phase 4: SignalR reconnection after app pool recycle needs testing

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified on NuGet/npm with current versions |
| Features | HIGH | Standard social network feature set, well-understood domain |
| Architecture | HIGH | Static export + API is a proven pattern; constraints are clear |
| Pitfalls | HIGH | Cross-origin, static export, CEP mapping are well-documented issues |

## Gaps to Address

- SmarterASP exact SQL Server version and limitations (need to check during Phase 1)
- HostGator cPanel exact Node.js/static file serving capabilities (test during Phase 1 deploy)
- Vila Velha CEP data quality -- how many unique bairros, CEP coverage (validate in Phase 2)
- SmarterASP max upload size and web.config override permissions (test in Phase 3)
