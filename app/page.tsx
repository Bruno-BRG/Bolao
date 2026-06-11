import Link from "next/link";
import { formatDateTime } from "@/lib/date";
import { getLatestRanking } from "@/services/ranking.service";
import {
  getLiveFeedHighlights,
  getLiveWorldCupData,
  type LiveMatch
} from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

function getTeamLabel(match: LiveMatch, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  return team?.name ?? fallback ?? "A definir";
}

function MatchStatusCard({
  title,
  match,
  variant
}: {
  title: string;
  match: LiveMatch | null;
  variant: "latest" | "next";
}) {
  if (!match) {
    return (
      <section className="card feed-card">
        <span className="eyebrow">{title}</span>
        <h2>Aguardando agenda</h2>
        <p className="muted">Ainda nao ha jogo suficiente para preencher este bloco.</p>
      </section>
    );
  }

  const home = getTeamLabel(match, "home");
  const away = getTeamLabel(match, "away");

  return (
    <section className="card feed-card">
      <span className="eyebrow">{title}</span>
      <h2>
        {home} x {away}
      </h2>
      <p className="muted">{formatDateTime(match.starts_at)}</p>
      {variant === "latest" ? (
        <strong className="scoreline">
          {match.current_score_home ?? "-"} x {match.current_score_away ?? "-"}
        </strong>
      ) : (
        <p className="muted">
          {match.venue_name}
          {match.city_name ? ` - ${match.city_name}` : ""}
        </p>
      )}
    </section>
  );
}

export default async function HomePage() {
  const [ranking, liveData] = await Promise.all([
    getLatestRanking().catch(() => []),
    getLiveWorldCupData().catch(() => null)
  ]);
  const leader = ranking[0];
  const contenders = ranking.slice(0, 5);
  const highlights = liveData
    ? getLiveFeedHighlights(liveData.matches)
    : { liveMatches: [], latestMatch: null, nextMatch: null };

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

      <section className="source-note">
        <span className="badge">Fonte dinamica</span>
        <p>
          Jogos ao vivo e grupos abaixo puxam direto de{" "}
          <a href={liveData?.source.gamesUrl ?? "#"} target="_blank" rel="noreferrer">
            {liveData?.source.label ?? "worldcup26.ir"}
          </a>
          .
        </p>
      </section>

      <div className="overview-grid">
        <MatchStatusCard
          title="Ultimo jogo encerrado"
          match={highlights.latestMatch}
          variant="latest"
        />
        <MatchStatusCard
          title="Proximo jogo"
          match={highlights.nextMatch}
          variant="next"
        />
        <section className="card feed-card">
          <span className="eyebrow">Placar ao vivo</span>
          <h2>{highlights.liveMatches.length} jogo(s) em andamento</h2>
          {highlights.liveMatches.length > 0 ? (
            <div className="live-list">
              {highlights.liveMatches.slice(0, 3).map((match) => (
                <article key={match.external_id} className="live-item">
                  <div>
                    <strong>
                      {getTeamLabel(match, "home")} x {getTeamLabel(match, "away")}
                    </strong>
                    <span className="muted">
                      {match.minute_label ? `${match.minute_label} min` : "Ao vivo"}
                    </span>
                  </div>
                  <strong className="scoreline">
                    {match.current_score_home ?? "-"} x {match.current_score_away ?? "-"}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Sem partida em andamento neste momento.</p>
          )}
        </section>
      </div>

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
