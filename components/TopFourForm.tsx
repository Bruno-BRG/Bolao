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
          Selecione
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
      <span className="eyebrow">{label}</span>
      <div className="group-team-name">
        {team?.flag_url ? <img src={team.flag_url} alt="" loading="lazy" /> : null}
        <strong>{team?.name ?? "Selecao nao encontrada"}</strong>
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
        <div>
          <span className="eyebrow">Top 4 travado</span>
          <h2>Seu bilhete foi fechado</h2>
          <p className="muted">
            Como essa aposta vale mais pontos, o Top 4 fica bloqueado assim que voce
            salva pela primeira vez.
          </p>
        </div>

        <div className="top-four-lock-grid">
          <LockedRow label="Campeao" team={byId.get(prediction.first) ?? null} />
          <LockedRow label="Vice" team={byId.get(prediction.second) ?? null} />
          <LockedRow label="Terceiro" team={byId.get(prediction.third) ?? null} />
          <LockedRow label="Quarto" team={byId.get(prediction.fourth) ?? null} />
        </div>

        <div className="top-four-score">
          <span className="badge warning">Travado</span>
          {prediction.points !== null && prediction.points !== undefined ? (
            <span className="badge">{prediction.points} pts</span>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <form className="card top-four-form" action={saveTopFourAction}>
      <div>
        <span className="eyebrow">Seu bilhete especial</span>
        <h2>Defina o Top 4</h2>
        <p className="muted">
          Escolha as selecoes nas quatro posicoes finais. Depois do primeiro envio,
          esse bilhete fica travado sem edicao.
        </p>
      </div>

      <div className="top-four-fields">
        <SelectTeam label="Campeao" name="first" teams={teams} />
        <SelectTeam label="Vice" name="second" teams={teams} />
        <SelectTeam label="Terceiro" name="third" teams={teams} />
        <SelectTeam label="Quarto" name="fourth" teams={teams} />
      </div>

      <button className="button" type="submit">
        Salvar e travar Top 4
      </button>
    </form>
  );
}
