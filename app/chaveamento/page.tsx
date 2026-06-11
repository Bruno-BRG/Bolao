import type { CSSProperties } from "react";
import { FINISHED_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { getLiveWorldCupData, type LiveMatch } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

const BRACKET_STAGES = [
  { name: "32 avos", topOffset: 0, gap: 12, tone: "open" },
  { name: "Oitavas", topOffset: 34, gap: 26, tone: "mid" },
  { name: "Quartas", topOffset: 86, gap: 52, tone: "mid" },
  { name: "Semifinal", topOffset: 142, gap: 98, tone: "late" },
  { name: "Terceiro lugar", topOffset: 42, gap: 18, tone: "placement" },
  { name: "Final", topOffset: 188, gap: 18, tone: "late" }
] as const;

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
            Compactei o board em formato de bracket horizontal. Os placares e os
            nomes das vagas seguem a fonte dinamica ao vivo.
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

      <section className="bracket-board">
        <div className="bracket-grid">
          {BRACKET_STAGES.map((stage, stageIndex) => {
            const matches = knockoutMatches.filter((match) => match.stage === stage.name);

            return (
              <section
                key={stage.name}
                className={`bracket-stage bracket-stage--${stage.tone}`}
              >
                <div className="bracket-stage__header">
                  <span className="eyebrow">{stage.name}</span>
                  <strong>{matches.length} jogos</strong>
                </div>

                <div
                  className="knockout-list"
                  style={{
                    marginTop: `${stage.topOffset}px`,
                    gap: `${stage.gap}px`
                  }}
                >
                  {matches.length > 0 ? (
                    matches.map((match, matchIndex) => (
                      <article
                        key={match.external_id}
                        className={`knockout-match ${
                          stageIndex < BRACKET_STAGES.length - 1 ? "connected" : ""
                        }`}
                        style={
                          {
                            "--connector-tone":
                              match.status === "LIVE"
                                ? "rgba(46, 194, 126, 0.55)"
                                : "rgba(151, 166, 186, 0.18)"
                          } as CSSProperties
                        }
                      >
                        <div className="knockout-match__meta">
                          <span
                            className={`badge ${
                              match.status === "LIVE"
                                ? ""
                                : FINISHED_STATUSES.has(match.status)
                                  ? "warning"
                                  : ""
                            }`}
                          >
                            {getStatusLabel(match)}
                          </span>
                          {matchIndex % 2 === 0 ? (
                            <span className="graph-dot" aria-hidden="true" />
                          ) : null}
                        </div>

                        {match.venue_name ? (
                          <p className="muted bracket-venue">
                            {match.venue_name}
                            {match.city_name ? ` - ${match.city_name}` : ""}
                          </p>
                        ) : null}

                        <div className="knockout-team-row">
                          <span>{getTeamLabel(match, "home")}</span>
                          <strong>{match.current_score_home ?? "-"}</strong>
                        </div>
                        <div className="knockout-team-row">
                          <span>{getTeamLabel(match, "away")}</span>
                          <strong>{match.current_score_away ?? "-"}</strong>
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
      </section>
    </main>
  );
}
