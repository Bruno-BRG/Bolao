# Graph Report - Bolao  (2026-06-11)

## Corpus Check
- 60 files · ~43,658 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 714 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9750952`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
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
1. `getSupabaseAdmin()` - 34 edges
2. `getCurrentUser` - 21 edges
3. `compilerOptions` - 16 edges
4. `normalizePredictionDocument()` - 15 edges
5. `recalculateRanking()` - 15 edges
6. `getLatestRanking()` - 15 edges
7. `getOrCreatePredictionDocument()` - 13 edges
8. `listMatches()` - 13 edges
9. `listTeams` - 11 edges
10. `persistMatchPrediction()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts
- `persistMatchPrediction()` --calls--> `isMatchPredictable()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-visibility.ts
- `persistMatchPrediction()` --calls--> `getOrCreatePredictionDocument()`  [EXTRACTED]
  actions/predictions.actions.ts → repositories/predictions.repo.ts
- `persistMatchPrediction()` --calls--> `normalizePredictionDocument()`  [EXTRACTED]
  actions/predictions.actions.ts → services/prediction-document.ts
- `saveMatchPredictionAction()` --calls--> `getCurrentUser`  [EXTRACTED]
  actions/predictions.actions.ts → services/auth.service.ts

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (26): recalculateRankingAction(), RANKING_POLL_MS, RankingLiveBoard(), RankingTable(), GET(), getSupabaseAdmin(), RankingPage(), GET() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (14): bulkPredictionSchema, BulkSaveResult, ensureUnique(), isMatchLocked(), MatchSaveResult, persistMatchPrediction(), predictionSchema, saveBulkPredictionsAction() (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (29): HomePage(), fetchGames(), fetchGroups(), fetchJson(), fetchTeams(), getTimeZoneOffsetMilliseconds(), hasWorldCup26TimezoneDrift(), mapWorldCup26Stage() (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (28): loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout(), AppShell() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (24): CommunityMember, CommunityPredictionsBoard(), TopFourForm(), ComunidadePage(), PredictionRow, DashboardPage(), PalpitesPage(), getOrCreatePredictionDocument() (+16 more)

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
Cohesion: 0.08
Nodes (36): compactDate(), dayHeading(), isMatchToday(), isSameLocalDay(), PalpiteMatchRow(), PalpitesWorkspace(), PalpitesWorkspaceProps, RowStatus (+28 more)

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): cases, getOutcome(), scoreMatchPrediction(), SCORING_RULES

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (20): getMatchTeamLabel(), getPlaceholderLabel(), isMatchPredictable(), isPlaceholderSide(), shouldShowMatchInPalpites(), BY_ENGLISH_NAME, BY_FIFA, BY_ISO2 (+12 more)

## Knowledge Gaps
- **97 isolated node(s):** `predictionSchema`, `bulkPredictionSchema`, `topFourSchema`, `MatchSaveResult`, `PredictionRow` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 17`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 4` to `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `getLatestRanking()` connect `Community 1` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `predictionSchema`, `bulkPredictionSchema`, `topFourSchema` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13813813813813813 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08412698412698413 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._