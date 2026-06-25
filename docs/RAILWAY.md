# Deploy na Railway (branch `feature/railway-docker`)

Stack self-hosted para testar o Bolao fora da Vercel/Supabase cloud:

- **Postgres** — banco de dados
- **PostgREST** — API REST compativel com `supabase-js`
- **API Gateway (nginx)** — expoe `/rest/v1` como o Supabase cloud
- **Next.js** — app com migrations automaticas na subida

## Testar local com Docker

```bash
docker compose up --build
```

Acesse:

- App: http://localhost:3000
- Health: http://localhost:3000/api/health
- API REST: http://localhost:8000/rest/v1/tournaments

Na primeira subida o container `web` roda todas as migrations em `supabase/migrations/`.

## Variaveis importantes

Copie `.env.docker.example` para `.env.docker` se quiser sobrescrever algo.
No compose, os valores ja estao embutidos para dev.

Para gerar um novo `SUPABASE_SERVICE_ROLE_KEY`:

```bash
JWT_SECRET=seu-segredo-com-pelo-menos-32-chars node scripts/generate-service-role-jwt.mjs
```

O mesmo `JWT_SECRET` precisa estar no PostgREST (`PGRST_JWT_SECRET`).

## Deploy na Railway (3 servicos + Postgres)

Crie um projeto na [Railway](https://railway.app) apontando para a branch
`feature/railway-docker`.

### 1. Postgres

Adicione o plugin **PostgreSQL**. Anote a variavel `DATABASE_URL` que a Railway
gera (formato `postgres://...`).

### 2. PostgREST

Novo servico a partir do mesmo repo:

- **Image:** `postgrest/postgrest:v12.2.8`
- **Variaveis:**

| Variavel | Valor |
|----------|-------|
| `PGRST_DB_URI` | `${{Postgres.DATABASE_URL}}` |
| `PGRST_DB_SCHEMAS` | `public` |
| `PGRST_DB_ANON_ROLE` | `anon` |
| `PGRST_JWT_SECRET` | (gere um segredo forte, 32+ chars) |
| `PGRST_SERVER_PORT` | `${{PORT}}` |

### 3. API Gateway (nginx)

Novo servico com Dockerfile em `docker/api-gateway/Dockerfile`:

| Variavel | Valor |
|----------|-------|
| `POSTGREST_HOST` | `${{PostgREST.RAILWAY_PRIVATE_DOMAIN}}` |

Gere um dominio publico para este servico — sera a base do `SUPABASE_URL`.

### 4. App (Next.js)

Servico principal (usa `Dockerfile` e `railway.toml` na raiz):

| Variavel | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `SUPABASE_URL` | `https://<dominio-publico-do-api-gateway>` |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT gerado com o mesmo `JWT_SECRET` do PostgREST |
| `ADMIN_SYNC_TOKEN` | token forte para admin |
| `CRON_SECRET` | token para sync/cron |
| `FOOTBALL_PROVIDER` | `worldcup26` |
| `WORLDCUP26_API_BASE_URL` | `https://worldcup26.ir` |
| `WORLDCUP26_GITHUB_BASE_URL` | `https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main` |

O entrypoint do container:

1. Espera o Postgres ficar pronto
2. Roda migrations em ordem alfabetica
3. Sobe `next start` na porta `$PORT`

Para pular migrations (ex.: redeploy rapido): `SKIP_MIGRATIONS=1`.

### 5. Sync automatico na Railway

A Vercel cron nao roda aqui. Opcoes:

- GitHub Actions (ja existe `.github/workflows/sync-worldcup.yml`) com `BOLAO_URL`
  apontando para o dominio Railway
- Cron externo chamando `GET /api/admin/sync-worldcup` com header
  `Authorization: Bearer $CRON_SECRET`

## Healthcheck

Railway usa `/api/health` (configurado em `railway.toml`). Retorna `{ ok: true, database: "ok" }`
quando Postgres + PostgREST estao acessiveis.

## Seguranca

Troque obrigatoriamente em producao:

- `JWT_SECRET` / `PGRST_JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (regenere apos trocar o secret)
- `ADMIN_SYNC_TOKEN` e `CRON_SECRET`
- Senha do Postgres (Railway ja gera uma forte)

## Troubleshooting

| Sintoma | Causa provavel |
|---------|----------------|
| `Missing SUPABASE_URL` | Env nao configurada no servico web |
| Health 500 / database error | PostgREST fora do ar ou JWT errado |
| Migrations falham | `DATABASE_URL` incorreta ou Postgres ainda subindo |
| `rest/v1` 404 | `SUPABASE_URL` deve ser o gateway nginx, nao o PostgREST direto |

## Voltar para Vercel + Supabase cloud

Use a branch `main` normalmente. A migration `000000_railway_postgrest_bootstrap.sql`
e idempotente e nao atrapalha o Supabase hosted.
