import { BracketGraph } from "@/components/BracketGraph";
import { buildBracketLayout, MAIN_BRACKET_STAGES, PLACEMENT_STAGE } from "@/lib/bracket-layout";
import { getLiveWorldCupData } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

const STAGE_LABELS = [...MAIN_BRACKET_STAGES, PLACEMENT_STAGE];

export default async function ChaveamentoPage() {
  const liveData = await getLiveWorldCupData();
  const knockoutMatches = liveData.matches.filter((match) => match.stage !== "Grupos");
  const layout = buildBracketLayout(knockoutMatches);

  const stageCounts = STAGE_LABELS.map((stage) => ({
    stage,
    count: knockoutMatches.filter((match) => match.stage === stage).length
  }));

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Mata-mata</span>
          <h1>Chaveamento em grafo</h1>
          <p className="muted">
            Visual compacto com nos e arestas ligando cada fase. Passe o mouse nos
            codigos das selecoes para ver o nome completo.
          </p>
        </div>
      </section>

      <section className="source-note">
        <span className="badge">Fonte dinamica</span>
        <p>
          Chaveamento montado com jogos de{" "}
          <a href={liveData.source.gamesUrl} target="_blank" rel="noreferrer">
            {liveData.source.gamesUrl}
          </a>
          .
        </p>
      </section>

      <section className="bracket-legend card">
        {stageCounts.map(({ stage, count }) => (
          <div key={stage} className="bracket-legend__item">
            <span className="eyebrow">{stage}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </section>

      <section className="bracket-board card">
        <BracketGraph layout={layout} />
      </section>
    </main>
  );
}
