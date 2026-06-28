"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidAdminToken } from "@/lib/admin-auth";
import { ADMIN_STAGE_OPTIONS } from "@/lib/knockout-stages";
import { isDecisionMethod } from "@/lib/decision-method";
import { MATCH_STATUS_OPTIONS } from "@/lib/match-status";
import { createMatchFromAdmin, updateMatchFromAdmin } from "@/services/match-admin.service";
import { recalculateRanking } from "@/services/ranking.service";
import { syncWorldCupData } from "@/services/worldcup-sync.service";

const updateMatchSchema = z.object({
  matchId: z.string().min(1),
  status: z.enum(MATCH_STATUS_OPTIONS),
  scoreHome: z.coerce.number().int().min(0).max(30).optional(),
  scoreAway: z.coerce.number().int().min(0).max(30).optional(),
  startsAt: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  winnerTeamId: z.string().optional(),
  decidedBy: z.string().optional()
});

export async function recalculateRankingAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "").trim();
  if (!isValidAdminToken(token)) {
    redirect("/ranking?error=Token administrativo invalido.");
  }

  try {
    await recalculateRanking();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao recalcular ranking.";
    redirect(`/ranking?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/ranking");
  revalidatePath("/dashboard");
  redirect("/ranking?recalculated=1");
}

const createMatchSchema = updateMatchSchema.extend({
  stage: z.enum(ADMIN_STAGE_OPTIONS),
  groupName: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional()
});

function revalidateMatchPaths() {
  revalidatePath("/palpites");
  revalidatePath("/admin/partidas");
  revalidatePath("/ranking");
  revalidatePath("/comunidade");
}

export async function syncWorldCupAdminAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "").trim();
  if (!isValidAdminToken(token)) {
    return { ok: false as const, error: "Token administrativo invalido." };
  }

  try {
    const syncResult = await syncWorldCupData({ allowGithubFallback: true });

    if (formData.get("recalculateRanking") === "on") {
      await recalculateRanking();
    }

    revalidateMatchPaths();

    return {
      ok: true as const,
      message: `Sync concluido: ${syncResult.fixtures} jogos, ${syncResult.teams} times.`
    };
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error).message
    };
  }
}

export async function createMatchAdminAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "").trim();
  if (!isValidAdminToken(token)) {
    return { ok: false as const, error: "Token administrativo invalido." };
  }

  const scoreHomeRaw = String(formData.get("scoreHome") ?? "").trim();
  const scoreAwayRaw = String(formData.get("scoreAway") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const homeTeamId = String(formData.get("homeTeamId") ?? "").trim();
  const awayTeamId = String(formData.get("awayTeamId") ?? "").trim();
  const groupNameRaw = String(formData.get("groupName") ?? "").trim();

  const parsed = createMatchSchema.safeParse({
    matchId: formData.get("matchId"),
    status: formData.get("status"),
    stage: formData.get("stage"),
    scoreHome: scoreHomeRaw === "" ? undefined : scoreHomeRaw,
    scoreAway: scoreAwayRaw === "" ? undefined : scoreAwayRaw,
    startsAt: startsAtRaw || undefined,
    groupName: groupNameRaw || undefined,
    homeTeamId: homeTeamId || undefined,
    awayTeamId: awayTeamId || undefined
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Dados invalidos para o jogo." };
  }

  try {
    const startsAt = new Date(parsed.data.startsAt!).toISOString();
    if (Number.isNaN(new Date(parsed.data.startsAt!).getTime())) {
      return { ok: false as const, error: "Data/hora invalida." };
    }

    await createMatchFromAdmin({
      externalId: parsed.data.matchId,
      status: parsed.data.status,
      stage: parsed.data.stage,
      groupName: parsed.data.stage === "Grupos" ? groupNameRaw || null : null,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      scoreHome: scoreHomeRaw === "" ? null : (parsed.data.scoreHome ?? null),
      scoreAway: scoreAwayRaw === "" ? null : (parsed.data.scoreAway ?? null),
      startsAt
    });

    if (formData.get("recalculateRanking") === "on") {
      await recalculateRanking();
    }

    revalidateMatchPaths();

    return {
      ok: true as const,
      message: "Jogo criado no banco."
    };
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error).message
    };
  }
}

export async function updateMatchAdminAction(formData: FormData) {
  const token = String(formData.get("adminToken") ?? "").trim();
  if (!isValidAdminToken(token)) {
    return { ok: false as const, error: "Token administrativo invalido." };
  }

  const scoreHomeRaw = String(formData.get("scoreHome") ?? "").trim();
  const scoreAwayRaw = String(formData.get("scoreAway") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const homeTeamId = String(formData.get("homeTeamId") ?? "").trim();
  const awayTeamId = String(formData.get("awayTeamId") ?? "").trim();
  const winnerTeamId = String(formData.get("winnerTeamId") ?? "").trim();
  const decidedByRaw = String(formData.get("decidedBy") ?? "").trim();

  const parsed = updateMatchSchema.safeParse({
    matchId: formData.get("matchId"),
    status: formData.get("status"),
    scoreHome: scoreHomeRaw === "" ? undefined : scoreHomeRaw,
    scoreAway: scoreAwayRaw === "" ? undefined : scoreAwayRaw,
    startsAt: startsAtRaw || undefined,
    homeTeamId: homeTeamId || undefined,
    awayTeamId: awayTeamId || undefined,
    winnerTeamId: winnerTeamId || undefined,
    decidedBy: decidedByRaw || undefined
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
      startsAt,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      winnerTeamId: winnerTeamId || null,
      decidedBy: isDecisionMethod(decidedByRaw) ? decidedByRaw : null
    });

    if (formData.get("recalculateRanking") === "on") {
      await recalculateRanking();
    }

    revalidateMatchPaths();

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
