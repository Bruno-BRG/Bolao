# Deploy na Railway (branch `feature/railway-docker`)

Stack self-hosted com Postgres + Next.js.

## Testar local com Docker

```bash
docker compose up --build
```

- App: http://localhost:3000
- Health: http://localhost:3000/api/health

Na primeira subida o container `web` roda apenas migrations **pendentes** em
`db/migrations/` (controle em `schema_migrations`). Patches em `db/patches/`
nao rodam automaticamente.

## Deploy na Railway (2 servicos)

1. **Postgres** — plugin PostgreSQL na Railway
2. **Bolao** — app Next.js (Dockerfile na raiz)

### Variaveis do servico Bolao

| Variavel | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ADMIN_SYNC_TOKEN` | token forte para admin |
| `CRON_SECRET` | token para sync/cron |
| `FOOTBALL_PROVIDER` | `worldcup26` |
| `WORLDCUP26_API_BASE_URL` | `https://worldcup26.ir` |
| `WORLDCUP26_GITHUB_BASE_URL` | `https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main` |

O entrypoint:

1. Espera o Postgres
2. Roda migrations pendentes em `db/migrations/`
3. Sobe `next start`

Para pular migrations: `SKIP_MIGRATIONS=1`.

## Healthcheck

- `/api/live` — servidor no ar
- `/api/health` — Postgres acessivel

## Sync automatico

Use GitHub Actions ou cron externo chamando:

`GET /api/admin/sync-worldcup` com `Authorization: Bearer $CRON_SECRET`
