"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidAdminToken } from "@/lib/admin-auth";
import { MATCH_STATUS_OPTIONS } from "@/lib/match-status";
import { updateMatchFromAdmin } from "@/services/match-admin.service";
import { recalculateRanking } from "@/services/ranking.service";

const updateMatchSchema = z.object({
  matchId: z.string().min(1),
  status: z.enum(MATCH_STATUS_OPTIONS),
  scoreHome: z.coerce.number().int().min(0).max(30).optional(),
  scoreAway: z.coerce.number().int().min(0).max(30).optional(),
  startsAt: z.string().optional()
});

export async function recalculateRankingAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "");
  if (!isValidAdminToken(token)) {
    redirect("/ranking?error=Token administrativo invalido.");
  }

  await recalculateRanking();
  revalidatePath("/ranking");
  revalidatePath("/dashboard");
  redirect("/ranking?recalculated=1");
}

export async function updateMatchAdminAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "");
  if (!isValidAdminToken(token)) {
    return { ok: false as const, error: "Token administrativo invalido." };
  }

  const scoreHomeRaw = String(formData.get("scoreHome") ?? "").trim();
  const scoreAwayRaw = String(formData.get("scoreAway") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();

  const parsed = updateMatchSchema.safeParse({
    matchId: formData.get("matchId"),
    status: formData.get("status"),
    scoreHome: scoreHomeRaw === "" ? undefined : scoreHomeRaw,
    scoreAway: scoreAwayRaw === "" ? undefined : scoreAwayRaw,
    startsAt: startsAtRaw || undefined
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Dados invalidos para o jogo." };
  }

  try {
    const startsAt = parsed.data.startsAt
      ? new Date(parsed.data.startsAt).toISOString()
      : undefined;

    if (parsed.data.startsAt && Number.isNaN(new Date(parsed.data.startsAt).getTime())) {
      return { ok: false as const, error: "Data/hora invalida." };
    }

    await updateMatchFromAdmin({
      externalId: parsed.data.matchId,
      status: parsed.data.status,
      scoreHome: scoreHomeRaw === "" ? null : (parsed.data.scoreHome ?? null),
      scoreAway: scoreAwayRaw === "" ? null : (parsed.data.scoreAway ?? null),
      startsAt
    });

    if (formData.get("recalculateRanking") === "on") {
      await recalculateRanking();
    }

    revalidatePath("/palpites");
    revalidatePath("/admin/partidas");
    revalidatePath("/ranking");
    revalidatePath("/comunidade");

    return {
      ok: true as const,
      message: "Jogo atualizado no banco."
    };
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error).message
    };
  }
}
