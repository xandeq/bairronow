# Resume Prompt — Phase 2 QA Fixes + E2E Infra

Paste this into a fresh Claude Code session to pick up exactly where we stopped.

---

Continue BairroNow Phase 2 work. Read `memory/project_bairronow_phase2_state.md` and `D:\tmp\qa-phase2\REPORT.md` for context. Then:

## 1. Fix 4 QA bugs (atomic commits)

### B1 — Login doesn't redirect after success
File: `frontend/src/components/forms/LoginForm.tsx` (grep for submit handler)
Fix: after auth success, `router.replace('/feed')` (or `/cep-lookup` if user has no `bairroId`). Check `RegisterForm.tsx` for the redirect pattern already in use.
Commit: `fix(02-02): redirect after login based on onboarding state`

### B3 — /admin/verifications crashes
File: `frontend/src/app/(main)/admin/verifications/page.tsx`
Error: `Cannot read properties of undefined (reading 'length')`
Cause: frontend expects `{items:[]}`, API returns bare array. Pick smallest change — most likely adjust frontend to consume array directly. Verify against `packages/shared-api-client/src/index.ts` and backend `AdminController`.
Commit: `fix(02-02): handle bare array response in admin verifications queue`

### B2 — Admin approve 411 (IIS requires Content-Length)
File: `packages/shared-api-client/src/index.ts` — approve/reject functions
Fix: send `{}` as POST body so axios sets Content-Length automatically.
Commit: `fix(02-02): send empty body to avoid IIS 411 on admin approve`

### G1 — Admin seeding gap
File: `src/NossoVizinho.Api/Program.cs` (or new `SeedData.cs`)
Fix: on startup, read `BAIRRONOW_ADMIN_EMAIL` env var. If set and a user with that email exists, set `IsAdmin=true`. If user doesn't exist, skip silently.
Commit: `feat(02-01): BAIRRONOW_ADMIN_EMAIL env-based admin seeding`

Build checks:
- `dotnet build src/NossoVizinho.Api` green
- `pnpm --filter @bairronow/frontend build` green

## 2. Add E2E infrastructure

### Playwright suite
- Create `e2e/` workspace package (add to `pnpm-workspace.yaml`)
- `e2e/package.json` as `@bairronow/e2e` with @playwright/test
- `e2e/playwright.config.ts` — baseURL https://bairronow.com.br, chromium, retries 1
- `e2e/tests/auth.spec.ts` — register (timestamp email), assert redirect, logout, login, assert redirect
- `e2e/tests/verification.spec.ts` — register → CEP 29101010 → proof upload (fixture e2e/fixtures/proof.png, 8×8 red PNG) → /pending → admin approve via API with E2E_ADMIN creds → profile verified badge visible
- Root `package.json`: add `"test:e2e": "pnpm --filter @bairronow/e2e test"`
Commit: `test(e2e): add Playwright suite with auth + verification specs`

### Newman API smoke collection
- `e2e/postman/smoke.postman_collection.json` — /health 200, /cep/29101010 200 + "Praia da Costa", /cep/00000000 404
- `e2e/postman/README.md` with run command
- Update `.github/workflows/smoke.yml` cron to run newman
- Create `.github/workflows/e2e.yml` — workflow_dispatch only, runs `pnpm test:e2e`, uses secrets E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
Commit: `test(e2e): add newman smoke collection and CI workflows`

## 3. Push + verify
- `git push origin master`
- Watch deploy-frontend + deploy-backend workflows, confirm both green
- Manually smoke test the B1 login redirect and B3 admin page fixes at https://bairronow.com.br
- Test user for admin testing: `qa+1775588857@bairronow.test` / `TestPass123` (already admin+verified in DB)

## 4. After fixes ship, start 02-03 mobile
Execute `.planning/phases/02-verification-neighborhoods/02-03-PLAN.md`:
- Spawn gsd-executor with the plan
- Mobile onboarding screens consume same shared-api-client + validators (already updated in 02-02)
- After commits, trigger EAS preview build via mobile-build.yml workflow_dispatch (requires EXPO_TOKEN secret)

## Success criteria
- [ ] 4 fix commits landed
- [ ] 2 e2e infra commits landed
- [ ] Both deploys green
- [ ] Login redirects correctly in browser
- [ ] /admin/verifications renders without crash
- [ ] 02-03 mobile plan started
