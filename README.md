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
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SYNC_TOKEN=
CRON_SECRET=
FOOTBALL_PROVIDER=worldcup26
WORLDCUP26_API_BASE_URL=https://worldcup26.ir
WORLDCUP26_GITHUB_BASE_URL=https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main
AUTO_SYNC_MAX_AGE_MINUTES=360
```

O frontend nao usa chave publica do Supabase. Todas as consultas passam pelo
servidor com a service role.

Se quiser usar `api-football` depois, configure:

```bash
FOOTBALL_PROVIDER=api-football
FOOTBALL_API_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
```

## Banco

Rode as migrations em `supabase/migrations` no Supabase antes do deploy:

1. `202606110001_initial_schema.sql`
2. `202606110002_seed_sample_worldcup_data.sql` (legado)
3. `202606110003_remove_sample_worldcup_data.sql` (legado)
4. `202606110004_groups_cache.sql`
5. `202606110005_seed_worldcup_baseline.sql`

Antes de rodar a `005`, edite o arquivo e preencha times, jogos ja realizados
e classificacao dos grupos usando os mesmos IDs da API `worldcup26.ir`. O sync
em background faz upsert por `external_id` sem apagar linhas manuais.

### Apos o seed manual

1. Usuarios salvam palpites normalmente.
2. Gere o primeiro ranking com uma das opcoes:
   - Botao **Recalcular ranking** na pagina `/ranking` (token admin), ou
   - `POST /api/admin/sync-worldcup` com `x-admin-sync-token` ou `CRON_SECRET`, ou
   - Aguarde o cron (a cada 5 min em producao).

Sem esse passo, o ranking usa o fallback de `user_predictions` ate existir um
`snapshot` em `ranking_snapshots`.

### Modelo DB-first

- **Leitura (paginas):** consulta apenas `matches_cache`, `teams_cache`,
  `groups_cache` e `ranking_snapshots`.
- **Escrita (background):** cron ou admin chama `/api/admin/sync-worldcup`, que
  puxa `worldcup26.ir`, grava no banco e recalcula o ranking quando necessario.

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

- As paginas **nao** chamam a API externa nem recalculam ranking na abertura.
- O cron em `vercel.json` chama `/api/admin/sync-worldcup` a cada 5 minutos.
- `ensureWorldCupData` respeita `AUTO_SYNC_MAX_AGE_MINUTES` (padrao 360) e
  `LIVE_SYNC_MAX_AGE_MINUTES` (padrao 5) durante jogos ao vivo.
- Na Vercel Hobby, cron mais frequente que diario pode exigir plano Pro; se o
  deploy falhar, volte para `0 5 * * *` e dispare o sync manualmente durante os jogos.
