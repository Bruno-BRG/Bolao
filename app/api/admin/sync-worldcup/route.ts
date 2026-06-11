import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  ensureWorldCupData,
  syncWorldCupFromApiFootball
} from "@/services/api-football.service";
import { recalculateRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const adminToken = request.headers.get("x-admin-sync-token");
  if (process.env.ADMIN_SYNC_TOKEN && adminToken === process.env.ADMIN_SYNC_TOKEN) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = (process.env.FOOTBALL_PROVIDER ?? "api-football").toLowerCase();
  const supabase = getSupabaseAdmin();

  try {
    if (provider !== "api-football") {
      throw new Error(`Unsupported provider "${provider}". Use api-football.`);
    }

    const force = request.nextUrl.searchParams.get("force") === "1";
    const ensured = force
      ? { ran: true, reason: "forced" as const, syncResult: await syncWorldCupFromApiFootball() }
      : await ensureWorldCupData({ force: false });
    const ranking = await recalculateRanking();

    return NextResponse.json({
      ok: true,
      message: ensured.ran
        ? "Sync concluido com API-Football e ranking recalculado."
        : "Dados ja estavam recentes; ranking recalculado.",
      provider,
      syncResult: ensured.ran ? ensured.syncResult : null,
      reason: ensured.reason,
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
