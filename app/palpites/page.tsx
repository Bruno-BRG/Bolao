import Link from "next/link";
import { redirect } from "next/navigation";
import { BracketPodiumSummary } from "@/components/BracketPodiumSummary";
import { PalpitesWorkspace } from "@/components/PalpitesWorkspace";
import { shouldShowMatchInPalpites } from "@/lib/match-visibility";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";
export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string; unchanged?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  const [row, matches, teams] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches({ refreshIfStale: false }),
    listTeams()
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const savedMatchIds = new Set(Object.keys(document.matches));
  const visibleMatches = matches.filter((match) =>
    shouldShowMatchInPalpites(match, savedMatchIds)
  );
  const bracket = document.bracket;
  const hasBracket = Boolean(bracket?.championTeamId);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Meus palpites</h1>
          <p className="muted">
            Preencha o placar de cada jogo. Salva sozinho quando os dois numeros estiverem
            preenchidos. Fecha na hora do jogo.
          </p>
        </div>
      </section>

      {hasBracket && bracket ? (
        <BracketPodiumSummary bracket={bracket} editable teams={teams} />
      ) : (
        <section className="card action-card">
          <div>
            <h2>Monte seu chaveamento</h2>
            <p className="muted">
              Preveja o mata-mata ate a final e o podio (campeao, vice, 3o e 4o). O Top 4
              antigo foi substituido por essa previsao completa.
            </p>
          </div>
          <Link className="button" href="/seu_chaveamento">
            Ir para seu chaveamento
          </Link>
        </section>
      )}

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? (
        <p className="success">
          {params.unchanged ? "Palpite ja estava salvo." : "Palpites salvos com sucesso."}
        </p>
      ) : null}

      {visibleMatches.length === 0 ? (
        <section className="card">
          <p className="muted">Nenhum jogo liberado para palpite no momento.</p>
        </section>
      ) : (
        <PalpitesWorkspace matches={visibleMatches} savedPredictions={document.matches} />
      )}
    </main>
  );
}
