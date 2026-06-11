import { BracketGraph } from "@/components/BracketGraph";
import { buildBracketLayout } from "@/lib/bracket-layout";
import { getLiveWorldCupData } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

export default async function ChaveamentoPage() {
  const liveData = await getLiveWorldCupData();
  const knockoutMatches = liveData.matches.filter((match) => match.stage !== "Grupos");
  const layout = buildBracketLayout(knockoutMatches);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Mata-mata</span>
          <h1>Chaveamento</h1>
          <p className="muted">
            Arvore horizontal no estilo do Google: cada jogo conecta ao proximo
            confronto sem colunas gigantes por fase.
          </p>
        </div>
      </section>

      <section className="source-note">
        <span className="badge">Fonte dinamica</span>
        <p>
          Dados de{" "}
          <a href={liveData.source.gamesUrl} target="_blank" rel="noreferrer">
            {liveData.source.gamesUrl}
          </a>
          .
        </p>
      </section>

      <section className="bracket-board">
        <BracketGraph layout={layout} />
      </section>
    </main>
  );
}
