import Link from "next/link";
import type { BracketPrediction, Team } from "@/types/domain";

type BracketPodiumSummaryProps = {
  bracket: BracketPrediction;
  teams: Team[];
  editable?: boolean;
  title?: string;
};

function teamById(teams: Team[], teamId: string | null) {
  if (!teamId) return null;
  return teams.find((team) => team.external_id === teamId) ?? null;
}

function PodiumItem({
  label,
  team,
  variant
}: {
  label: string;
  team: Team | null;
  variant?: "gold" | "silver" | "bronze";
}) {
  const modifier = variant ? ` bp-podium__item--${variant}` : "";

  return (
    <div className={`bp-podium__item${modifier}`}>
      <span className="bp-podium__label">{label}</span>
      <div className="bp-podium__team">
        {team?.flag_url ? (
          <img alt="" className="flag-icon flag-icon--sm" loading="lazy" src={team.flag_url} />
        ) : null}
        <strong>{team?.name ?? "—"}</strong>
      </div>
    </div>
  );
}

export function BracketPodiumSummary({
  bracket,
  teams,
  editable = false,
  title = "Seu podio"
}: BracketPodiumSummaryProps) {
  const thirdTeamId =
    bracket.top4.find((slot) => slot.position === 3)?.teamId ?? null;
  const fourthTeamId =
    bracket.top4.find((slot) => slot.position === 4)?.teamId ?? null;

  return (
    <section className="card bracket-podium-summary">
      <div className="bracket-podium-summary__head">
        <div>
          <h2>{title}</h2>
          <p className="muted">Campeao, vice e disputa de 3o lugar do seu chaveamento.</p>
        </div>
        {editable ? (
          <Link className="button secondary small" href="/seu_chaveamento">
            Editar chaveamento
          </Link>
        ) : null}
      </div>

      <div className="bp-podium__grid">
        <PodiumItem
          label="Campeao"
          team={teamById(teams, bracket.championTeamId)}
          variant="gold"
        />
        <PodiumItem
          label="Vice"
          team={teamById(teams, bracket.runnerUpTeamId)}
          variant="silver"
        />
        <PodiumItem
          label="3o lugar"
          team={teamById(teams, thirdTeamId)}
          variant="bronze"
        />
        <PodiumItem label="4o lugar" team={teamById(teams, fourthTeamId)} />
      </div>

      {bracket.points !== null && bracket.points !== undefined ? (
        <p className="muted bracket-podium-summary__points">{bracket.points} pts no chaveamento</p>
      ) : null}
    </section>
  );
}
