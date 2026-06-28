import Link from "next/link";
import { SCORING_RULES } from "@/lib/constants";

export default function SobrePage() {
  return (
    <main className="container container--narrow">
      <section className="page-header">
        <div>
          <h1>Sobre o bolao</h1>
          <p className="muted">
            Como funciona a pontuacao a partir do mata-mata e do chaveamento completo.
          </p>
        </div>
      </section>

      <section className="card rules-card">
        <h2>Palpite por jogo (fase de grupos)</h2>
        <ul className="rules-list">
          <li>
            <strong>{SCORING_RULES.exactScore} pts</strong> — placar exato
          </li>
          <li>
            <strong>{SCORING_RULES.correctWinner} pts</strong> — acertou o vencedor
          </li>
          <li>
            <strong>{SCORING_RULES.correctDraw} pts</strong> — acertou empate (sem
            cravar o placar)
          </li>
        </ul>
      </section>

      <section className="card rules-card">
        <h2>Mata-mata — bonus por jogo</h2>
        <p className="muted rules-card__lead">
          Alem da pontuacao do placar, nos jogos eliminatorios voce tambem palpita quem
          avanca e como a partida e decidida.
        </p>
        <ul className="rules-list">
          <li>
            <strong>+{SCORING_RULES.knockoutQualified} pts</strong> — acertou quem
            classificou
          </li>
          <li>
            <strong>+{SCORING_RULES.knockoutMethodRegular} pts</strong> — classificacao
            no tempo normal
          </li>
          <li>
            <strong>+{SCORING_RULES.knockoutMethodExtraTime} pts</strong> — classificacao
            na prorrogacao
          </li>
          <li>
            <strong>+{SCORING_RULES.knockoutMethodPenalties} pts</strong> — classificacao
            nos penaltis
          </li>
        </ul>
        <div className="rules-callout">
          <strong>Importante:</strong> o placar e sempre antes dos penaltis. Se voce
          acha que vai para os penaltis, coloque empate e escolha quem classifica.
          <br />
          <span className="muted">Ex.: Brasil 1x1 Argentina · Classificado: Brasil · Forma: Penaltis</span>
        </div>
      </section>

      <section className="card rules-card">
        <h2>Seu chaveamento</h2>
        <p className="muted rules-card__lead">
          Em <Link href="/seu_chaveamento">Seu chaveamento</Link> voce preve quem avanca
          em cada fase ate a final. Pontos extras quando acertar:
        </p>
        <ul className="rules-list">
          <li>
            <strong>+4 pts</strong> por time correto nas quartas
          </li>
          <li>
            <strong>+7 pts</strong> por semifinalista correto
          </li>
          <li>
            <strong>+12 pts</strong> por finalista correto
          </li>
          <li>
            <strong>+25 pts</strong> — campeao correto
          </li>
          <li>
            <strong>+12 pts</strong> — vice correto
          </li>
          <li>
            <strong>+20 pts</strong> — Top 4 completo (fora de ordem)
          </li>
          <li>
            <strong>+40 pts</strong> — Top 4 completo na ordem certa
          </li>
        </ul>
        <p className="muted">
          O chaveamento (incluindo campeao, vice e podio) trava no inicio do primeiro jogo
          das oitavas. Depois disso nao da para editar.
        </p>
      </section>

      <section className="card rules-card">
        <h2>Bloqueios</h2>
        <ul className="rules-list">
          <li>
            <strong>Palpite de jogo</strong> — trava na hora do inicio da partida
          </li>
          <li>
            <strong>Seu chaveamento</strong> — trava no inicio das oitavas (inclui o podio)
          </li>
        </ul>
      </section>

      <section className="card rules-card">
        <h2>Ranking</h2>
        <p className="muted">
          O ranking geral soma tudo: jogos da fase de grupos, bonus do mata-mata e pontos do
          chaveamento. No ranking voce tambem ve a divisao por categoria.
        </p>
      </section>
    </main>
  );
}
