import { redirect } from "next/navigation";
import { AdminMatchesPanel } from "@/components/AdminMatchesPanel";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false }
};

export default async function AdminPartidasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [matches, teams] = await Promise.all([
    listMatches({ refreshIfStale: false }),
    listTeams()
  ]);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Admin — Partidas</h1>
          <p className="muted">
            Sincronize, edite ou insira jogos quando a API falhar — especialmente no
            mata-mata. Pagina secreta (nao aparece no menu).
          </p>
        </div>
      </section>

      <AdminMatchesPanel matches={matches} teams={teams} />
    </main>
  );
}
