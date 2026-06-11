import { getLiveWorldCupData } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

export default async function SelecoesPage() {
  const liveData = await getLiveWorldCupData();

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Grupos</h1>
          <p className="muted">Tabela de pontos de cada grupo.</p>
        </div>
      </section>

      <div className="selection-grid">
        {liveData.groups.map((group) => (
          <section key={group.group} className="card group-card">
            <div className="group-card__header">
              <span className="eyebrow">Grupo {group.group}</span>
              <strong>{group.standings.length} selecoes</strong>
            </div>

            <div className="group-teams">
              {group.standings.map((row) => (
                <div key={row.team?.external_id ?? `${group.group}-${row.pts}`} className="team-chip">
                  {row.team?.flag_url ? <img src={row.team.flag_url} alt="" loading="lazy" /> : null}
                  <span>{row.team?.name ?? "Selecao indefinida"}</span>
                </div>
              ))}
            </div>

            <div className="table-wrap">
              <table className="group-table">
                <thead>
                  <tr>
                    <th>Selecao</th>
                    <th>Pts</th>
                    <th>PJ</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>GP</th>
                    <th>GC</th>
                    <th>SG</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((row) => (
                    <tr key={row.team?.external_id ?? `${group.group}-${row.pts}-table`}>
                      <td>
                        <div className="group-team-name">
                          {row.team?.flag_url ? (
                            <img src={row.team.flag_url} alt="" loading="lazy" />
                          ) : null}
                          <span>{row.team?.name ?? "Selecao indefinida"}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{row.pts}</strong>
                      </td>
                      <td>{row.mp}</td>
                      <td>{row.w}</td>
                      <td>{row.d}</td>
                      <td>{row.l}</td>
                      <td>{row.gf}</td>
                      <td>{row.ga}</td>
                      <td>{row.gd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
