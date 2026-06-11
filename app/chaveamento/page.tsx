import { BracketGraph } from "@/components/BracketGraph";
import { getLiveWorldCupData } from "@/services/worldcup-live.service";

export const dynamic = "force-dynamic";

export default async function ChaveamentoPage() {
  const liveData = await getLiveWorldCupData();
  const knockoutMatches = liveData.matches.filter((match) => match.stage !== "Grupos");

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Chaveamento</h1>
          <p className="muted">Arraste para o lado para ver toda a arvore.</p>
        </div>
      </section>

      <section className="bracket-board">
        <BracketGraph matches={knockoutMatches} />
      </section>
    </main>
  );
}
