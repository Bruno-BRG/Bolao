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
            <th>Top 4</th>
            <th>Exatos</th>
            <th>Resultados</th>
            <th>Proximos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td>{row.position}</td>
              <td>{row.username}</td>
              <td>
                <strong>{row.totalPoints}</strong>
              </td>
              <td>{row.matchPoints}</td>
              <td>{row.topFourPoints}</td>
              <td>{row.exactScores}</td>
              <td>{row.correctOutcomes}</td>
              <td>{row.closeScores}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
