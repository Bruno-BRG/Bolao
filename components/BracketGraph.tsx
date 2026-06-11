import { FINISHED_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { PLACEMENT_STAGE } from "@/lib/bracket-layout";
import type { BracketLayout } from "@/lib/bracket-layout";
import type { LiveMatch } from "@/services/worldcup-live.service";

function getTeamLabel(match: LiveMatch, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  return team?.name ?? fallback ?? "A definir";
}

function formatMatchTime(match: LiveMatch) {
  if (match.status === "LIVE") {
    return match.minute_label ? `Ao vivo ${match.minute_label}'` : "Ao vivo";
  }
  if (FINISHED_STATUSES.has(match.status)) return "Encerrado";

  const date = new Date(match.starts_at);
  if (Number.isNaN(date.getTime())) return formatDateTime(match.starts_at);

  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

function statusClass(match: LiveMatch) {
  if (match.status === "LIVE") return "bracket-match--live";
  if (FINISHED_STATUSES.has(match.status)) return "bracket-match--done";
  return "";
}

function TeamShield({ flagUrl }: { flagUrl: string | null | undefined }) {
  if (flagUrl) {
    return <img className="bracket-match__shield" src={flagUrl} alt="" loading="lazy" />;
  }

  return (
    <span className="bracket-match__shield bracket-match__shield--empty" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z" />
      </svg>
    </span>
  );
}

function BracketMatchCard({ match }: { match: LiveMatch }) {
  const venue = match.venue_name
    ? `${match.venue_name}${match.city_name ? ` · ${match.city_name}` : ""}`
    : null;
  const hasScore =
    match.current_score_home !== null &&
    match.current_score_home !== undefined &&
    match.current_score_away !== null &&
    match.current_score_away !== undefined;

  return (
    <article
      className={`bracket-match ${statusClass(match)}`}
      title={venue ?? undefined}
    >
      <header className="bracket-match__head">
        <time>{formatMatchTime(match)}</time>
        {match.stage === PLACEMENT_STAGE ? (
          <span className="bracket-match__tag">3o lugar</span>
        ) : null}
      </header>

      <div className="bracket-match__row">
        <TeamShield flagUrl={match.home_team?.flag_url} />
        <span className="bracket-match__name">{getTeamLabel(match, "home")}</span>
        {hasScore ? <strong>{match.current_score_home}</strong> : null}
      </div>

      <div className="bracket-match__row">
        <TeamShield flagUrl={match.away_team?.flag_url} />
        <span className="bracket-match__name">{getTeamLabel(match, "away")}</span>
        {hasScore ? <strong>{match.current_score_away}</strong> : null}
      </div>
    </article>
  );
}

export function BracketGraph({ layout }: { layout: BracketLayout }) {
  const { nodes, edges, width, height, config } = layout;

  if (nodes.length === 0) {
    return (
      <p className="muted bracket-empty">
        Nenhum jogo de mata-mata foi publicado na fonte dinamica ainda.
      </p>
    );
  }

  return (
    <div className="bracket-tree" style={{ width, height }}>
      <svg
        className="bracket-tree__lines"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden="true"
      >
        {edges.map((edge, index) => (
          <path
            key={`edge-${index}`}
            d={edge.d}
            fill="none"
            stroke={edge.tone}
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        ))}
      </svg>

      <div className="bracket-tree__nodes">
        {nodes.map((node) => (
          <div
            key={node.match.external_id}
            className="bracket-tree__node"
            style={{
              width: config.nodeWidth,
              height: config.nodeHeight,
              transform: `translate(${node.x}px, ${node.y}px)`
            }}
          >
            <BracketMatchCard match={node.match} />
          </div>
        ))}
      </div>
    </div>
  );
}
