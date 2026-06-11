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
      <section className="page-header">
        <div>
          <span className="eyebrow">Aposta premium</span>
          <h1>Top 4 da Copa</h1>
          <p className="muted">
            Escolha campeao, vice, terceiro e quarto colocado. Essa aposta vale
            mais pontos que os jogos individuais.
          </p>
        </div>
      </section>

      {params.error ? <p className="error">{params.error}</p> : null}
      {params.saved ? <p className="success">Top 4 salvo.</p> : null}

      <div className="top-four-grid">
        <section className="card top-four-points">
          <div>
            <span className="eyebrow">Como pontua</span>
            <h2>Onde vale mais</h2>
          </div>
          <article>
            <h3>Posicao exata</h3>
            <p className="muted">Cada colocacao cravada vale 10 pontos.</p>
          </article>
          <article>
            <h3>Selecao no Top 4</h3>
            <p className="muted">Mesmo fora da ordem certa, cada presenca oficial vale 5 pontos.</p>
          </article>
          <article>
            <h3>Fechamento estrategico</h3>
            <p className="muted">
              Essa aposta costuma decidir desempates quando o grupo esta apertado.
            </p>
          </article>
        </section>

        {teams.length > 0 ? (
          <TopFourForm teams={teams} prediction={document.topFour} />
        ) : (
          <section className="card">
            <h2>Selecoes indisponiveis</h2>
            <p className="muted">
              Cadastre ou sincronize as selecoes antes de preencher o Top 4.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
