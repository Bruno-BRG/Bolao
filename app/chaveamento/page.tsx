import { redirect } from "next/navigation";
import { BracketPredictionBoard } from "@/components/BracketPredictionBoard";
import { KnockoutBracketBoard } from "@/components/KnockoutBracketBoard";
import { isBracketLocked } from "@/lib/bracket-scoring";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

export default async function ChaveamentoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [matches, teams, row] = await Promise.all([
    listMatches({ refreshIfStale: true }),
    listTeams(),
    getOrCreatePredictionDocument(user.id)
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const knockoutMatches = matches.filter((match) => isKnockoutStage(match.stage));
  const bracketLocked = isBracketLocked(matches);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Chaveamento</h1>
          <p className="muted">
            Preveja o mata-mata ate a final e acompanhe o chaveamento oficial. O
            chaveamento trava no inicio das oitavas.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Meu chaveamento</h2>
        <p className="muted">
          Escolha os vencedores de cada fase. Campeao e vice saem da final.
        </p>
        <BracketPredictionBoard
          locked={bracketLocked}
          matches={knockoutMatches}
          savedBracket={document.bracket}
          teams={teams}
        />
      </section>

      <section className="page-header">
        <h2>Chaveamento oficial</h2>
      </section>

      {knockoutMatches.length === 0 ? (
        <section className="card">
          <p className="muted">Nenhum jogo de mata-mata disponivel no momento.</p>
        </section>
      ) : (
        <KnockoutBracketBoard matches={knockoutMatches} />
      )}
    </main>
  );
}
