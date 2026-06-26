import { NextRequest, NextResponse } from "next/server";
import { insertSyncLog } from "@/lib/cache-sync";
import {
  ensureWorldCupData,
  getWorldCupProvider,
  syncWorldCupData
} from "@/services/worldcup-sync.service";
import {
  getLatestRanking,
  recalculateRanking,
  shouldRefreshRanking
} from "@/services/ranking.service";

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

  const provider = getWorldCupProvider();

  try {
    const force = request.nextUrl.searchParams.get("force") === "1";
    const ensured = force
      ? {
          ran: true,
          reason: "forced" as const,
          syncResult: await syncWorldCupData({ allowGithubFallback: true })
        }
      : await ensureWorldCupData({ force: false });
    const ranking =
      force || ensured.ran || (await shouldRefreshRanking())
        ? await recalculateRanking()
        : await getLatestRanking();

    return NextResponse.json({
      ok: true,
      message: ensured.ran
        ? "Sync concluido e ranking recalculado."
        : "Dados ja estavam recentes; ranking mantido ou recalculado se necessario.",
      provider,
      syncResult: ensured.ran ? ensured.syncResult : null,
      reason: ensured.reason,
      ranking
    });
  } catch (error) {
    await insertSyncLog({
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
