"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recalculateRanking } from "@/services/ranking.service";

export async function recalculateRankingAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "");
  if (!process.env.ADMIN_SYNC_TOKEN || token !== process.env.ADMIN_SYNC_TOKEN) {
    redirect("/ranking?error=Token administrativo invalido.");
  }

  await recalculateRanking();
  revalidatePath("/ranking");
  revalidatePath("/dashboard");
  redirect("/ranking?recalculated=1");
}
