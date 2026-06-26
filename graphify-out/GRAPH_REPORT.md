# Graph Report - Bolao  (2026-06-26)

## Corpus Check
- 82 files · ~52,074 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 403 nodes · 897 edges · 26 communities (18 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fde485d8`
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
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 23 edges
2. `query()` - 22 edges
3. `recalculateRanking()` - 18 edges
4. `listMatches()` - 16 edges
5. `compilerOptions` - 16 edges
6. `normalizePredictionDocument()` - 15 edges
7. `getLatestRanking()` - 14 edges
8. `getOrCreatePredictionDocument()` - 12 edges
9. `listTeams` - 12 edges
10. `ensureWorldCupData()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `LoginPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/login/page.tsx → services/auth.service.ts
- `RankingPage()` --calls--> `getLatestRanking()`  [EXTRACTED]
  app/ranking/page.tsx → services/ranking.service.ts
- `syncWorldCupAdminAction()` --calls--> `syncWorldCupData()`  [EXTRACTED]
  actions/admin.actions.ts → services/worldcup-sync.service.ts
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts

## Import Cycles
- None detected.

## Communities (26 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): Deploy na Railway (2 servicos), Deploy na Railway (branch `feature/railway-docker`), Healthcheck, Sync automatico, Testar local com Docker, Variaveis do servico Bolao

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (50): countMatches(), getLatestSuccessfulSync(), GroupRow, insertSyncLog(), MatchRow, pruneTeams(), TeamRow, upsertGroups() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (34): bulkPredictionSchema, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction(), saveMatchPredictionAction() (+26 more)

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
Cohesion: 0.10
Nodes (32): createMatchAdminAction(), createMatchSchema, recalculateRankingAction(), revalidateMatchPaths(), syncWorldCupAdminAction(), updateMatchAdminAction(), updateMatchSchema, AdminMatchesPanel() (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): Banco, Bolao da Copa, Comandos, Endpoints admin, GitHub Actions (recomendado na Copa), Modelo DB-first, Pontuacao, Railway (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (31): BulkSaveResult, isMatchToday(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps, RowStatus, ScoreState, stageChip() (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (4): client, colList, columns, rows

### Community 18 - "Community 18"
Cohesion: 0.50
Nodes (3): plugins, railway, enabled

### Community 22 - "Community 22"
Cohesion: 0.70
Nodes (3): run-migrations.sh script, bootstrap_existing_database(), mark_migration_applied()

### Community 25 - "Community 25"
Cohesion: 0.39
Nodes (7): SCORING_RULES, calculatePredictionScore(), getOutcome(), OfficialTopFour, resolveOfficialTopFour(), scoreMatchPrediction(), scoreTopFourPrediction()

## Knowledge Gaps
- **126 isolated node(s):** `enabled`, `updateMatchSchema`, `createMatchSchema`, `predictionSchema`, `bulkPredictionSchema` (+121 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `Community 8` to `Community 1`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 2` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `recalculateRanking()` connect `Community 8` to `Community 1`, `Community 2`, `Community 25`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `enabled`, `updateMatchSchema`, `createMatchSchema` to the rest of the system?**
  _126 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06861239119303636 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._