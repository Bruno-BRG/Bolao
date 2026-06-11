import { redirect } from "next/navigation";
import { PredictionForm } from "@/components/PredictionForm";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { getLatestSyncLog, listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [row, matches, latestSyncLog] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches(),
    getLatestSyncLog().catch(() => null)
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const hasSampleMatches =
    matches.length > 0 && matches.every((match) => match.external_id.startsWith("wc2026-"));
  const savedMatches = Object.keys(document.matches).length;

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Palpites por jogo</span>
          <h1>Monte seus placares</h1>
          <p className="muted">
            Os palpites travam automaticamente no horario de inicio de cada partida.
            Hoje voce ja salvou {savedMatches} jogos.
          </p>
        </div>
        <div className="topbar-actions">
          <span className="status-pill">{matches.length} jogos carregados</span>
        </div>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? <p className="success">Palpite salvo.</p> : null}
      {hasSampleMatches ? (
        <p className="error">
          O banco ainda esta com a grade mockada de exemplo. Rode a migration de
          limpeza e depois o sync automatico para carregar a Copa real.
        </p>
      ) : null}
      {latestSyncLog?.status === "error" ? (
        <p className="error">Erro no sync automatico: {latestSyncLog.message}</p>
      ) : null}
      {matches.length === 0 ? (
        <p className="muted">Nenhum jogo oficial foi sincronizado ainda.</p>
      ) : null}

      <div className="match-list">
        {matches.map((match) => (
          <PredictionForm
            key={match.external_id}
            match={match}
            prediction={document.matches[match.external_id]}
          />
        ))}
      </div>
    </main>
  );
}
