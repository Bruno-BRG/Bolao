import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { syncWorldCupFromApiFootball } from "@/services/api-football.service";
import { recalculateRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-sync-token");
  if (!process.env.ADMIN_SYNC_TOKEN || token !== process.env.ADMIN_SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = (process.env.FOOTBALL_PROVIDER ?? "api-football").toLowerCase();
  const supabase = getSupabaseAdmin();

  try {
    if (provider !== "api-football") {
      throw new Error(`Unsupported provider "${provider}". Use api-football.`);
    }

    const syncResult = await syncWorldCupFromApiFootball();
    const ranking = await recalculateRanking();

    return NextResponse.json({
      ok: true,
      message: "Sync concluido com API-Football e ranking recalculado.",
      provider,
      syncResult,
      ranking
    });
  } catch (error) {
    await supabase.from("sync_logs").insert({
      provider,
      status: "error",
      message: (error as Error).message
    });

    return NextResponse.json(
      {
        ok: false,
        provider,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export const GET = POST;
