import { recalculateRankingAction } from "@/actions/admin.actions";
import { RankingTable } from "@/components/RankingTable";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export default async function RankingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; recalculated?: string }>;
}) {
  const params = await searchParams;
  const rows = await getLatestRanking().catch(() => []);
  const leader = rows[0];
  const runnerUp = rows[1];
  const third = rows[2];

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Classificacao geral</span>
          <h1>Ranking do bolao</h1>
          <p className="muted">
            Ordem de desempate: pontos totais, placares exatos, resultados certos,
            menos palpites em branco e usuario mais antigo.
          </p>
        </div>
        <div className="topbar-actions">
          <span className="status-pill">{rows.length} participantes</span>
        </div>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.recalculated ? <p className="success">Ranking recalculado.</p> : null}

      <div className="top-summary">
        <section className="card leader-card">
          <span className="eyebrow">1 lugar</span>
          <h2>{leader?.username ?? "Aguardando"}</h2>
          <p className="muted">{leader ? `${leader.totalPoints} pontos no topo.` : "Sem dados ainda."}</p>
        </section>
        <section className="card leader-card">
          <span className="eyebrow">2 lugar</span>
          <h2>{runnerUp?.username ?? "Aguardando"}</h2>
          <p className="muted">
            {runnerUp ? `${runnerUp.totalPoints} pontos na cola.` : "Sem dados ainda."}
          </p>
        </section>
        <section className="card leader-card">
          <span className="eyebrow">3 lugar</span>
          <h2>{third?.username ?? "Aguardando"}</h2>
          <p className="muted">
            {third ? `${third.totalPoints} pontos fechando o podio.` : "Sem dados ainda."}
          </p>
        </section>
      </div>

      <section className="standings-card">
        <div>
          <span className="eyebrow">Tabela completa</span>
          <h2>Posicoes detalhadas</h2>
        </div>
        <RankingTable rows={rows} />
      </section>

      <section className="card">
        <span className="eyebrow">Admin</span>
        <h2>Recalcular ranking</h2>
        <form className="form" action={recalculateRankingAction}>
          <div className="field">
            <label htmlFor="adminToken">Token admin</label>
            <input id="adminToken" name="adminToken" type="password" />
          </div>
          <button className="button secondary" type="submit">
            Recalcular agora
          </button>
        </form>
      </section>
    </main>
  );
}
