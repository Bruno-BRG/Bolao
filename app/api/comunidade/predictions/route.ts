import { NextResponse } from "next/server";
import { getUserCommunityPredictions } from "@/repositories/predictions.repo";
import { getCurrentUser } from "@/services/auth.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const predictions = await getUserCommunityPredictions(userId);
  if (!predictions) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(predictions);
}
