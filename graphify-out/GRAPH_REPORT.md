# Graph Report - Bolao  (2026-06-11)

## Corpus Check
- 61 files · ~43,973 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 319 nodes · 727 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8c193b1`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `getSupabaseAdmin()` - 35 edges
2. `getCurrentUser` - 21 edges
3. `compilerOptions` - 16 edges
4. `listMatches()` - 15 edges
5. `normalizePredictionDocument()` - 15 edges
6. `recalculateRanking()` - 15 edges
7. `getLatestRanking()` - 15 edges
8. `getOrCreatePredictionDocument()` - 13 edges
9. `listTeams` - 11 edges
10. `persistMatchPrediction()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `RankingPage()` --calls--> `getLatestRanking()`  [EXTRACTED]
  app/ranking/page.tsx → services/ranking.service.ts
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts
- `persistMatchPrediction()` --calls--> `isMatchPredictable()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-visibility.ts
- `POST()` --calls--> `recalculateRanking()`  [EXTRACTED]
  app/api/admin/recalculate-ranking/route.ts → services/ranking.service.ts

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.39
Nodes (7): SCORING_RULES, calculatePredictionScore(), getOutcome(), OfficialTopFour, resolveOfficialTopFour(), scoreMatchPrediction(), scoreTopFourPrediction()

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (30): recalculateRankingAction(), ComunidadePage(), GET(), getSupabaseAdmin(), GET(), GET(), POST(), listPredictionRows() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (25): bulkPredictionSchema, BulkSaveResult, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (30): HomePage(), fetchGames(), fetchGroups(), fetchJson(), fetchTeams(), getTimeZoneOffsetMilliseconds(), hasWorldCup26TimezoneDrift(), mapWorldCup26Stage() (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (26): loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout(), AppShell() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (13): CommunityMember, CommunityPredictionsBoard(), RANKING_POLL_MS, RankingLiveBoard(), RankingTable(), TopFourForm(), PredictionRow, RankingPage() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, next, react, react-dom, @supabase/supabase-js, zod, devDependencies (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): Apos o seed manual, Banco, Bolao da Copa, Comandos, Endpoints admin, GitHub Actions (recomendado na Copa), Modelo DB-first, Pontuacao (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (30): compactDate(), dayHeading(), isMatchToday(), isSameLocalDay(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps, RowStatus (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (20): getMatchTeamLabel(), getPlaceholderLabel(), isMatchPredictable(), isPlaceholderSide(), shouldShowMatchInPalpites(), BY_ENGLISH_NAME, BY_FIFA, BY_ISO2 (+12 more)

## Knowledge Gaps
- **98 isolated node(s):** `predictionSchema`, `bulkPredictionSchema`, `topFourSchema`, `MatchSaveResult`, `PredictionRow` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 17`, `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 1` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `predictionSchema`, `bulkPredictionSchema`, `topFourSchema` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1402439024390244 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._