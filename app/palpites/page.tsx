import Link from "next/link";
import { redirect } from "next/navigation";
import { PalpitesWorkspace } from "@/components/PalpitesWorkspace";
import { shouldShowMatchInPalpites } from "@/lib/match-visibility";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string; unchanged?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  await getLatestRanking({ refreshIfStale: true }).catch(() => undefined);

  const [row, matches] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches()
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const savedMatchIds = new Set(Object.keys(document.matches));
  const visibleMatches = matches.filter((match) =>
    shouldShowMatchInPalpites(match, savedMatchIds)
  );
  const hasTopFour = Boolean(document.topFour);

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

      {!hasTopFour ? (
        <section className="card action-card">
          <div>
            <h2>Faca tambem seu Top 4</h2>
            <p className="muted">Campeao, vice, terceiro e quarto. Vale mais pontos.</p>
          </div>
          <Link className="button" href="/top-4">
            Ir para o Top 4
          </Link>
        </section>
      ) : null}

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
