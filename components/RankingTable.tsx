import type { RankingRow } from "@/types/domain";

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return <p className="muted">Ainda nao ha participantes no ranking.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Usuario</th>
            <th>Pontos</th>
            <th>Jogos</th>
            <th>Mata-mata</th>
            <th>Chaveamento</th>
            <th>Top 4</th>
            <th>Exatos</th>
            <th>Resultados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className={row.position <= 3 ? "rank-row-top" : undefined}
            >
              <td>
                <span className="position-pill">{row.position}</span>
              </td>
              <td>
                <strong>{row.username}</strong>
              </td>
              <td>
                <strong>{row.totalPoints}</strong>
              </td>
              <td>{row.matchPoints}</td>
              <td>{row.knockoutPoints ?? 0}</td>
              <td>{row.bracketPoints ?? 0}</td>
              <td>{row.topFourPoints}</td>
              <td>{row.exactScores}</td>
              <td>{row.correctOutcomes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
