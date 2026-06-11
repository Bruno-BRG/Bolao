import { savePredictionAction } from "@/actions/predictions.actions";
import { formatDateTime } from "@/lib/date";
import { LOCKED_STATUSES } from "@/lib/constants";
import type { Match, MatchPrediction } from "@/types/domain";

function TeamName({ name, flagUrl }: { name: string; flagUrl: string | null }) {
  return (
    <span className="team">
      {flagUrl ? <img src={flagUrl} alt="" /> : null}
      <span>{name}</span>
    </span>
  );
}

export function PredictionForm({
  match,
  prediction
}: {
  match: Match;
  prediction?: MatchPrediction;
}) {
  const locked =
    new Date(match.starts_at).getTime() <= Date.now() ||
    LOCKED_STATUSES.has(match.status.toUpperCase());
  const homeName = match.home_team?.name ?? "A definir";
  const awayName = match.away_team?.name ?? "A definir";

  return (
    <form className="card match" action={savePredictionAction}>
      <input type="hidden" name="matchId" value={match.external_id} />
      <div>
        <TeamName name={homeName} flagUrl={match.home_team?.flag_url ?? null} />
        <p className="muted">
          {match.stage ?? "Fase"} {match.group_name ? `- ${match.group_name}` : ""}
        </p>
      </div>
      <div className="score-inputs">
        <input
          aria-label={`Gols de ${homeName}`}
          defaultValue={prediction?.homeGoals ?? ""}
          disabled={locked}
          min={0}
          max={30}
          name="homeGoals"
          required
          type="number"
        />
        <span>x</span>
        <input
          aria-label={`Gols de ${awayName}`}
          defaultValue={prediction?.awayGoals ?? ""}
          disabled={locked}
          min={0}
          max={30}
          name="awayGoals"
          required
          type="number"
        />
      </div>
      <div>
        <TeamName name={awayName} flagUrl={match.away_team?.flag_url ?? null} />
        <p className="muted">{formatDateTime(match.starts_at)}</p>
      </div>
      <div>
        <span className="badge">{locked ? "Bloqueado" : match.status}</span>
        {match.score_home !== null && match.score_away !== null ? (
          <p>
            Oficial: {match.score_home} x {match.score_away}
          </p>
        ) : null}
        {prediction?.points !== null && prediction?.points !== undefined ? (
          <p>{prediction.points} pts</p>
        ) : null}
        <button className="button" disabled={locked} type="submit">
          Salvar
        </button>
      </div>
    </form>
  );
}
