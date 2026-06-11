import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [row, matches] = await Promise.all([
    getOrCreatePredictionDocument(user.id),
    listMatches()
  ]);
  const document = normalizePredictionDocument(row.predictions);
  const savedMatches = Object.keys(document.matches).length;
  const pendingMatches = Math.max(matches.length - savedMatches, 0);

  return (
    <main className="container">
      <h1>Painel</h1>
      <p className="muted">Logado como {user.username}</p>
      <div className="grid three">
        <section className="card stat">
          <span className="muted">Pontos</span>
          <strong>{document.summary.totalPoints}</strong>
        </section>
        <section className="card stat">
          <span className="muted">Palpites salvos</span>
          <strong>{savedMatches}</strong>
        </section>
        <section className="card stat">
          <span className="muted">Jogos pendentes</span>
          <strong>{pendingMatches}</strong>
        </section>
      </div>
      <div className="actions">
        <Link className="button" href="/palpites">
          Preencher palpites
        </Link>
        <Link className="button secondary" href="/top-4">
          Escolher Top 4
        </Link>
      </div>
    </main>
  );
}
