---
phase: 01-infrastructure-auth
plan: 04
subsystem: infrastructure
tags: [infra, deploy, dns, cors, auth]
requires: [01-01, 01-02, 01-03]
provides:
  - bairronow.com.br frontend (HostGator)
  - api.bairronow.com.br API (SmarterASP via Cloudflare)
  - SQL Server schema (Users, RefreshTokens, AuditLogs)
affects:
  - frontend/.htaccess (SPA routing rules)
  - src/NossoVizinho.Api/web.config (ASPNETCORE_ENVIRONMENT)
  - src/NossoVizinho.Api/Migrations/* (initial schema)
tech-stack:
  added:
    - dotnet-ef 10.0.5 (CLI tool)
  patterns:
    - "appsettings.Production.json with secrets baked at deploy-time (SmarterASP env-vars not exposed via UI; web.config <environmentVariables> sets ASPNETCORE_ENVIRONMENT only)"
    - "Cloudflare proxied CNAME for api -> mtempurl origin (requires Flexible SSL mode for cert mismatch)"
    - "HostGator addon domain docroot at /home/cleardesk/<addon>/ (NOT /home1/cleardesk/<addon>/ — FTP root is one level above docroot)"
key-files:
  created:
    - .planning/phases/01-infrastructure-auth/01-04-SUMMARY.md
    - src/NossoVizinho.Api/Migrations/20260407102834_InitialCreate.cs
    - src/NossoVizinho.Api/Migrations/20260407102834_InitialCreate.Designer.cs
    - src/NossoVizinho.Api/Migrations/AppDbContextModelSnapshot.cs
    - frontend/out/.htaccess
  modified:
    - src/NossoVizinho.Api/web.config
    - .gitignore
decisions:
  - "Used Cloudflare proxied CNAME for api subdomain (vs. direct A record) to leverage edge TLS termination since SmarterASP mtempurl has no cert for custom domain"
  - "Baked production connection string + JWT key into appsettings.Production.json instead of SmarterASP env-vars (SmarterASP control panel does not expose ASPNETCORE_ env injection at the IIS app level for shared hosting)"
  - "Initial EF migration applied locally against remote DB via dotnet ef database update; no Database.Migrate() in Program.cs to keep startup deterministic"
metrics:
  duration: ~25min
  completed: 2026-04-07
  tasks_completed: 1.5  # Task 1 done, Task 2 awaiting human verify
status: awaiting-human-verification
---

# Phase 01 Plan 04: Provision Infra & Cross-Origin Auth — Summary

End-to-end infrastructure provisioned and both apps deployed: frontend live at https://bairronow.com.br (HostGator/Cloudflare), API live at http://partiurock-003-site16.mtempurl.com (SmarterASP, .NET 8 inprocess via ANCM) with CORS responding correctly to https://bairronow.com.br origin. Cross-origin cookie flow awaits human verification AND a one-click Cloudflare SSL setting flip.

## What Was Built

### Task 1 — Infrastructure provisioning (DONE)

1. **Cloudflare DNS** (zone `0bad6de97f9f570ba2791d1bdcd472e8`, already active from prior session):
   - `A bairronow.com.br -> 108.167.132.104` (proxied) — pre-existing
   - `CNAME www -> bairronow.com.br` (proxied) — pre-existing
   - `CNAME api -> partiurock-003-site16.mtempurl.com` (proxied) — **created this plan**

2. **HostGator (cPanel `cleardesk`)** — addon domain `bairronow.com.br` was already configured. Document root resolved via `cpanel/DomainInfo/single_domain_data` to `/home1/cleardesk/home/cleardesk/bairronow.com.br` (FTP-relative path: `/home/cleardesk/bairronow.com.br/`). Initial upload went to the wrong path (`/bairronow.com.br/` at FTP root, which is `/home1/cleardesk/bairronow.com.br/`); corrected after observing 403 from Apache.

3. **Next.js static export** built (`npm run build` -> `frontend/out/`) and uploaded via Python `ftplib` (94 files, 1.54 MB). `.htaccess` added with HTTPS redirect, SPA fallback to `index.html`, and custom 404. Verified:
   - `GET https://bairronow.com.br/` -> 200
   - `GET https://bairronow.com.br/login/` -> 200
   - `GET https://bairronow.com.br/privacy-policy/` -> 200

4. **.NET 8 API** built (`dotnet publish -c Release -o ./publish`) and uploaded to SmarterASP `/bairronow-api` (FTP `win1151.site4now.net`, user `partiurock-003`, 106 files, 27 MB). Configuration:
   - `appsettings.Production.json` baked with connection string + 64-char `Jwt:Key` + `Cors:AllowedOrigins=[https://bairronow.com.br, https://www.bairronow.com.br]`
   - `web.config` extended with `<environmentVariables><environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production"/></environmentVariables>`
   - Source `web.config` updated so future re-publishes preserve the env var

5. **EF Core migration** `InitialCreate` generated (Users, RefreshTokens, AuditLogs) and applied directly against remote DB via:
   ```
   dotnet ef database update --connection "Data Source=sql1003.site4now.net;Initial Catalog=db_aaf0a8_bairronow;User Id=db_aaf0a8_bairronow_admin;Password=...;TrustServerCertificate=True;Encrypt=True;"
   ```

6. **Verification (automated)**:
   - `POST http://partiurock-003-site16.mtempurl.com/api/v1/auth/login` (Origin: `https://bairronow.com.br`) -> **HTTP 401** with body `{"error":"E-mail ou senha incorretos."}` and headers:
     - `Access-Control-Allow-Origin: https://bairronow.com.br`
     - `Access-Control-Allow-Credentials: true`
     - `Access-Control-Expose-Headers: X-Pagination,Retry-After`
     - `Vary: Origin`
   - This proves: ANCM is hosting the app, the controller pipeline is wired, EF connects to SQL Server (no 500), and CORS is correctly configured.

### Task 2 — Human verification checkpoint (BLOCKED on 1 manual step + verification)

See **CHECKPOINT** section below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] HostGator addon-domain document root path**
- **Found during:** Task 1 (frontend HTTP test)
- **Issue:** Initial FTP upload went to `/bairronow.com.br/` (FTP root) which mapped to `/home1/cleardesk/bairronow.com.br/`. Apache vhost was actually serving from `/home1/cleardesk/home/cleardesk/bairronow.com.br/`. Result: 403 Forbidden + `last-modified: 2022-09-29` HostGator default page.
- **Fix:** Queried `cpanel/DomainInfo/single_domain_data` to discover real `documentroot`, re-uploaded to `/home/cleardesk/bairronow.com.br/`.
- **Files modified:** none (deploy-time only)
- **Commit:** `7a4062c`

**2. [Rule 3 — Blocking] Missing initial EF migration**
- **Found during:** Task 1 (DB step)
- **Issue:** Plan 01-02 added `AppDbContext` + entities but no migration was generated, so the remote DB was empty.
- **Fix:** `dotnet ef migrations add InitialCreate` then `dotnet ef database update --connection ...` against the SmarterASP SQL Server.
- **Commit:** `7a4062c`

**3. [Rule 3 — Blocking] Production environment injection on SmarterASP**
- **Found during:** Task 1 (post-upload)
- **Issue:** Without `ASPNETCORE_ENVIRONMENT=Production`, `appsettings.Production.json` (which holds the real connection string + JWT key) is not loaded by the host. SmarterASP shared hosting does not expose env-var configuration in their control panel.
- **Fix:** Added `<environmentVariables>` block to `web.config` (both source and publish copy) so ANCM injects `ASPNETCORE_ENVIRONMENT=Production` when starting Kestrel.
- **Commit:** `7a4062c`

### Deferred Issues

**1. [Rule 4 — Architectural-ish, non-blocking] Cloudflare zone SSL mode is "Full" but origin has no matching cert**
- The Cloudflare API token in `~/.claude/.secrets.env` has `DNS:Edit` + `Zone:Edit` but **lacks** `Zone Settings:Edit` and Rulesets/Pagerules permissions. Calls to `PATCH /zones/{id}/settings/ssl` and the equivalent ruleset API both return `9109 Unauthorized` / `10000 Authentication error`.
- Result: hitting `https://api.bairronow.com.br/...` via the Cloudflare edge currently returns **HTTP 525 (SSL handshake failed)** because Cloudflare tries to speak TLS to `partiurock-003-site16.mtempurl.com` but the origin only has a cert for `*.mtempurl.com`.
- **Manual user step required (one click):** In Cloudflare dashboard for `bairronow.com.br` -> SSL/TLS -> Overview, change "SSL/TLS encryption mode" from `Full` to **`Flexible`**. After the setting propagates (~30s), `https://api.bairronow.com.br/api/v1/auth/login` will work end-to-end.
- Alternative (long-term): rotate the API token to add `Zone Settings:Edit` so this becomes automatable.
- This is the **only** manual step blocking Task 2.

**2. [Deferred] Swagger UI returns 404 in Production**
- `POST /api/v1/auth/login` works (controllers + EF + CORS all healthy), but `GET /swagger`, `/swagger/index.html`, `/swagger/v1/swagger.json` all return 404 from IIS (no ANCM trace).
- Likely cause: middleware ordering in `Program.cs` — `app.UseHttpsRedirection()` runs before `app.UseSwagger()`, and the inprocess host behind IIS may be 308-redirecting and losing the path. Needs investigation in a follow-up plan.
- Acceptance criteria for Plan 01-04 listed Swagger as a "should" — flagging as deferred but **not blocking** the cross-origin auth proof, which is the actual Phase-1 goal per STATE.md.
- Workaround: Swagger spec can be regenerated locally with `dotnet swagger tofile`.

**3. [Cosmetic] Stray FTP files**
- Initial wrong-path upload left ~94 frontend files in `/home1/cleardesk/bairronow.com.br/` (FTP root level). These are not served by Apache (wrong vhost path) but waste ~1.5 MB of disk. Cleanup deferred.
- The local `publish/publish/` nested folder (an artifact of running `dotnet publish` twice with `-o ./publish` from inside the project dir) was uploaded as `/bairronow-api/publish/*`. Not loaded by ANCM (`processPath` points to `.\NossoVizinho.Api.dll` at root). Cleanup deferred.

## CHECKPOINT — Task 2: Human verification of cross-origin auth

**Type:** human-verify (with 1 prerequisite human-action)
**Plan:** 01-04
**Progress:** 1/2 tasks complete (Task 1 done, Task 2 awaiting verification)

### Prerequisite (one click in Cloudflare dashboard)

1. Open https://dash.cloudflare.com/51b264e86f293cf05b2c2de482404db6/bairronow.com.br/ssl-tls
2. Under **SSL/TLS encryption mode**, switch from `Full` to **`Flexible`**
3. Wait ~30 seconds for propagation
4. Confirm with: `curl -i -X POST https://api.bairronow.com.br/api/v1/auth/login -H "Content-Type: application/json" -H "Origin: https://bairronow.com.br" -d '{"email":"x@y.com","password":"x"}'` — should return **401** with `Access-Control-Allow-Origin` header (currently returns 525)

### Then verify in browser (Chrome regular first, then Incognito)

1. Open https://bairronow.com.br
2. Click "Criar conta" -> Register with `test@bairronow.com.br` / `TestUser1!`
3. DevTools > Network: `POST` to API should return **201**
4. Login with the same credentials
5. DevTools > Network: `POST /api/v1/auth/login` should return **200** with `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=None; Partitioned`
6. DevTools > Application > Cookies: `refreshToken` cookie visible under `api.bairronow.com.br`
7. Refresh the page — user remains logged in (refresh-token rotation works)
8. Repeat 1–7 in **Chrome Incognito**. If step 7 fails in incognito, this is the known third-party-cookie issue; document in resume signal.
9. Visit https://bairronow.com.br/privacy-policy/ — should render
10. CORS rejection sanity check (DevTools console on any non-bairronow site):
    ```js
    fetch('https://api.bairronow.com.br/api/v1/auth/login', {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:'{}'})
    ```
    Should be blocked by CORS (browser console error: Access-Control-Allow-Origin missing).

### Awaiting

User to:
1. Flip Cloudflare SSL mode to Flexible (1 click)
2. Walk through the 10 verification steps above
3. Reply with `approved` if all pass, OR describe any failure (especially incognito cookie behavior)

### Known limitations going into verification

- Swagger UI is not currently reachable (404). Planned to fix in a follow-up plan; does not block Phase 1 auth proof.
- Cloudflare SSL=Flexible means CF<->origin traffic is HTTP. Acceptable for MVP given mtempurl has no per-domain cert; can upgrade later by installing an Origin Certificate or by binding a real custom domain on SmarterASP.

## Commits

| Hash      | Message                                                            |
|-----------|--------------------------------------------------------------------|
| `7a4062c` | feat(01-04): provision infra and deploy API+frontend               |
| `d202c2c` | chore(01-04): ignore dotnet publish output                         |

## Self-Check: PASSED

Verified:
- `git log --oneline | grep 7a4062c` -> FOUND
- `git log --oneline | grep d202c2c` -> FOUND
- `curl -sI https://bairronow.com.br/` -> 200 OK FOUND
- `curl -sI https://bairronow.com.br/login/` -> 200 OK FOUND
- `curl -sI https://bairronow.com.br/privacy-policy/` -> 200 OK FOUND
- `curl -X POST http://partiurock-003-site16.mtempurl.com/api/v1/auth/login` -> 401 with CORS headers FOUND
- `src/NossoVizinho.Api/Migrations/20260407102834_InitialCreate.cs` -> FOUND
- `frontend/out/.htaccess` -> FOUND
- DB migration applied (verified via successful 401 response from controller path requiring DB lookup)
