"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBracketPredictionAction } from "@/actions/bracket.actions";
import { KNOCKOUT_ROUNDS } from "@/lib/knockout-bracket-tree";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import type { BracketPrediction, Match, Team } from "@/types/domain";

type BracketPredictionBoardProps = {
  matches: Match[];
  teams: Team[];
  savedBracket: BracketPrediction | null;
  locked: boolean;
};

type RoundPick = Record<string, string>;

function buildInitialPicks(
  saved: BracketPrediction | null,
  matches: Match[]
): Record<string, RoundPick> {
  const byRound: Record<string, RoundPick> = {};
  for (const round of KNOCKOUT_ROUNDS) {
    byRound[round.id] = {};
  }

  if (!saved) return byRound;

  const matchById = new Map(matches.map((match) => [match.external_id, match]));

  function fillFromSlots(roundId: string, slots: { slot: string; teamId: string }[]) {
    for (const entry of slots) {
      byRound[roundId][entry.slot] = entry.teamId;
    }
  }

  fillFromSlots("r16", saved.quarterFinals);
  fillFromSlots("qf", saved.semiFinals);
  fillFromSlots("sf", saved.final);

  for (const round of KNOCKOUT_ROUNDS) {
    for (const matchId of round.matchIds) {
      const match = matchById.get(matchId);
      if (!match || !match.home_team_id || !match.away_team_id) continue;
      const slot = `M${matchId}`;
      if (byRound[round.id][slot]) continue;

      const homeInQf = saved.quarterFinals.some((s) => s.teamId === match.home_team_id);
      const awayInQf = saved.quarterFinals.some((s) => s.teamId === match.away_team_id);
      if (round.id === "r16") {
        if (homeInQf) byRound[round.id][slot] = match.home_team_id;
        else if (awayInQf) byRound[round.id][slot] = match.away_team_id;
      }
    }
  }

  return byRound;
}

function slotKey(matchId: string) {
  return `M${matchId}`;
}

