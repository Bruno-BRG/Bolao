import Link from "next/link";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ranking = await getLatestRanking().catch(() => []);
  const leader = ranking[0];

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Bolao da Copa</h1>
          <p>
            Cadastre seus placares, escolha os quatro primeiros colocados e
            acompanhe o ranking geral conforme os resultados oficiais chegam.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Entrar no bolao
            </Link>
            <Link className="button secondary" href="/ranking">
              Ver ranking
            </Link>
          </div>
        </div>
      </section>
      <main className="container">
        <div className="grid three">
          <section className="card">
            <h2>Placar</h2>
            <p className="muted">
              Placar exato vale 5 pontos. Resultado certo vale 3 pontos.
              Gols próximos somam 1 ponto por lado quando a diferença for de
              ate um gol.
            </p>
          </section>
          <section className="card">
            <h2>Top 4</h2>
            <p className="muted">
              O palpite dos quatro primeiros vale mais: 10 pontos por posição
              exata e 5 pontos se a seleção aparecer no Top 4 oficial.
            </p>
          </section>
          <section className="card">
            <h2>Lider atual</h2>
            {leader ? (
              <p>
                <strong>{leader.username}</strong> esta em primeiro com{" "}
                <strong>{leader.totalPoints}</strong> pontos.
              </p>
            ) : (
              <p className="muted">O ranking aparece assim que houver dados.</p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
