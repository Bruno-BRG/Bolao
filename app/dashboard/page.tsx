import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
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
  const progress = matches.length > 0 ? Math.round((savedMatches / matches.length) * 100) : 0;

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Painel do jogador</span>
          <h1>Seu centro de controle</h1>
          <p className="muted">
            Logado como {user.username}. Acompanhe o quanto ja preencheu, o que
            ainda falta e avance rapido para os jogos e o Top 4.
          </p>
        </div>
        <div className="topbar-actions">
          <Link className="button" href="/palpites">
            Abrir palpites
          </Link>
          <Link className="button secondary" href="/top-4">
            Editar Top 4
          </Link>
        </div>
      </section>

      <div className="grid three">
        <section className="card stat stat-card">
          <span>Pontos acumulados</span>
          <strong>{document.summary.totalPoints}</strong>
          <p className="muted">Soma de jogos, aproximacoes e Top 4.</p>
        </section>
        <section className="card stat stat-card">
          <span>Palpites salvos</span>
          <strong>{savedMatches}</strong>
          <p className="muted">Jogos ja enviados e aguardando resultado oficial.</p>
        </section>
        <section className="card stat stat-card">
          <span>Jogos pendentes</span>
          <strong>{pendingMatches}</strong>
          <p className="muted">Partidas que ainda precisam do seu chute.</p>
        </section>
      </div>

      <div className="grid two">
        <section className="card progress-card">
          <div>
            <span className="eyebrow">Cobertura</span>
            <h2>Quanto do bolao ja esta preenchido</h2>
            <p className="muted">
              A barra abaixo considera somente os jogos oficiais ja sincronizados no
              sistema.
            </p>
          </div>
          <div className="progress-meter" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong>{progress}% concluido</strong>
        </section>

        <section className="card">
          <span className="eyebrow">Acoes rapidas</span>
          <h2>Fluxo ideal</h2>
          <div className="glass-list">
            <article>
              <h3>1. Preencha os jogos</h3>
              <p>Salve primeiro os placares das partidas com data ja oficializada.</p>
            </article>
            <article>
              <h3>2. Feche seu Top 4</h3>
              <p>Campeao, vice, terceiro e quarto rendem a parte mais pesada da pontuacao.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
