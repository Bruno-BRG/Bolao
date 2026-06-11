import { redirect } from "next/navigation";
import { PalpitesWorkspace } from "@/components/PalpitesWorkspace";
import { shouldShowMatchInPalpites } from "@/lib/match-visibility";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
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
  const [row, matches] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches()
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const savedMatchIds = new Set(Object.keys(document.matches));
  const visibleMatches = matches.filter((match) =>
    shouldShowMatchInPalpites(match, savedMatchIds)
  );
  const hiddenCount = matches.length - visibleMatches.length;

  return (
    <main className="container container--palpites">
      <section className="page-header">
        <div>
          <span className="eyebrow">Seus palpites</span>
          <h1>Placares</h1>
          <p className="muted">
            Preencha com calma. Os rascunhos ficam salvos no navegador ate voce
            clicar em salvar.
          </p>
        </div>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? (
        <p className="success">
          {params.unchanged ? "Palpite ja estava salvo." : "Palpite salvo."}
        </p>
      ) : null}

      {hiddenCount > 0 ? (
        <p className="muted palpites-note">
          {hiddenCount} jogo{hiddenCount === 1 ? "" : "s"} de mata-mata ainda sem
          confronto definido. Eles aparecem aqui quando as selecoes forem
          conhecidas.
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
