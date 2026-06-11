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
          <h1>Chaveamento</h1>
          <p className="muted">Jogos do mata-mata.</p>
        </div>
      </section>

      <section className="bracket-board">
        <BracketGraph layout={layout} />
      </section>
    </main>
  );
}
