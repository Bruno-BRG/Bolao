import Link from "next/link";
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
    <main className="container container--narrow">
      <section className="page-header">
        <div>
          <h1>Top 4</h1>
          <p className="muted">
            Escolha campeao, vice, terceiro e quarto. Depois de salvar, nao da para mudar.
          </p>
        </div>
        <Link className="button secondary" href="/palpites">
          Voltar aos palpites
        </Link>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? <p className="success">Top 4 salvo e travado.</p> : null}

      {teams.length > 0 ? (
        <TopFourForm teams={teams} prediction={document.topFour} />
      ) : (
        <section className="card">
          <p className="muted">Selecoes ainda nao carregadas. Tente de novo em instantes.</p>
        </section>
      )}
    </main>
  );
}
