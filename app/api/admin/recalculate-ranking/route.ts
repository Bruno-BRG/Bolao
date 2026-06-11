import { NextRequest, NextResponse } from "next/server";
import { recalculateRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-sync-token");
  if (!process.env.ADMIN_SYNC_TOKEN || token !== process.env.ADMIN_SYNC_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ranking = await recalculateRanking();
  return NextResponse.json({ ok: true, ranking });
}
