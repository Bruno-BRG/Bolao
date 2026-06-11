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

export function TopFourForm({
  teams,
  prediction
}: {
  teams: Team[];
  prediction: TopFourPrediction | null;
}) {
  return (
    <form className="card top-four-form" action={saveTopFourAction}>
      <div>
        <span className="eyebrow">Seu bilhete especial</span>
        <h2>Defina o Top 4</h2>
        <p className="muted">
          Escolha as selecoes nas quatro posicoes finais. Ajuste quantas vezes
          precisar antes do fechamento.
        </p>
      </div>

      <div className="top-four-fields">
        <SelectTeam label="Campeao" name="first" teams={teams} value={prediction?.first} />
        <SelectTeam label="Vice" name="second" teams={teams} value={prediction?.second} />
        <SelectTeam label="Terceiro" name="third" teams={teams} value={prediction?.third} />
        <SelectTeam label="Quarto" name="fourth" teams={teams} value={prediction?.fourth} />
      </div>

      {prediction?.points !== null && prediction?.points !== undefined ? (
        <div className="top-four-score">
          <span className="badge">{prediction.points} pts</span>
          <span className="muted">Pontuacao atual do seu Top 4.</span>
        </div>
      ) : null}

      <button className="button" type="submit">
        Salvar Top 4
      </button>
    </form>
  );
}
