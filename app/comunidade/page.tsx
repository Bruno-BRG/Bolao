import { redirect } from "next/navigation";
import {
  CommunityPredictionsBoard,
  type CommunityMember
} from "@/components/CommunityPredictionsBoard";
import { listPredictionRows } from "@/repositories/predictions.repo";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

export const dynamic = "force-dynamic";

type PredictionRow = Awaited<ReturnType<typeof listPredictionRows>>[number] & {
  users?: { username?: string; created_at?: string } | { username?: string; created_at?: string }[];
};

function getUsername(row: PredictionRow) {
  const users = Array.isArray(row.users) ? row.users[0] : row.users;
  return users?.username ?? "Jogador";
}

export default async function ComunidadePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, matches, teams] = await Promise.all([
    listPredictionRows(),
    listMatches({ autoSyncIfEmpty: false }),
    listTeams()
  ]);

  const members: CommunityMember[] = rows
    .map((row) => {
      const username = getUsername(row as PredictionRow);
      const document = normalizePredictionDocument(row.predictions);
      const matchPredictions = Object.fromEntries(
        Object.entries(document.matches).map(([matchId, prediction]) => [
          matchId,
          {
            homeGoals: prediction.homeGoals,
            awayGoals: prediction.awayGoals,
            points: prediction.points
          }
        ])
      );

      return {
        userId: row.user_id,
        username,
        totalPoints: row.total_points ?? document.summary.totalPoints,
        savedMatches: Object.keys(document.matches).length,
        topFour: document.topFour,
        matchPredictions
      };
    })
    .filter((member) => member.savedMatches > 0 || member.topFour)
    .sort((a, b) => b.totalPoints - a.totalPoints || a.username.localeCompare(b.username));

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <span className="eyebrow">Bolao aberto</span>
          <h1>Palpites da galera</h1>
          <p className="muted">
            Veja o que cada participante ja salvou nos jogos e no Top 4.
          </p>
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
