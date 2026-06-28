"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBracketPredictionAction } from "@/actions/bracket.actions";
import {
  KNOCKOUT_ROUNDS,
  type BracketRound
} from "@/lib/knockout-bracket-tree";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import type {
  BracketEditorState,
  BracketPrediction,
  Match,
  Team
} from "@/types/domain";

type BracketPredictionBoardProps = {
  matches: Match[];
  teams: Team[];
  savedBracket: BracketPrediction | null;
  locked: boolean;
};

type Side = "top" | "bottom";
type Slot = { top: string | null; bottom: string | null };
type RoundParticipants = Record<string, Record<string, Slot>>;
type RoundPicks = Record<string, Record<string, string>>;
type FirstRoundTeams = Record<string, { top: string | null; bottom: string | null }>;

const FINAL_ROUND_ID = KNOCKOUT_ROUNDS[KNOCKOUT_ROUNDS.length - 1].id;
const FINAL_MATCH_ID = KNOCKOUT_ROUNDS[KNOCKOUT_ROUNDS.length - 1].matchIds[0];
const SEMI_ROUND_ID = "sf";
const FIRST_ROUND_ID = KNOCKOUT_ROUNDS[0].id;

function effectiveFirstRound(
  matchMap: Map<string, Match>,
  userTeams: FirstRoundTeams
): FirstRoundTeams {
  const result: FirstRoundTeams = {};
  for (const matchId of KNOCKOUT_ROUNDS[0].matchIds) {
    const match = matchMap.get(matchId);
    const user = userTeams[matchId];
    result[matchId] = {
      top: match?.home_team_id ?? user?.top ?? null,
      bottom: match?.away_team_id ?? user?.bottom ?? null
    };
  }
  return result;
}

function resolveBracket(
  firstRound: FirstRoundTeams,
  picks: RoundPicks
): { participants: RoundParticipants; picks: RoundPicks } {
  const participants: RoundParticipants = {};
  const clean: RoundPicks = {};

  KNOCKOUT_ROUNDS.forEach((round, roundIndex) => {
    participants[round.id] = {};
    clean[round.id] = {};

    round.matchIds.forEach((matchId, matchIndex) => {
      let slot: Slot;
      if (roundIndex === 0) {
        slot = firstRound[matchId] ?? { top: null, bottom: null };
      } else {
        const prev = KNOCKOUT_ROUNDS[roundIndex - 1];
        slot = {
          top: clean[prev.id]?.[prev.matchIds[matchIndex * 2]] ?? null,
          bottom: clean[prev.id]?.[prev.matchIds[matchIndex * 2 + 1]] ?? null
        };
      }
      participants[round.id][matchId] = slot;

      const pick = picks[round.id]?.[matchId] ?? null;
      if (pick && (pick === slot.top || pick === slot.bottom)) {
        clean[round.id][matchId] = pick;
      }
    });
  });

  return { participants, picks: clean };
}

