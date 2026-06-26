# Bolao da Copa

Aplicacao Next.js para bolao da Copa com login por usuario/senha, palpites de
placar, escolha do Top 4 e ranking geral.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

No PowerShell com execution policy restritiva, use `npm.cmd` no lugar de `npm`.

## Variaveis de ambiente

```bash
DATABASE_URL=postgres://usuario:senha@host:5432/bolao
ADMIN_SYNC_TOKEN=
CRON_SECRET=
FOOTBALL_PROVIDER=worldcup26
WORLDCUP26_API_BASE_URL=https://worldcup26.ir
WORLDCUP26_GITHUB_BASE_URL=https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main
AUTO_SYNC_MAX_AGE_MINUTES=360
```

Se quiser usar `api-football` depois, configure:

```bash
FOOTBALL_PROVIDER=api-football
FOOTBALL_API_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
```

## Banco

As migrations ficam em `db/migrations/`. No Docker/Railway so as **pendentes**
rodam na subida (tabela `schema_migrations` controla o que ja foi aplicado).
Correcoes pontuais de dados ficam em `db/patches/` e rodam so manualmente.

Deploy com Docker: veja `docs/RAILWAY.md` e `docker-compose.yml`.

### Modelo DB-first

- **Leitura (paginas):** consulta `matches_cache`, `teams_cache`, `groups_cache`
  e `ranking_snapshots` no Postgres.
- **Escrita (background):** `/api/admin/sync-worldcup` puxa `worldcup26.ir`,
  grava no banco e recalcula o ranking quando necessario.
- **Navegacao rapida:** paginas leem o banco direto (`listMatchesCached`) sem
  sync na troca de tela. Sync fica no cron, GitHub Actions ou endpoints admin.

## Pontuacao

- Placar exato: 5 pontos.
- Resultado certo: 3 pontos quando o placar nao for exato.
- Placar proximo: 1 ponto por lado quando a diferenca for de ate um gol.
- Top 4: 10 pontos por posicao exata e 5 pontos se a selecao estiver no Top 4
  oficial em outra posicao.

Para pontuar o Top 4 oficialmente, preencha `teams_cache.payload.final_position`
com valores de 1 a 4 para as selecoes finalistas e recalcule o ranking.

## Endpoints admin

- `POST /api/admin/recalculate-ranking` com header `x-admin-sync-token`.
- `GET|POST /api/admin/sync-worldcup` com `x-admin-sync-token` ou `Authorization: Bearer $CRON_SECRET`.

O sync da Copa usa por padrao `https://worldcup26.ir/get/games` e
`https://worldcup26.ir/get/teams`. Se o endpoint publico falhar, o app tenta
os JSON brutos do GitHub do mesmo projeto.

## Sync automatico

### Vercel Hobby (cron diario)

O `vercel.json` agenda `/api/admin/sync-worldcup` uma vez por dia (`05:00 UTC`).

### GitHub Actions (recomendado na Copa)

O workflow `.github/workflows/sync-worldcup.yml` pode chamar o mesmo endpoint a
cada 5 minutos. Configure em **Settings → Secrets → Actions**:

- `BOLAO_URL` — URL de producao
- `CRON_SECRET` — mesmo valor da env `CRON_SECRET`

### Railway

Use o mesmo endpoint com cron externo ou GitHub Actions apontando para a URL
do app na Railway.

Variaveis: `AUTO_SYNC_MAX_AGE_MINUTES` (padrao 360),
`LIVE_SYNC_MAX_AGE_MINUTES` (padrao 5), `RANKING_REFRESH_MAX_AGE_MINUTES` (padrao 2).
