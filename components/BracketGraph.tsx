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
  const name = team?.name ?? fallback ?? "TBD";
  const code = team?.fifa_code ?? team?.iso2;
  return code ? code.toUpperCase() : name.slice(0, 3).toUpperCase();
}

function getTeamTitle(match: LiveMatch, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  return team?.name ?? fallback ?? "A definir";
}

function getStatusLabel(match: LiveMatch) {
  if (match.status === "LIVE") {
    return match.minute_label ? `${match.minute_label}'` : "Ao vivo";
  }
  if (FINISHED_STATUSES.has(match.status)) return "FT";
  return formatDateTime(match.starts_at);
}

function statusClass(match: LiveMatch) {
  if (match.status === "LIVE") return "bracket-node--live";
  if (FINISHED_STATUSES.has(match.status)) return "bracket-node--done";
  return "";
}

function BracketNode({
  match,
  x,
  y,
  width,
  height
}: {
  match: LiveMatch;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const venue = match.venue_name
    ? `${match.venue_name}${match.city_name ? `, ${match.city_name}` : ""}`
    : null;

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <article
        className={`bracket-node ${statusClass(match)}`}
        title={venue ?? undefined}
      >
        <header className="bracket-node__head">
          <span className="bracket-node__status">{getStatusLabel(match)}</span>
          {match.stage === PLACEMENT_STAGE ? (
            <span className="bracket-node__tag">3o</span>
          ) : null}
        </header>
        <div className="bracket-node__teams">
          <div className="bracket-node__team">
            {match.home_team?.flag_url ? (
              <img src={match.home_team.flag_url} alt="" loading="lazy" />
            ) : null}
            <span title={getTeamTitle(match, "home")}>{getTeamLabel(match, "home")}</span>
            <strong>{match.current_score_home ?? "-"}</strong>
          </div>
          <div className="bracket-node__team">
            {match.away_team?.flag_url ? (
              <img src={match.away_team.flag_url} alt="" loading="lazy" />
            ) : null}
            <span title={getTeamTitle(match, "away")}>{getTeamLabel(match, "away")}</span>
            <strong>{match.current_score_away ?? "-"}</strong>
          </div>
        </div>
      </article>
    </foreignObject>
  );
}

export function BracketGraph({ layout }: { layout: BracketLayout }) {
  const { nodes, edges, width, height } = layout;
  const nodeWidth = 148;
  const nodeHeight = 44;

  if (nodes.length === 0) {
    return (
      <p className="muted bracket-empty">
        Nenhum jogo de mata-mata foi publicado na fonte dinamica ainda.
      </p>
    );
  }

  return (
    <div className="bracket-graph-wrap">
      <svg
        className="bracket-graph"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Chaveamento do mata-mata em formato de grafo"
      >
        <defs>
          <linearGradient id="bracket-edge-glow" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(151, 166, 186, 0.05)" />
            <stop offset="100%" stopColor="rgba(151, 166, 186, 0.35)" />
          </linearGradient>
        </defs>

        {edges.map((edge, index) => (
          <path
            key={`edge-${index}`}
            className="bracket-edge"
            d={edge.d}
            fill="none"
            stroke={edge.tone}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {nodes.map((node) => (
          <g key={node.match.external_id}>
            <circle
              className="bracket-anchor"
              cx={node.x}
              cy={node.y + nodeHeight / 2}
              r="2.5"
            />
            <BracketNode
              match={node.match}
              x={node.x}
              y={node.y}
              width={nodeWidth}
              height={nodeHeight}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
