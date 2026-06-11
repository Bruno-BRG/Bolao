import { redirect } from "next/navigation";
import { TopFourForm } from "@/components/TopFourForm";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

export default async function TopFourPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [row, teams] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listTeams()
  ]);
  const document = normalizePredictionDocument(row.predictions);

  return (
    <main className="container">
      <h1>Top 4 da Copa</h1>
      <p className="muted">
        Escolha campeao, vice, terceiro e quarto colocado. Essa aposta vale mais
        pontos que os jogos individuais.
      </p>
      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? <p className="success">Top 4 salvo.</p> : null}
      {teams.length > 0 ? (
        <TopFourForm teams={teams} prediction={document.topFour} />
      ) : (
        <p className="muted">
          Cadastre ou sincronize as selecoes antes de preencher o Top 4.
        </p>
      )}
    </main>
  );
}
