# @bairronow/e2e

End-to-end tests for BairroNow. Runs against live production by default.

## Install

```bash
pnpm install
pnpm --filter @bairronow/e2e exec playwright install --with-deps chromium
```

## Run

```bash
pnpm test:e2e
```

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `BAIRRONOW_WEB_URL` | `https://bairronow.com.br` | Frontend base URL |
| `BAIRRONOW_API_URL` | `https://api.bairronow.com.br` | API base URL |
| `E2E_ADMIN_EMAIL` | — | Admin account used by the verification spec |
| `E2E_ADMIN_PASSWORD` | — | Admin password used by the verification spec |

If the admin creds are not set, the verification spec is skipped automatically.
