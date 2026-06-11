import { formatDateTime } from "@/lib/date";
import { FINISHED_STATUSES } from "@/lib/constants";
import { getLiveWorldCupData, type LiveMatch } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

const KNOCKOUT_ORDER = [
  "32 avos",
  "Oitavas",
  "Quartas",
  "Semifinal",
  "Terceiro lugar",
  "Final"
];

function getTeamLabel(match: LiveMatch, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  return team?.name ?? fallback ?? "A definir";
}

function getStatusLabel(match: LiveMatch) {
  if (match.status === "LIVE") {
    return match.minute_label ? `Ao vivo ${match.minute_label}'` : "Ao vivo";
  }

  if (FINISHED_STATUSES.has(match.status)) return "Encerrado";
  return formatDateTime(match.starts_at);
}

export default async function ChaveamentoPage() {
  const liveData = await getLiveWorldCupData();
  const knockoutMatches = liveData.matches.filter((match) => match.stage !== "Grupos");

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Mata-mata</span>
          <h1>Chaveamento dinamico</h1>
          <p className="muted">
            A estrutura abaixo acompanha as fases eliminatorias e deixa claro que o
            placar exibido vem da fonte dinamica ao vivo.
          </p>
        </div>
      </section>

      <section className="source-note">
        <span className="badge">Fonte dinamica</span>
        <p>
          Chaveamento montado com jogos de{" "}
          <a href={liveData.source.gamesUrl} target="_blank" rel="noreferrer">
            {liveData.source.gamesUrl}
          </a>
          .
        </p>
      </section>

      <div className="bracket-grid">
        {KNOCKOUT_ORDER.map((stage) => {
          const matches = knockoutMatches.filter((match) => match.stage === stage);

          return (
            <section key={stage} className="card bracket-stage">
              <div className="bracket-stage__header">
                <span className="eyebrow">{stage}</span>
                <strong>{matches.length} jogos</strong>
              </div>

              <div className="knockout-list">
                {matches.length > 0 ? (
                  matches.map((match) => (
                    <article key={match.external_id} className="knockout-match">
                      <div className="knockout-match__meta">
                        <span className={`badge ${match.status === "LIVE" ? "" : "warning"}`}>
                          {getStatusLabel(match)}
                        </span>
                        {match.venue_name ? (
                          <span className="muted">
                            {match.venue_name}
                            {match.city_name ? ` - ${match.city_name}` : ""}
                          </span>
                        ) : null}
                      </div>

                      <div className="knockout-team-row">
                        <span>{getTeamLabel(match, "home")}</span>
                        <strong>
                          {match.current_score_home ?? "-"}
                        </strong>
                      </div>
                      <div className="knockout-team-row">
                        <span>{getTeamLabel(match, "away")}</span>
                        <strong>
                          {match.current_score_away ?? "-"}
                        </strong>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="muted">Nenhum confronto desta fase foi publicado ainda.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
