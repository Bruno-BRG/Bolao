import { NextResponse } from "next/server";
import { getLatestRanking } from "@/services/ranking.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const ranking = await getLatestRanking();
  return NextResponse.json({ ranking });
}
