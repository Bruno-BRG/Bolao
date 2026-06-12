import { redirect } from "next/navigation";
import { AdminMatchesPanel } from "@/components/AdminMatchesPanel";
import { listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false }
};

export default async function AdminPartidasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = await listMatches({ refreshIfStale: false });

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Admin — Partidas</h1>
          <p className="muted">
            Edite status, placar e horario quando a API falhar. Pagina secreta (nao
            aparece no menu).
          </p>
        </div>
      </section>

      <AdminMatchesPanel matches={matches} />
    </main>
  );
}
