import { redirect } from "next/navigation";
import {
  CommunityPredictionsBoard,
  type CommunityMemberSummary
} from "@/components/CommunityPredictionsBoard";
import { listPredictionSummaries } from "@/repositories/predictions.repo";
import { listMatchesCached, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export default async function ComunidadePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, matches, teams] = await Promise.all([
    listPredictionSummaries(),
    listMatchesCached(),
    listTeams()
  ]);

  const members: CommunityMemberSummary[] = rows
    .filter((row) => row.saved_matches > 0 || row.has_bracket)
    .map((row) => ({
      userId: row.user_id,
      username: row.users?.username ?? "Jogador",
      totalPoints: row.total_points,
      savedMatches: row.saved_matches,
      hasBracket: row.has_bracket
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.username.localeCompare(b.username));

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <h1>Palpites da galera</h1>
          <p className="muted">Escolha um participante para ver os palpites dele.</p>
        </div>
      </section>

      <CommunityPredictionsBoard
        currentUserId={user.id}
        matches={matches}
        members={members}
        teams={teams}
      />
    </main>
  );
}
