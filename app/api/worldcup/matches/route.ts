import { NextResponse } from "next/server";
import { listMatches } from "@/repositories/worldcup.repo";
import { ensureWorldCupData } from "@/services/worldcup-sync.service";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureWorldCupData().catch(() => undefined);
  const matches = await listMatches({ refreshIfStale: false });

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
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
