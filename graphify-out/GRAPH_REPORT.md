# Graph Report - Bolao  (2026-06-11)

## Corpus Check
- 58 files · ~42,799 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 300 nodes · 690 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58e7f196`
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

## God Nodes (most connected - your core abstractions)
1. `getSupabaseAdmin()` - 33 edges
2. `getCurrentUser()` - 21 edges
3. `compilerOptions` - 16 edges
4. `normalizePredictionDocument()` - 15 edges
5. `recalculateRanking()` - 15 edges
6. `getLatestRanking()` - 15 edges
7. `getOrCreatePredictionDocument()` - 13 edges
8. `listMatches()` - 12 edges
9. `persistMatchPrediction()` - 10 edges
10. `listTeams()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `LoginPage()` --calls--> `getCurrentUser()`  [EXTRACTED]
  app/login/page.tsx → services/auth.service.ts
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts
- `persistMatchPrediction()` --calls--> `isMatchPredictable()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-visibility.ts
- `POST()` --calls--> `recalculateRanking()`  [EXTRACTED]
  app/api/admin/recalculate-ranking/route.ts → services/ranking.service.ts

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.39
Nodes (7): SCORING_RULES, calculatePredictionScore(), getOutcome(), OfficialTopFour, resolveOfficialTopFour(), scoreMatchPrediction(), scoreTopFourPrediction()

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (27): recalculateRankingAction(), ComunidadePage(), GET(), getSupabaseAdmin(), RankingPage(), GET(), POST(), listPredictionRows() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.20
Nodes (22): bulkPredictionSchema, BulkSaveResult, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (29): HomePage(), fetchGames(), fetchGroups(), fetchJson(), fetchTeams(), getTimeZoneOffsetMilliseconds(), hasWorldCup26TimezoneDrift(), mapWorldCup26Stage() (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (25): loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout(), AppShell() (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (22): CommunityMember, CommunityPredictionsBoard(), TopFourForm(), PredictionRow, getMatchTeamLabel(), getPlaceholderLabel(), isMatchPredictable(), isPlaceholderSide() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, next, react, react-dom, @supabase/supabase-js, zod, devDependencies (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.52
Nodes (4): RANKING_POLL_MS, RankingLiveBoard(), RankingTable(), RankingRow

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (9): Apos o seed manual, Banco, Bolao da Copa, Comandos, Endpoints admin, Modelo DB-first, Pontuacao, Sync automatico (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (28): compactDate(), isMatchToday(), isSameLocalDay(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps, RowStatus, ScoreState (+20 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (8): API_FOOTBALL_LEAGUE_ID, API_FOOTBALL_SEASON, ApiFootballFixtureResponse, apiFootballGet(), ApiFootballResponse, ApiFootballTeamResponse, AUTO_SYNC_MAX_AGE_MINUTES, getApiFootballKey()

## Knowledge Gaps
- **94 isolated node(s):** `predictionSchema`, `bulkPredictionSchema`, `topFourSchema`, `MatchSaveResult`, `PredictionRow` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 17`, `Community 2`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `getCurrentUser()` connect `Community 2` to `Community 1`, `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 1` to `Community 8`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `predictionSchema`, `bulkPredictionSchema`, `topFourSchema` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08412698412698413 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1265597147950089 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._