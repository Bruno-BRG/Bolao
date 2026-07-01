import Link from "next/link";
import { redirect } from "next/navigation";
import { BracketPredictionBoard } from "@/components/BracketPredictionBoard";
import { isBracketLocked } from "@/lib/bracket-scoring";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

export default async function SeuChaveamentoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [matches, teams, row] = await Promise.all([
    listMatches({ refreshIfStale: false }),
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
          <h1>Seu chaveamento</h1>
          <p className="muted">
            Monte sua previsao do mata-mata ate a final. Trava no inicio das oitavas.
          </p>
        </div>
        <div className="page-header__actions">
          <Link className="button secondary" href="/chaveamento">
            Ver oficial
          </Link>
          <Link className="button secondary" href="/sobre">
            Como pontua
          </Link>
        </div>
      </section>

      {knockoutMatches.length === 0 ? (
        <section className="card">
          <p className="muted">Nenhum jogo de mata-mata disponivel no momento.</p>
        </section>
      ) : (
        <BracketPredictionBoard
          locked={bracketLocked}
          matches={knockoutMatches}
          savedBracket={document.bracket}
          teams={teams}
        />
      )}
    </main>
  );
}
