# Graph Report - Bolao  (2026-06-28)

## Corpus Check
- 100 files · ~59,939 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 525 nodes · 1252 edges · 30 communities (21 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d28646e1`
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
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 27 edges
2. `query()` - 25 edges
3. `listMatches()` - 21 edges
4. `normalizePredictionDocument()` - 19 edges
5. `recalculateRanking()` - 19 edges
6. `Match` - 18 edges
7. `isMatchFinished()` - 17 edges
8. `ensureWorldCupData()` - 17 edges
9. `getOrCreatePredictionDocument()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/layout.tsx → services/auth.service.ts
- `LoginPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  app/login/page.tsx → services/auth.service.ts
- `syncWorldCupAdminAction()` --calls--> `syncWorldCupData()`  [EXTRACTED]
  actions/admin.actions.ts → services/worldcup-sync.service.ts
- `updateMatchAdminAction()` --calls--> `isDecisionMethod()`  [EXTRACTED]
  actions/admin.actions.ts → lib/decision-method.ts
- `isMatchLocked()` --calls--> `isMatchLockedForPrediction()`  [EXTRACTED]
  actions/predictions.actions.ts → lib/match-lock.ts

## Import Cycles
- None detected.

## Communities (30 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (6): Deploy na Railway (2 servicos), Deploy na Railway (branch `feature/railway-docker`), Healthcheck, Sync automatico, Testar local com Docker, Variaveis do servico Bolao

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (42): GET(), countMatches(), getLatestSuccessfulSync(), GroupRow, insertSyncLog(), MatchRow, pruneTeams(), TeamRow (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (39): BracketSaveResult, bracketSchema, editorSchema, saveBracketPredictionAction(), slotSchema, bulkPredictionSchema, ensureUnique(), isMatchLocked() (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (15): HomePage(), mapWorldCup26Stage(), mapWorldCup26Status(), fetchCollection(), fetchJson(), getLiveFeedHighlights(), getLiveWorldCupData(), LiveGameResponse (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (30): changePasswordAction(), loginAction(), logoutAction(), registerAction(), setSessionCookie(), validateCredentials(), metadata, RootLayout() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (34): AdminMatchesPanel(), Filter, BracketPointsBreakdown, BracketSlotPick, BracketTopFourPick, calculateBracketPoints(), countSetOverlap(), getFirstKnockoutRoundStart() (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (25): dependencies, bcryptjs, next, pg, react, react-dom, zod, devDependencies (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (28): createMatchAdminAction(), createMatchSchema, recalculateRankingAction(), revalidateMatchPaths(), syncWorldCupAdminAction(), updateMatchAdminAction(), updateMatchSchema, RANKING_POLL_MS (+20 more)

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
Cohesion: 0.08
Nodes (36): buildTeamGroupMap(), ComputedGroupTable, ComputedStandingRow, computeGroupStandingsFromMatches(), getGroupFromMatch(), getQualifiedThirdPlaceGroups(), findKnockoutMismatches(), getGroupTable() (+28 more)

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (4): block, end, rows, start

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (43): BracketPredictionBoard(), BracketPredictionBoardProps, FirstRoundTeams, loserOf(), RoundParticipants, RoundPicks, Side, Slot (+35 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (17): KnockoutPredictionFields(), KnockoutPredictionFieldsProps, METHOD_ICON, parseGoals(), SCORING_RULES, DECISION_METHOD_LABELS, DECISION_METHOD_OPTIONS, DecisionMethod (+9 more)

## Knowledge Gaps
- **159 isolated node(s):** `enabled`, `updateMatchSchema`, `createMatchSchema`, `slotSchema`, `editorSchema` (+154 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Match` connect `Community 27` to `Community 2`, `Community 3`, `Community 5`, `Community 15`, `Community 25`, `Community 29`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `query()` connect `Community 1` to `Community 8`, `Community 25`, `Community 2`, `Community 4`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `getCurrentUser` connect `Community 2` to `Community 3`, `Community 4`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `enabled`, `updateMatchSchema`, `createMatchSchema` to the rest of the system?**
  _159 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08784313725490196 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12481857764876633 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._