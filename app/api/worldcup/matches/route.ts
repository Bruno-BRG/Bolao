import { NextResponse } from "next/server";
import { listMatchesLive } from "@/repositories/worldcup.repo";
import { ensureWorldCupData } from "@/services/worldcup-sync.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const ensured = await ensureWorldCupData().catch((error: Error) => ({
    ran: false as const,
    reason: "error" as const,
    error: error.message
  }));
  const matches = await listMatchesLive();

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    sync: ensured,
    matches: matches.map((match) => ({
      external_id: match.external_id,
      status: match.status,
      score_home: match.score_home,
      score_away: match.score_away,
      starts_at: match.starts_at,
      payload: match.payload ?? {}
    }))
  });
}
