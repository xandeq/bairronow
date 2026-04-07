# Domain Pitfalls

**Domain:** Neighborhood social network (Brazil)
**Researched:** 2026-04-05

## Critical Pitfalls

### Pitfall 1: Next.js Static Export Limitations
**What goes wrong:** Next.js `output: 'export'` disables Server Components, API Routes, middleware, ISR, and image optimization. Developers build features assuming full Next.js then discover they don't work on static export.
**Why it happens:** HostGator cPanel cannot run Node.js server.
**Consequences:** Rewrite of any feature using server-side Next.js capabilities.
**Prevention:** From day 1, configure `output: 'export'` and never use: `getServerSideProps`, API routes, `next/image` (remote loader), middleware, `cookies()`, `headers()`. Use `next/image` only with `unoptimized: true`.
**Detection:** Build fails or blank pages after `next build`.

### Pitfall 2: SignalR JWT via Query String Exposure
**What goes wrong:** Browser WebSocket API cannot set HTTP headers. SignalR sends JWT as query string parameter `?access_token=xxx`. This token appears in server logs.
**Why it happens:** Browser limitation, not a bug.
**Consequences:** Token leakage in logs.
**Prevention:** Use short-lived tokens (15 min). Strip `access_token` from server logs. Configure `OnMessageReceived` event in JWT middleware to read from query string only for SignalR hub path.

### Pitfall 3: CORS Misconfiguration Between Domains
**What goes wrong:** Frontend on `bairronow.com.br` (HostGator) calling API on `api.bairronow.com.br` (SmarterASP). Browsers block cross-origin requests if CORS is wrong. httpOnly cookies require `SameSite=None; Secure`.
**Why it happens:** Two different origins on different hosting providers.
**Consequences:** Auth flow breaks, refresh tokens don't send.
**Prevention:** Configure CORS explicitly in .NET: allow specific origin, allow credentials. Set cookie `SameSite=None; Secure; Domain=.bairronow.com.br`. Test in browser early.

### Pitfall 4: CEP Does Not Map 1:1 to Neighborhoods
**What goes wrong:** A single CEP can span multiple bairros, or a bairro can have dozens of CEPs. Using CEP as neighborhood ID creates wrong groupings.
**Why it happens:** Brazilian postal codes are delivery routes, not administrative boundaries.
**Consequences:** Users see posts from wrong neighborhood.
**Prevention:** Use CEP to get `bairro` + `localidade` (city) from ViaCEP. Create a `Neighborhoods` table keyed on `(bairro_name, city, state)`. Multiple CEPs map to one neighborhood. Allow admin to merge/split neighborhoods.

## Moderate Pitfalls

### Pitfall 5: SmarterASP File Upload Size Limits
**What goes wrong:** SmarterASP has default upload limits (~4MB for IIS). Large utility bill scans or high-res photos fail silently.
**Prevention:** Set `web.config` `maxAllowedContentLength` to 10MB. Also set Kestrel `MaxRequestBodySize`. Compress images client-side before upload.

### Pitfall 6: SQL Server Connection Pool Exhaustion
**What goes wrong:** Not disposing DbContext properly causes connection pool to fill up.
**Prevention:** Always use DI scoped lifetime for DbContext. Never create DbContext manually. Use `async/await` on all EF calls.

### Pitfall 7: JWT Refresh Token Theft
**What goes wrong:** If refresh token is stolen (XSS), attacker has long-lived access.
**Prevention:** Store refresh token in httpOnly cookie (not localStorage). Implement token rotation: each refresh invalidates the old token. Detect token reuse.

### Pitfall 8: IMemoryCache Lost on App Pool Recycle
**What goes wrong:** SmarterASP recycles app pool on inactivity. All cached data vanishes.
**Prevention:** Design for cache-miss gracefully. CEP cache rebuilds on demand. Rate limit counters resetting is acceptable for MVP.

## Minor Pitfalls

### Pitfall 9: Brazilian Date/Number Formatting
**What goes wrong:** Dates shown as MM/DD/YYYY, numbers with wrong separators.
**Prevention:** Set `pt-BR` locale globally. Use `date-fns` with `pt-BR` locale on frontend.

### Pitfall 10: Image Orientation from Mobile Cameras
**What goes wrong:** Photos uploaded from phones appear rotated.
**Prevention:** ImageSharp auto-rotates based on EXIF data by default. Ensure `AutoOrient()` is in the processing pipeline.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Auth setup | CORS + cookie issues between HostGator and SmarterASP | Test cross-origin auth flow first |
| CEP/Verification | CEP-to-neighborhood mapping is not 1:1 | Build neighborhood normalization table early |
| Image uploads | SmarterASP file size limits, IIS config | Configure web.config + client compression from start |
| Real-time (SignalR) | JWT in query string, reconnection on app pool recycle | Short-lived tokens, auto-reconnect in client |
| Static export | Features that require Node.js server | Enforce `output: 'export'` from day 1 |
