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
2. `202606110002_seed_sample_worldcup_data.sql`
3. `202606110003_remove_sample_worldcup_data.sql`

As migrations `2` e `3` existem por legado do setup inicial. A `3` apaga os
dados mockados da Copa. Depois disso, o app sincroniza a grade real usando
`worldcup26.ir`, com fallback para os JSON publicos do GitHub do projeto
`rezarahiminia/worldcup2026`.

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

- Quando `matches_cache` estiver vazio, a primeira leitura de jogos tenta sincronizar automaticamente.
- Se o ultimo sync bem-sucedido tiver mais que `AUTO_SYNC_MAX_AGE_MINUTES`, a leitura pode renovar os dados.
- Em producao, `vercel.json` agenda `/api/admin/sync-worldcup` diariamente as `05:00 UTC`.
- Na Vercel Hobby, cron mais frequente que diario falha no deploy segundo a documentacao oficial.
