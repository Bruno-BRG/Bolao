import Link from "next/link";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ranking = await getLatestRanking().catch(() => []);
  const leader = ranking[0];
  const contenders = ranking.slice(0, 5);

  return (
    <main className="container">
      <section className="spotlight">
        <div className="spotlight-copy">
          <span className="eyebrow">Bolao da Copa 2026</span>
          <h1>Seu placar, seu Top 4 e o ranking geral no mesmo painel.</h1>
          <p>
            Acompanhe os jogos oficiais, trave os palpites no horario certo e
            dispute posicao ponto a ponto conforme os resultados entram no sistema.
          </p>
          <div className="actions">
            <Link className="button" href="/login">
              Entrar no bolao
            </Link>
            <Link className="button secondary" href="/ranking">
              Ver ranking completo
            </Link>
          </div>
        </div>

        <div className="spotlight-side">
          <div className="mini-stat-grid">
            <article className="mini-stat">
              <span>Lider atual</span>
              <strong>{leader?.username ?? "-"}</strong>
            </article>
            <article className="mini-stat">
              <span>Pontos no topo</span>
              <strong>{leader?.totalPoints ?? 0}</strong>
            </article>
          </div>

          <div className="glass-list">
            <article>
              <h3>Regras de jogo</h3>
              <p>
                Placar exato vale 5 pontos. Resultado certo vale 3. Gols proximos
                somam 1 ponto por lado quando a diferenca for de ate um gol.
              </p>
            </article>
            <article>
              <h3>Top 4 valendo mais</h3>
              <p>
                Cada posicao exata do Top 4 vale 10 pontos. Se a selecao aparecer
                no Top 4 oficial, ainda vale 5 pontos.
              </p>
            </article>
          </div>
        </div>
      </section>

      <div className="grid two">
        <section className="card leader-card">
          <span className="eyebrow">Sprint do ranking</span>
          <h2>Quem esta puxando a fila</h2>
          {leader ? (
            <>
              <strong>{leader.username}</strong>
              <p className="muted">
                Primeiro lugar com {leader.totalPoints} pontos totais, {leader.exactScores}{" "}
                placares exatos e {leader.correctOutcomes} resultados cravados.
              </p>
            </>
          ) : (
            <p className="muted">O ranking aparece assim que houver palpites e resultados.</p>
          )}
        </section>

        <section className="card">
          <span className="eyebrow">Top 5</span>
          <h2>Disputa mais quente</h2>
          {contenders.length > 0 ? (
            <div className="leaderboard-list">
              {contenders.map((row) => (
                <article key={row.userId} className="leaderboard-item">
                  <span className="position-pill">{row.position}</span>
                  <div>
                    <strong>{row.username}</strong>
                    <span>
                      {row.exactScores} exatos, {row.correctOutcomes} resultados e{" "}
                      {row.topFourPoints} pontos no Top 4
                    </span>
                  </div>
                  <strong>{row.totalPoints} pts</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Ainda nao ha usuarios suficientes para montar a corrida.</p>
          )}
        </section>
      </div>
    </main>
  );
}
