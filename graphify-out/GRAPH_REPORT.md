# Graph Report - Bolao  (2026-06-12)

## Corpus Check
- 66 files · ~45,173 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 341 nodes · 786 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e4ba695`
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
1. `getSupabaseAdmin()` - 37 edges
2. `getCurrentUser` - 23 edges
3. `listMatches()` - 17 edges
4. `recalculateRanking()` - 16 edges
5. `compilerOptions` - 16 edges
6. `normalizePredictionDocument()` - 15 edges
7. `getLatestRanking()` - 15 edges
8. `getOrCreatePredictionDocument()` - 13 edges
9. `listTeams` - 11 edges
10. `persistMatchPrediction()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `LoginPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/login/page.tsx → services/auth.service.ts
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts
- `AdminPartidasPage()` --calls--> `listMatches()`  [EXTRACTED]
  app/admin/partidas/page.tsx → repositories/worldcup.repo.ts
- `AdminPartidasPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/admin/partidas/page.tsx → services/auth.service.ts

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.39
Nodes (7): SCORING_RULES, calculatePredictionScore(), getOutcome(), OfficialTopFour, resolveOfficialTopFour(), scoreMatchPrediction(), scoreTopFourPrediction()

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (23): GET(), getSupabaseAdmin(), GET(), RankingPage(), GET(), getLatestSyncLog(), listGroupStandings(), listMatches() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (27): bulkPredictionSchema, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction(), saveMatchPredictionAction() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (30): HomePage(), fetchGames(), fetchGroups(), fetchJson(), fetchTeams(), getTimeZoneOffsetMilliseconds(), hasWorldCup26TimezoneDrift(), mapWorldCup26Stage() (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (28): loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout(), AppShell() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (21): CommunityMember, CommunityPredictionsBoard(), RANKING_POLL_MS, RankingLiveBoard(), RankingTable(), TopFourForm(), getMatchTeamLabel(), getPlaceholderLabel() (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, next, react, react-dom, @supabase/supabase-js, zod, devDependencies (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (20): recalculateRankingAction(), updateMatchAdminAction(), updateMatchSchema, AdminMatchesPanel(), Filter, isValidAdminToken(), FINISHED_STATUSES, isMatchFinished() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (12): Apos o seed manual, Banco, Bolao da Copa, Comandos, Endpoints admin, GitHub Actions (recomendado na Copa), Modelo DB-first, Pontuacao (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (30): BulkSaveResult, compactDate(), dayHeading(), isMatchToday(), isSameLocalDay(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (10): API_FOOTBALL_LEAGUE_ID, API_FOOTBALL_SEASON, ApiFootballFixtureResponse, apiFootballGet(), ApiFootballResponse, ApiFootballTeamResponse, AUTO_SYNC_MAX_AGE_MINUTES, ensureWorldCupData() (+2 more)

## Knowledge Gaps
- **104 isolated node(s):** `updateMatchSchema`, `predictionSchema`, `bulkPredictionSchema`, `topFourSchema`, `MatchSaveResult` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 8`, `Community 17`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 2` to `Community 8`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 1` to `Community 8`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `updateMatchSchema`, `predictionSchema`, `bulkPredictionSchema` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09716599190283401 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.10887096774193548 - nodes in this community are weakly interconnected._