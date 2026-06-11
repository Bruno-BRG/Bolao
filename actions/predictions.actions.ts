"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCKED_STATUSES } from "@/lib/constants";
import { getOrCreatePredictionDocument, updatePredictionDocument } from "@/repositories/predictions.repo";
import { findMatch } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeGoals: z.coerce.number().int().min(0).max(30),
  awayGoals: z.coerce.number().int().min(0).max(30)
});

const topFourSchema = z.object({
  first: z.string().min(1),
  second: z.string().min(1),
  third: z.string().min(1),
  fourth: z.string().min(1)
});

function ensureUnique(values: string[]) {
  return new Set(values).size === values.length;
}

export async function savePredictionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const input = predictionSchema.parse({
    matchId: formData.get("matchId"),
    homeGoals: formData.get("homeGoals"),
    awayGoals: formData.get("awayGoals")
  });

  const match = await findMatch(input.matchId);
  if (!match) redirect("/palpites?error=Jogo nao encontrado.");

  const startsAt = new Date(match.starts_at).getTime();
  const locked =
    startsAt <= Date.now() || LOCKED_STATUSES.has(match.status.toUpperCase());
  if (locked) redirect("/palpites?error=Esse jogo ja esta bloqueado.");

  const row = await getOrCreatePredictionDocument(user.id);
  const document = normalizePredictionDocument(row.predictions);
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

  await updatePredictionDocument(user.id, document);
  revalidatePath("/palpites");
  revalidatePath("/dashboard");
  redirect("/palpites?saved=1");
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
  redirect("/top-4?saved=1");
}