export function BracketPredictionBoard({
  matches,
  teams,
  savedBracket,
  locked
}: BracketPredictionBoardProps) {
  const router = useRouter();
  const matchMap = useMemo(
    () => new Map(matches.map((match) => [match.external_id, match])),
    [matches]
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.external_id, team])),
    [teams]
  );

  const [roundPicks, setRoundPicks] = useState(() =>
    buildInitialPicks(savedBracket, matches)
  );
  const [thirdPlace, setThirdPlace] = useState(
    savedBracket?.top4.find((entry) => entry.position === 3)?.teamId ?? ""
  );
  const [fourthPlace, setFourthPlace] = useState(
    savedBracket?.top4.find((entry) => entry.position === 4)?.teamId ?? ""
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickWinner(roundId: string, matchId: string, teamId: string) {
    if (locked) return;
    setRoundPicks((current) => ({
      ...current,
      [roundId]: {
        ...current[roundId],
        [slotKey(matchId)]: teamId
      }
    }));
  }

  function getAdvancingTeam(roundId: string, matchId: string, side: "home" | "away") {
    const match = matchMap.get(matchId);
    if (!match) return null;
    const picked = roundPicks[roundId]?.[slotKey(matchId)];
    if (picked) return picked;
    return side === "home" ? match.home_team_id : match.away_team_id;
  }

  const championTeamId = roundPicks.final?.[slotKey("104")] ?? savedBracket?.championTeamId ?? null;
  const finalMatch = matchMap.get("104");
  let runnerUpTeamId = savedBracket?.runnerUpTeamId ?? null;
  if (finalMatch && championTeamId) {
    runnerUpTeamId =
      championTeamId === finalMatch.home_team_id
        ? finalMatch.away_team_id
        : finalMatch.home_team_id;
  }

  async function handleSave() {
    setStatus(null);
    setError(null);
    setSaving(true);

    const quarterFinals = Object.entries(roundPicks.r16 ?? {}).map(([slot, teamId]) => ({
      slot,
      teamId
    }));
    const semiFinals = Object.entries(roundPicks.qf ?? {}).map(([slot, teamId]) => ({
      slot,
      teamId
    }));
    const finalPicks = Object.entries(roundPicks.sf ?? {}).map(([slot, teamId]) => ({
      slot,
      teamId
    }));

    if (!championTeamId || !runnerUpTeamId || !thirdPlace || !fourthPlace) {
      setSaving(false);
      setError("Complete o chaveamento e o Top 4 antes de salvar.");
      return;
    }

    const result = await saveBracketPredictionAction({
      quarterFinals,
      semiFinals,
      final: finalPicks,
      championTeamId,
      runnerUpTeamId,
      thirdPlaceTeamId: thirdPlace,
      fourthPlaceTeamId: fourthPlace
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Erro ao salvar.");
      return;
    }

    setStatus("Chaveamento salvo.");
    router.refresh();
  }

  return (
    <div className="bracket-prediction">
      {status ? <p className="success">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {locked ? (
        <p className="badge locked">Chaveamento bloqueado — mata-mata ja comecou.</p>
      ) : null}

      {KNOCKOUT_ROUNDS.map((round) => (
        <section key={round.id} className="bracket-prediction__round card">
          <h2>{round.title}</h2>
          <div className="bracket-prediction__matches">
            {round.matchIds.map((matchId) => {
              const match = matchMap.get(matchId);
              if (!match) {
                return (
                  <article key={matchId} className="bracket-prediction__match muted">
                    Jogo {matchId} — a definir
                  </article>
                );
              }

              const homeId = getAdvancingTeam(round.id, matchId, "home");
              const awayId = getAdvancingTeam(round.id, matchId, "away");
              const homeTeam = homeId ? teamsById.get(homeId) : null;
              const awayTeam = awayId ? teamsById.get(awayId) : null;
              const picked = roundPicks[round.id]?.[slotKey(matchId)];

              return (
                <article key={matchId} className="bracket-prediction__match">
                  <p className="muted">Jogo {matchId}</p>
                  <div className="bracket-prediction__pick">
                    <button
                      className={`button secondary small${picked === homeId ? " active" : ""}`}
                      disabled={locked || !homeId}
                      onClick={() => homeId && pickWinner(round.id, matchId, homeId)}
                      type="button"
                    >
                      {homeTeam?.name ?? getMatchTeamLabel(match, "home")}
                    </button>
                    <span>x</span>
                    <button
                      className={`button secondary small${picked === awayId ? " active" : ""}`}
                      disabled={locked || !awayId}
                      onClick={() => awayId && pickWinner(round.id, matchId, awayId)}
                      type="button"
                    >
                      {awayTeam?.name ?? getMatchTeamLabel(match, "away")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="card">
        <h2>Top 4</h2>
        <p className="muted">
          Campeao e vice sao definidos pela final. Escolha o 3o e 4o lugar.
        </p>
        <div className="bracket-prediction__top4">
          <p>
            <strong>Campeao:</strong>{" "}
            {championTeamId
              ? (teamsById.get(championTeamId)?.name ?? championTeamId)
              : "Defina a final"}
          </p>
          <p>
            <strong>Vice:</strong>{" "}
            {runnerUpTeamId
              ? (teamsById.get(runnerUpTeamId)?.name ?? runnerUpTeamId)
              : "Defina a final"}
          </p>
          <label>
            3o lugar
            <select
              disabled={locked}
              onChange={(event) => setThirdPlace(event.target.value)}
              value={thirdPlace}
            >
              <option value="">Selecione</option>
              {teams.map((team) => (
                <option key={team.external_id} value={team.external_id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            4o lugar
            <select
              disabled={locked}
              onChange={(event) => setFourthPlace(event.target.value)}
              value={fourthPlace}
            >
              <option value="">Selecione</option>
              {teams.map((team) => (
                <option key={team.external_id} value={team.external_id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {!locked ? (
        <button className="button" disabled={saving} onClick={() => void handleSave()} type="button">
          {saving ? "Salvando..." : "Salvar chaveamento"}
        </button>
      ) : null}
    </div>
  );
}
