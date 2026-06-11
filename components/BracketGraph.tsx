"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FINISHED_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import {
  BRACKET_LAYOUT_CONFIG,
  BRACKET_MOBILE_CONFIG,
  buildBracketLayout,
  PLACEMENT_STAGE
} from "@/lib/bracket-layout";
import type { BracketLayout } from "@/lib/bracket-layout";
import type { LiveMatch } from "@/services/worldcup-live.service";

function getTeamLabel(match: LiveMatch, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  const name = team?.name ?? fallback ?? "A definir";
  const code = team?.fifa_code ?? team?.iso2;
  if (code) return code.toUpperCase();
  return name.length > 14 ? `${name.slice(0, 14)}…` : name;
}

function getTeamTitle(match: LiveMatch, side: "home" | "away") {
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

function BracketMatchCard({
  match,
  compact
}: {
  match: LiveMatch;
  compact?: boolean;
}) {
  const hasScore =
    match.current_score_home !== null &&
    match.current_score_home !== undefined &&
    match.current_score_away !== null &&
    match.current_score_away !== undefined;

  return (
    <article className={`bracket-match ${statusClass(match)} ${compact ? "bracket-match--compact" : ""}`}>
      <header className="bracket-match__head">
        <time>{formatMatchTime(match)}</time>
        {match.stage === PLACEMENT_STAGE ? (
          <span className="bracket-match__tag">3o</span>
        ) : null}
      </header>

      <div className="bracket-match__row">
        <TeamShield flagUrl={match.home_team?.flag_url} />
        <span className="bracket-match__name" title={getTeamTitle(match, "home")}>
          {getTeamLabel(match, "home")}
        </span>
        {hasScore ? <strong>{match.current_score_home}</strong> : null}
      </div>

      <div className="bracket-match__row">
        <TeamShield flagUrl={match.away_team?.flag_url} />
        <span className="bracket-match__name" title={getTeamTitle(match, "away")}>
          {getTeamLabel(match, "away")}
        </span>
        {hasScore ? <strong>{match.current_score_away}</strong> : null}
      </div>
    </article>
  );
}

function BracketTree({ layout }: { layout: BracketLayout }) {
  const { nodes, edges, width, height, config } = layout;

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
            <BracketMatchCard match={node.match} compact={config.nodeWidth < 170} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketGraph({ matches }: { matches: LiveMatch[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const layout = useMemo(
    () => buildBracketLayout(matches, isMobile ? BRACKET_MOBILE_CONFIG : BRACKET_LAYOUT_CONFIG),
    [isMobile, matches]
  );

  if (layout.nodes.length === 0) {
    return (
      <p className="muted bracket-empty">
        Nenhum jogo de mata-mata foi publicado na fonte dinamica ainda.
      </p>
    );
  }

  return (
    <div className="bracket-viewport" ref={viewportRef}>
      <BracketTree layout={layout} />
    </div>
  );
}
