"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCKED_STATUSES } from "@/lib/constants";
import { isMatchPredictable } from "@/lib/match-visibility";
import { getOrCreatePredictionDocument, updatePredictionDocument } from "@/repositories/predictions.repo";
import { findMatch } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeGoals: z.coerce.number().int().min(0).max(30),
  awayGoals: z.coerce.number().int().min(0).max(30)
});

const bulkPredictionSchema = z.object({
  predictions: z
    .array(
      z.object({
        matchId: z.string().min(1),
        homeGoals: z.number().int().min(0).max(30),
        awayGoals: z.number().int().min(0).max(30)
      })
    )
    .min(1)
});

const topFourSchema = z.object({
  first: z.string().min(1),
  second: z.string().min(1),
  third: z.string().min(1),
  fourth: z.string().min(1)
});

export type BulkSaveResult = {
  ok: boolean;
  saved: number;
  unchanged: number;
  skipped: number;
  error?: string;
};

function ensureUnique(values: string[]) {
  return new Set(values).size === values.length;
}

function isMatchLocked(match: Awaited<ReturnType<typeof findMatch>>) {
  if (!match) return true;
  const startsAt = new Date(match.starts_at).getTime();
  return startsAt <= Date.now() || LOCKED_STATUSES.has(match.status.toUpperCase());
}

async function persistMatchPrediction(
  userId: string,
  input: z.infer<typeof predictionSchema>
) {
  const match = await findMatch(input.matchId);
  if (!match) return { status: "missing" as const };
  if (!isMatchPredictable(match)) return { status: "unpredictable" as const };
  if (isMatchLocked(match)) return { status: "locked" as const };

  const row = await getOrCreatePredictionDocument(userId);
  const document = normalizePredictionDocument(row.predictions);
  const existing = document.matches[input.matchId];

  if (
    existing &&
    existing.homeGoals === input.homeGoals &&
    existing.awayGoals === input.awayGoals
  ) {
    return { status: "unchanged" as const };
  }

  const now = new Date().toISOString();
  document.updatedAt = now;
  document.matches[input.matchId] = {
    homeTeamId: match.home_team_id,
    awayTeamId: match.away_team_id,
    homeGoals: input.homeGoals,
    awayGoals: input.awayGoals,
    savedAt: now,
    locked: false,
    points: null
  };

  await updatePredictionDocument(userId, document);
  return { status: "saved" as const, matchId: input.matchId };
}

export async function savePredictionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input = predictionSchema.parse({
    matchId: formData.get("matchId"),
    homeGoals: formData.get("homeGoals"),
    awayGoals: formData.get("awayGoals")
  });

  const result = await persistMatchPrediction(user.id, input);
  if (result.status === "missing") redirect("/palpites?error=Jogo nao encontrado.");
  if (result.status === "unpredictable") {
    redirect("/palpites?error=Esse confronto ainda nao esta liberado para palpite.");
  }
  if (result.status === "locked") redirect("/palpites?error=Esse jogo ja esta bloqueado.");
  if (result.status === "unchanged") redirect("/palpites?saved=1&unchanged=1");

  revalidatePath("/palpites");
  revalidatePath("/dashboard");
  revalidatePath("/comunidade");
  redirect("/palpites?saved=1");
}

export async function saveBulkPredictionsAction(
  _prev: BulkSaveResult,
  formData: FormData
): Promise<BulkSaveResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, saved: 0, unchanged: 0, skipped: 0, error: "Faca login para salvar." };
  }

  let parsedInput: z.infer<typeof bulkPredictionSchema>;
  try {
    const raw = formData.get("predictions");
    parsedInput = bulkPredictionSchema.parse({
      predictions: typeof raw === "string" ? JSON.parse(raw) : []
    });
  } catch {
    return {
      ok: false,
      saved: 0,
      unchanged: 0,
      skipped: 0,
      error: "Nenhum palpite valido para salvar."
    };
  }

  let saved = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const prediction of parsedInput.predictions) {
    const result = await persistMatchPrediction(user.id, prediction);
    if (result.status === "saved") saved += 1;
    else if (result.status === "unchanged") unchanged += 1;
    else skipped += 1;
  }

  if (saved > 0) {
    revalidatePath("/palpites");
    revalidatePath("/dashboard");
    revalidatePath("/comunidade");
  }

  return {
    ok: saved > 0 || unchanged > 0,
    saved,
    unchanged,
    skipped,
    error:
      saved === 0 && unchanged === 0
        ? "Nenhum palpite novo foi salvo. Confira se os jogos ainda estao abertos."
        : undefined
  };
}

export async function saveTopFourAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input = topFourSchema.parse({
    first: formData.get("first"),
    second: formData.get("second"),
    third: formData.get("third"),
    fourth: formData.get("fourth")
  });

  const values = [input.first, input.second, input.third, input.fourth];
  if (!ensureUnique(values)) {
    redirect("/top-4?error=Escolha quatro selecoes diferentes.");
  }

  const row = await getOrCreatePredictionDocument(user.id);
  const document = normalizePredictionDocument(row.predictions);
  if (document.topFour) {
    redirect("/top-4?error=Top 4 ja foi travado no primeiro envio e nao pode ser alterado.");
  }

  const now = new Date().toISOString();
  document.updatedAt = now;
  document.topFour = {
    ...input,
    savedAt: now,
    points: null
  };

  await updatePredictionDocument(user.id, document);
  revalidatePath("/top-4");
  revalidatePath("/dashboard");
  revalidatePath("/comunidade");
  redirect("/top-4?saved=1");
}