function loserOf(slot: Slot | undefined, pick: string | null | undefined) {
  if (!slot || !pick) return null;
  if (pick === slot.top) return slot.bottom;
  if (pick === slot.bottom) return slot.top;
  return null;
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

  const [firstRoundTeams, setFirstRoundTeams] = useState<FirstRoundTeams>(
    () => savedBracket?.editor?.firstRoundTeams ?? {}
  );
  const [picks, setPicks] = useState<RoundPicks>(
    () => savedBracket?.editor?.picks ?? {}
  );
  const [thirdPlacePick, setThirdPlacePick] = useState<string | null>(
    () => savedBracket?.editor?.thirdPlaceTeamId ?? null
  );

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { participants, picks: cleanPicks } = useMemo(() => {
    const firstRound = effectiveFirstRound(matchMap, firstRoundTeams);
    return resolveBracket(firstRound, picks);
  }, [matchMap, firstRoundTeams, picks]);

  const finalSlot = participants[FINAL_ROUND_ID]?.[FINAL_MATCH_ID];
  const championTeamId = cleanPicks[FINAL_ROUND_ID]?.[FINAL_MATCH_ID] ?? null;
  const runnerUpTeamId = championTeamId ? loserOf(finalSlot, championTeamId) : null;

  const semiLosers = useMemo(() => {
    const semiRound = KNOCKOUT_ROUNDS.find((round) => round.id === SEMI_ROUND_ID);
    if (!semiRound) return [] as string[];
    const losers: string[] = [];
    for (const matchId of semiRound.matchIds) {
      const loser = loserOf(
        participants[SEMI_ROUND_ID]?.[matchId],
        cleanPicks[SEMI_ROUND_ID]?.[matchId]
      );
      if (loser) losers.push(loser);
    }
    return losers;
  }, [participants, cleanPicks]);

  const validThirdPick =
    thirdPlacePick && semiLosers.includes(thirdPlacePick) ? thirdPlacePick : null;
  const fourthTeamId =
    validThirdPick && semiLosers.length === 2
      ? semiLosers.find((id) => id !== validThirdPick) ?? null
      : null;

  function advance(roundId: string, matchId: string, teamId: string) {
    if (locked) return;
    setPicks((current) => ({
      ...current,
      [roundId]: { ...current[roundId], [matchId]: teamId }
    }));
  }

  function setFirstRoundTeam(matchId: string, side: Side, teamId: string) {
    if (locked) return;
    setFirstRoundTeams((current) => ({
      ...current,
      [matchId]: {
        top: current[matchId]?.top ?? null,
        bottom: current[matchId]?.bottom ?? null,
        [side]: teamId || null
      }
    }));
  }

  function teamName(teamId: string | null, fallback: string) {
    if (!teamId) return fallback;
    return teamsById.get(teamId)?.name ?? fallback;
  }

  function PickRow({
    roundId,
    matchId,
    side,
    slot
  }: {
    roundId: string;
    matchId: string;
    side: Side;
    slot: Slot;
  }) {
    const teamId = slot[side];
    const team = teamId ? teamsById.get(teamId) : null;
    const isFirstRound = roundId === FIRST_ROUND_ID;
    const match = matchMap.get(matchId);
    const realTeamId =
      side === "top" ? match?.home_team_id ?? null : match?.away_team_id ?? null;
    const editable = isFirstRound && !realTeamId;
    const selected = Boolean(teamId) && cleanPicks[roundId]?.[matchId] === teamId;
    const fallbackLabel = match
      ? getMatchTeamLabel(match, side === "top" ? "home" : "away")
      : "A definir";

    return (
      <div className={`bp-row${selected ? " bp-row--winner" : ""}`}>
        <button
          aria-label="Escolher como vencedor"
          aria-pressed={selected}
          className="bp-row__pick"
          disabled={locked || !teamId}
          onClick={() => teamId && advance(roundId, matchId, teamId)}
          type="button"
        >
          <span className="bp-row__dot" />
        </button>

        {editable ? (
          <select
            className="bp-row__select"
            disabled={locked}
            onChange={(event) => setFirstRoundTeam(matchId, side, event.target.value)}
            value={teamId ?? ""}
          >
            <option value="">Escolher time</option>
            {teams.map((option) => (
              <option key={option.external_id} value={option.external_id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <button
            className="bp-row__team"
            disabled={locked || !teamId}
            onClick={() => teamId && advance(roundId, matchId, teamId)}
            type="button"
          >
            {team?.flag_url ? (
              <img alt="" className="flag-icon flag-icon--sm" loading="lazy" src={team.flag_url} />
            ) : (
              <span className="bp-row__crest" aria-hidden="true" />
            )}
            <span className="bp-row__name">{team?.name ?? fallbackLabel}</span>
          </button>
        )}
      </div>
    );
  }

  function PickCard({
    round,
    matchId
  }: {
    round: BracketRound;
    matchId: string;
  }) {
    const slot = participants[round.id]?.[matchId] ?? { top: null, bottom: null };
    return (
      <article className="bp-card">
        <header className="bp-card__head">Jogo {matchId}</header>
        <PickRow matchId={matchId} roundId={round.id} side="top" slot={slot} />
        <PickRow matchId={matchId} roundId={round.id} side="bottom" slot={slot} />
      </article>
    );
  }

  async function handleSave() {
    setStatus(null);
    setError(null);

    if (!championTeamId || !runnerUpTeamId || !validThirdPick || !fourthTeamId) {
      setError("Complete a final e a disputa de 3o lugar antes de salvar.");
      return;
    }

    setSaving(true);

    const toSlots = (roundId: string) =>
      Object.entries(cleanPicks[roundId] ?? {}).map(([matchId, teamId]) => ({
        slot: `M${matchId}`,
        teamId
      }));

    const editor: BracketEditorState = {
      firstRoundTeams,
      picks: cleanPicks,
      thirdPlaceTeamId: validThirdPick
    };

    const result = await saveBracketPredictionAction({
      quarterFinals: toSlots("r16"),
      semiFinals: toSlots("qf"),
      final: toSlots("sf"),
      championTeamId,
      runnerUpTeamId,
      thirdPlaceTeamId: validThirdPick,
      fourthPlaceTeamId: fourthTeamId,
      editor
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
    <div className="bp">
      {locked ? (
        <p className="badge locked">Chaveamento bloqueado — o mata-mata ja comecou.</p>
      ) : (
        <p className="muted bp__hint">
          Clique no time que avanca em cada chave. Nas caixas vazias, escolha o time
          no seletor. O vencedor sobe sozinho para a proxima fase.
        </p>
      )}

      <div className="bracket-shell bracket-shell--edit">
        <div className="bracket-scroll">
          <div className="bracket-board">
            {KNOCKOUT_ROUNDS.map((round, roundIndex) => {
              const isLast = roundIndex === KNOCKOUT_ROUNDS.length - 1;
              return (
                <section key={round.id} className={`bracket-col bracket-col--${round.id}`}>
                  <h3 className="bracket-col__title">{round.title}</h3>
                  <div className="bracket-col__slots">
                    {round.matchIds.map((matchId, matchIndex) => {
                      const isUpper = matchIndex % 2 === 0;
                      return (
                        <div
                          key={matchId}
                          className={`bracket-slot${isLast ? " bracket-slot--last" : ""}${
                            isUpper ? " bracket-slot--upper" : " bracket-slot--lower"
                          }`}
                        >
                          <PickCard matchId={matchId} round={round} />
                          {!isLast && isUpper ? (
                            <span className="bracket-slot__link" aria-hidden="true" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <section className="bp-podium card">
        <h3>Pódio</h3>
        <div className="bp-podium__grid">
          <div className="bp-podium__item bp-podium__item--gold">
            <span className="bp-podium__label">Campeão</span>
            <strong>{teamName(championTeamId, "Defina a final")}</strong>
          </div>
          <div className="bp-podium__item bp-podium__item--silver">
            <span className="bp-podium__label">Vice</span>
            <strong>{teamName(runnerUpTeamId, "Defina a final")}</strong>
          </div>
          <div className="bp-podium__item bp-podium__item--bronze">
            <span className="bp-podium__label">3º lugar</span>
            {semiLosers.length === 2 ? (
              <div className="bp-podium__choice">
                {semiLosers.map((teamId) => (
                  <button
                    key={teamId}
                    className={`button secondary small${validThirdPick === teamId ? " active" : ""}`}
                    disabled={locked}
                    onClick={() => setThirdPlacePick(teamId)}
                    type="button"
                  >
                    {teamName(teamId, teamId)}
                  </button>
                ))}
              </div>
            ) : (
              <strong className="muted">Defina as semifinais</strong>
            )}
          </div>
          <div className="bp-podium__item">
            <span className="bp-podium__label">4º lugar</span>
            <strong>{teamName(fourthTeamId, "Automático")}</strong>
          </div>
        </div>
      </section>

      {status ? <p className="success">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!locked ? (
        <button className="button" disabled={saving} onClick={() => void handleSave()} type="button">
          {saving ? "Salvando..." : "Salvar chaveamento"}
        </button>
      ) : null}
    </div>
  );
}
