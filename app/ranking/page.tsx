import { recalculateRankingAction } from "@/actions/admin.actions";
import { RankingLiveBoard } from "@/components/RankingLiveBoard";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export default async function RankingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; recalculated?: string }>;
}) {
  const params = await searchParams;
  const rows = await getLatestRanking().catch(() => []);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Ranking</h1>
          <p className="muted">
            {rows.length} participantes. Atualiza sozinho a cada poucos segundos.
          </p>
        </div>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.recalculated ? <p className="success">Ranking recalculado.</p> : null}

      <section className="standings-card card">
        <RankingLiveBoard initialRows={rows} />
      </section>

      <details className="card admin-details">
        <summary>Area do administrador</summary>
        <form className="form" action={recalculateRankingAction}>
          <div className="field">
            <label htmlFor="adminToken">Token admin</label>
            <input id="adminToken" name="adminToken" type="password" />
          </div>
          <button className="button secondary" type="submit">
            Recalcular ranking
          </button>
        </form>
      </details>
    </main>
  );
}
