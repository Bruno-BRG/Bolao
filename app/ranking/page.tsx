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

  return (
    <main className="container">
      <h1>Ranking geral</h1>
      <p className="muted">
        Ordem: pontos totais, placares exatos, resultados certos, menos palpites
        em branco e usuario mais antigo.
      </p>
      {params.error ? <p className="error">{params.error}</p> : null}
      {params.recalculated ? <p className="success">Ranking recalculado.</p> : null}
      <RankingTable rows={rows} />
      <section className="card" style={{ marginTop: 24 }}>
        <h2>Recalcular ranking</h2>
        <form className="form" action={recalculateRankingAction}>
          <div className="field">
            <label htmlFor="adminToken">Token admin</label>
            <input id="adminToken" name="adminToken" type="password" />
          </div>
          <button className="button secondary" type="submit">
            Recalcular
          </button>
        </form>
      </section>
    </main>
  );
}
