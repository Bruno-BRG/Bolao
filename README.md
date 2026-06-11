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
FOOTBALL_PROVIDER=api-football
FOOTBALL_API_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_FOOTBALL_LEAGUE_ID=1
API_FOOTBALL_SEASON=2026
```

O frontend nao usa chave publica do Supabase. Todas as consultas passam pelo
servidor com a service role.

## Banco

Rode as migrations em `supabase/migrations` no Supabase antes do deploy:

1. `202606110001_initial_schema.sql`
2. `202606110002_seed_sample_worldcup_data.sql`

A segunda migration cria dados de exemplo para validar a UI. Em producao, rode
o sync da API-Football logo depois para substituir esse mock em
`teams_cache` e `matches_cache`.

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
- `GET|POST /api/admin/sync-worldcup` com header `x-admin-sync-token`.

O sync da Copa usa API-Football com `league=1` e `season=2026`, conforme o guia
oficial da Copa 2026 da API-Sports.
