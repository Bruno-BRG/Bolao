import { redirect } from "next/navigation";
import { PredictionForm } from "@/components/PredictionForm";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
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
  const [row, matches] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches()
  ]);
  const document = normalizePredictionDocument(row.predictions);

  return (
    <main className="container">
      <h1>Palpites dos jogos</h1>
      <p className="muted">
        Os palpites bloqueiam automaticamente no horario de inicio de cada jogo.
      </p>
      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? <p className="success">Palpite salvo.</p> : null}
      <div className="grid">
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
