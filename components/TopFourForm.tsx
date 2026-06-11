import { saveTopFourAction } from "@/actions/predictions.actions";
import type { Team, TopFourPrediction } from "@/types/domain";

function SelectTeam({
  name,
  label,
  teams,
  value
}: {
  name: keyof Pick<TopFourPrediction, "first" | "second" | "third" | "fourth">;
  label: string;
  teams: Team[];
  value?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value ?? ""} required>
        <option value="" disabled>
          Selecione a selecao
        </option>
        {teams.map((team) => (
          <option key={team.external_id} value={team.external_id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function LockedRow({
  label,
  team
}: {
  label: string;
  team: Team | null;
}) {
  return (
    <article className="top-four-lock-row">
      <strong>{label}</strong>
      <div className="group-team-name">
        {team?.flag_url ? (
          <img className="flag-icon flag-icon--md" src={team.flag_url} alt="" loading="lazy" />
        ) : null}
        <span>{team?.name ?? "Selecao nao encontrada"}</span>
      </div>
    </article>
  );
}

export function TopFourForm({
  teams,
  prediction
}: {
  teams: Team[];
  prediction: TopFourPrediction | null;
}) {
  const byId = new Map(teams.map((team) => [team.external_id, team]));

  if (prediction) {
    return (
      <section className="card top-four-lock-card">
        <h2>Seu Top 4 esta fechado</h2>
        <div className="top-four-lock-grid">
          <LockedRow label="Campeao" team={byId.get(prediction.first) ?? null} />
          <LockedRow label="Vice" team={byId.get(prediction.second) ?? null} />
          <LockedRow label="Terceiro" team={byId.get(prediction.third) ?? null} />
          <LockedRow label="Quarto" team={byId.get(prediction.fourth) ?? null} />
        </div>
        {prediction.points !== null && prediction.points !== undefined ? (
          <p className="muted">{prediction.points} pontos ate agora.</p>
        ) : null}
      </section>
    );
  }

  return (
    <form className="card top-four-form" action={saveTopFourAction}>
      <div className="top-four-fields">
        <SelectTeam label="Campeao" name="first" teams={teams} />
        <SelectTeam label="Vice-campeao" name="second" teams={teams} />
        <SelectTeam label="Terceiro lugar" name="third" teams={teams} />
        <SelectTeam label="Quarto lugar" name="fourth" teams={teams} />
      </div>

      <button className="button" type="submit">
        Salvar Top 4
      </button>
    </form>
  );
}
