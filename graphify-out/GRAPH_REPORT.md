# Graph Report - Bolao  (2026-06-25)

## Corpus Check
- 81 files · ~50,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 387 nodes · 847 edges · 25 communities (16 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f134e94`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 23 edges
2. `query()` - 21 edges
3. `listMatches()` - 16 edges
4. `recalculateRanking()` - 16 edges
5. `compilerOptions` - 16 edges
6. `normalizePredictionDocument()` - 15 edges
7. `getLatestRanking()` - 14 edges
8. `getOrCreatePredictionDocument()` - 12 edges
9. `ensureWorldCupData()` - 12 edges
10. `insertSyncLog()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `listMatches()`  [EXTRACTED]
  app/api/worldcup/matches/route.ts → repositories/worldcup.repo.ts
- `RootLayout()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `LoginPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/login/page.tsx → services/auth.service.ts
- `RankingPage()` --calls--> `getLatestRanking()`  [EXTRACTED]
  app/ranking/page.tsx → services/ranking.service.ts
- `recalculateRankingAction()` --calls--> `recalculateRanking()`  [EXTRACTED]
  actions/admin.actions.ts → services/ranking.service.ts

## Import Cycles
- None detected.

## Communities (25 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): Deploy na Railway (2 servicos), Deploy na Railway (branch `feature/railway-docker`), Healthcheck, Sync automatico, Testar local com Docker, Variaveis do servico Bolao

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (58): GET(), countMatches(), getLatestSuccessfulSync(), GroupRow, insertSyncLog(), MatchRow, pruneTeams(), TeamRow (+50 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (32): bulkPredictionSchema, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction(), saveMatchPredictionAction() (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (15): HomePage(), mapWorldCup26Stage(), mapWorldCup26Status(), fetchCollection(), fetchJson(), getLiveFeedHighlights(), getLiveWorldCupData(), LiveGameResponse (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (29): changePasswordAction(), loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (26): CommunityMember, CommunityPredictionsBoard(), RANKING_POLL_MS, RankingLiveBoard(), RankingTable(), TopFourForm(), getMatchTeamLabel(), getPlaceholderLabel() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (24): dependencies, bcryptjs, next, pg, react, react-dom, zod, devDependencies (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (14): recalculateRankingAction(), updateMatchAdminAction(), updateMatchSchema, AdminMatchesPanel(), Filter, isValidAdminToken(), isMatchFinished(), isMatchLive() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): Banco, Bolao da Copa, Comandos, Endpoints admin, GitHub Actions (recomendado na Copa), Modelo DB-first, Pontuacao, Railway (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (37): BulkSaveResult, compactDate(), dayHeading(), isMatchToday(), isSameLocalDay(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps (+29 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (4): client, colList, columns, rows

### Community 18 - "Community 18"
Cohesion: 0.50
Nodes (3): plugins, railway, enabled

## Knowledge Gaps
- **122 isolated node(s):** `enabled`, `updateMatchSchema`, `predictionSchema`, `bulkPredictionSchema`, `topFourSchema` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `Community 1` to `Community 8`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 2` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 1` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `enabled`, `updateMatchSchema`, `predictionSchema` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06126126126126126 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13953488372093023 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._