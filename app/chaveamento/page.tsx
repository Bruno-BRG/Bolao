import Link from "next/link";
import { redirect } from "next/navigation";
import { KnockoutBracketBoard } from "@/components/KnockoutBracketBoard";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export default async function ChaveamentoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = await listMatches({ refreshIfStale: false });
  const knockoutMatches = matches.filter((match) => isKnockoutStage(match.stage));

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Chaveamento</h1>
          <p className="muted">
            Mata-mata oficial da Copa — resultados reais, times atualizados conforme os
            jogos acontecem.
          </p>
        </div>
        <Link className="button secondary" href="/seu_chaveamento">
          Meu chaveamento
        </Link>
      </section>

      {knockoutMatches.length === 0 ? (
        <section className="card">
          <p className="muted">Nenhum jogo de mata-mata disponivel no momento.</p>
        </section>
      ) : (
        <KnockoutBracketBoard matches={knockoutMatches} />
      )}
    </main>
  );
}
