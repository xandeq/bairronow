# BairroNow API Smoke (newman)

Lightweight Postman collection hit against the live API on a schedule from
`.github/workflows/smoke.yml`.

## Run locally

```bash
npx -y newman run smoke.postman_collection.json --env-var baseUrl=https://api.bairronow.com.br
```

Requests:
- `GET /health` -> expect `200` and `status=ok`
- `GET /api/v1/cep/29101010` -> expect `200`, body includes `Praia da Costa`
- `GET /api/v1/cep/00000000` -> expect `404`
