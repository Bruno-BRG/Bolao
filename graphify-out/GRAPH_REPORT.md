# Graph Report - Bolao  (2026-06-11)

## Corpus Check
- 49 files · ~40,466 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 244 nodes · 521 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f40bc211`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `getSupabaseAdmin()` - 30 edges
2. `compilerOptions` - 16 edges
3. `getCurrentUser()` - 15 edges
4. `recalculateRanking()` - 14 edges
5. `normalizePredictionDocument()` - 13 edges
6. `getOrCreatePredictionDocument()` - 12 edges
7. `listMatches()` - 10 edges
8. `getLatestRanking()` - 9 edges
9. `getLiveWorldCupData()` - 8 edges
10. `savePredictionAction()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `POST()` --calls--> `recalculateRanking()`  [EXTRACTED]
  app/api/admin/recalculate-ranking/route.ts → services/ranking.service.ts
- `POST()` --calls--> `recalculateRanking()`  [EXTRACTED]
  app/api/admin/sync-worldcup/route.ts → services/ranking.service.ts
- `GET()` --calls--> `getSupabaseAdmin()`  [EXTRACTED]
  app/api/health/route.ts → lib/supabase-server.ts
- `GET()` --calls--> `getLatestRanking()`  [EXTRACTED]
  app/api/ranking/route.ts → services/ranking.service.ts

## Import Cycles
- None detected.

## Communities (15 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (26): getTeamLabel(), HomePage(), MatchStatusCard(), ChaveamentoPage(), STAGE_LABELS, BracketGraph(), BracketNode(), getStatusLabel() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (20): GET(), getSupabaseAdmin(), getLatestSyncLog(), API_FOOTBALL_LEAGUE_ID, API_FOOTBALL_SEASON, ApiFootballFixtureResponse, apiFootballGet(), ApiFootballResponse (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (19): ensureUnique(), predictionSchema, savePredictionAction(), saveTopFourAction(), topFourSchema, AuthForms(), DashboardPage(), LoginPage() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (22): fetchGames(), fetchJson(), fetchTeams(), getTimeZoneOffsetMilliseconds(), hasWorldCup26TimezoneDrift(), mapWorldCup26Stage(), mapWorldCup26Status(), normalizeWorldCup26Kickoff() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (20): loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout(), SidebarItem (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (17): formatStatus(), PredictionForm(), TopFourForm(), FINISHED_STATUSES, LOCKED_STATUSES, SCORING_RULES, calculatePredictionScore(), getOutcome() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, next, react, react-dom, @supabase/supabase-js, zod, devDependencies (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (11): recalculateRankingAction(), RankingTable(), RankingPage(), GET(), POST(), listPredictionRows(), getLatestRanking(), getUserInfo() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (7): Banco, Bolao da Copa, Comandos, Endpoints admin, Pontuacao, Sync automatico, Variaveis de ambiente

## Knowledge Gaps
- **78 isolated node(s):** `predictionSchema`, `topFourSchema`, `STAGE_LABELS`, `metadata`, `SidebarItem` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 8`, `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `Community 2` to `Community 4`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 8` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `predictionSchema`, `topFourSchema`, `STAGE_LABELS` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11290322580645161 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1425287356321839 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09686609686609686 - nodes in this community are weakly interconnected._