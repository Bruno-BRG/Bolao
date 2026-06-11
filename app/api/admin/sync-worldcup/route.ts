import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { recalculateRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-sync-token");
  if (!process.env.ADMIN_SYNC_TOKEN || token !== process.env.ADMIN_SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("sync_logs").insert({
    provider: process.env.FOOTBALL_PROVIDER ?? "manual",
    status: "skipped",
    message:
      "Sync provider ainda nao configurado. Atualize matches_cache/teams_cache ou implemente o provedor escolhido."
  });
  if (error) throw error;

  const ranking = await recalculateRanking();
  return NextResponse.json({
    ok: true,
    message: "Ranking recalculado; sync externo ainda depende do provedor.",
    ranking
  });
}

export const GET = POST;
