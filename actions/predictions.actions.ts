"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isMatchPredictable } from "@/lib/match-visibility";
import { isMatchLockedForPrediction } from "@/lib/match-lock";
import { isKnockoutMatch } from "@/lib/match-knockout";
import {
  normalizeKnockoutPrediction,
  resolveKnockoutPredictionFields,
  validateKnockoutPrediction
} from "@/lib/knockout-prediction-validation";
import { isDecisionMethod } from "@/lib/decision-method";
import {
  getOrCreatePredictionDocument,
  mutatePredictionDocument,
  updatePredictionDocument
} from "@/repositories/predictions.repo";
import { findMatch } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";
import type { DecisionMethod } from "@/lib/decision-method";
import type { Match, MatchPrediction } from "@/types/domain";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeGoals: z.coerce.number().int().min(0).max(30),
  awayGoals: z.coerce.number().int().min(0).max(30),
  predictedWinnerTeamId: z.string().nullable().optional(),
  predictedDecidedBy: z.string().nullable().optional()
});

const bulkPredictionSchema = z.object({
  predictions: z
    .array(
      z.object({
        matchId: z.string().min(1),
        homeGoals: z.number().int().min(0).max(30),
        awayGoals: z.number().int().min(0).max(30),
        predictedWinnerTeamId: z.string().nullable().optional(),
        predictedDecidedBy: z.string().nullable().optional()
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

export type MatchSaveResult = {
  ok: boolean;
  unchanged?: boolean;
  error?: string;
};

type PreparedMatchPrediction =
  | {
      ok: true;
      matchId: string;
      match: Match;
      entry: MatchPrediction;
      knockout: boolean;
    }
  | {
      ok: false;
      status: "missing" | "unpredictable" | "locked" | "invalid";
      error?: string;
    };

function ensureUnique(values: string[]) {
  return new Set(values).size === values.length;
}

function isMatchLocked(match: Awaited<ReturnType<typeof findMatch>>) {
  if (!match) return true;
  return isMatchLockedForPrediction(match);
}

function predictionsEqual(
  existing: MatchPrediction | undefined,
  next: MatchPrediction
) {
  if (!existing) return false;
  return (
    existing.homeGoals === next.homeGoals &&
    existing.awayGoals === next.awayGoals &&
    (existing.predictedWinnerTeamId ?? null) === (next.predictedWinnerTeamId ?? null) &&
    (existing.predictedDecidedBy ?? null) === (next.predictedDecidedBy ?? null)
  );
}

async function prepareMatchPrediction(
  input: z.infer<typeof predictionSchema>
): Promise<PreparedMatchPrediction> {
  const match = await findMatch(input.matchId);
  if (!match) return { ok: false, status: "missing" };
  if (!isMatchPredictable(match)) return { ok: false, status: "unpredictable" };
  if (isMatchLocked(match)) return { ok: false, status: "locked" };

  const knockout = isKnockoutMatch(match);
  let predictedWinnerTeamId = input.predictedWinnerTeamId ?? null;
  let predictedDecidedBy = isDecisionMethod(input.predictedDecidedBy)
    ? input.predictedDecidedBy
    : null;

  if (knockout) {
    if (!match.home_team_id || !match.away_team_id) {
      return { ok: false, status: "unpredictable" };
    }

    const resolved = resolveKnockoutPredictionFields({
      homeGoals: input.homeGoals,
      awayGoals: input.awayGoals,
      predictedWinnerTeamId,
      predictedDecidedBy,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id
    });
    predictedWinnerTeamId = resolved.predictedWinnerTeamId;
    predictedDecidedBy = resolved.predictedDecidedBy;

    const validationError = validateKnockoutPrediction({
      homeGoals: input.homeGoals,
      awayGoals: input.awayGoals,
      predictedWinnerTeamId,
      predictedDecidedBy,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id
    });

    if (validationError) {
      return { ok: false, status: "invalid", error: validationError };
    }

    const normalized = normalizeKnockoutPrediction({
      homeGoals: input.homeGoals,
      awayGoals: input.awayGoals,
      predictedWinnerTeamId,
      predictedDecidedBy,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id
    });
    predictedWinnerTeamId = normalized.predictedWinnerTeamId;
    predictedDecidedBy = normalized.predictedDecidedBy;
  }

  const now = new Date().toISOString();
  const entry: MatchPrediction = {
    homeTeamId: match.home_team_id,
    awayTeamId: match.away_team_id,
    homeGoals: input.homeGoals,
    awayGoals: input.awayGoals,
    predictedWinnerTeamId: knockout ? predictedWinnerTeamId : undefined,
    predictedDecidedBy: knockout ? predictedDecidedBy : undefined,
    savedAt: now,
    locked: false,
    points: null
  };

  return {
    ok: true,
    matchId: input.matchId,
    match,
    entry,
    knockout
  };
}

async function persistMatchPrediction(
  userId: string,
  input: z.infer<typeof predictionSchema>
): Promise<
  | { status: "saved"; matchId: string }
  | { status: "unchanged" }
  | { status: "missing" }
  | { status: "unpredictable" }
  | { status: "locked" }
  | { status: "invalid"; error?: string }
> {
  const prepared = await prepareMatchPrediction(input);
  if (!prepared.ok) return prepared;

  let result: { status: "saved"; matchId: string } | { status: "unchanged" } = {
    status: "unchanged"
  };

  await mutatePredictionDocument(userId, (document) => {
    const existing = document.matches[prepared.matchId];
    if (predictionsEqual(existing, prepared.entry)) {
      return false;
    }

    document.updatedAt = prepared.entry.savedAt;
    document.matches[prepared.matchId] = prepared.entry;
    result = { status: "saved", matchId: prepared.matchId };
    return true;
  });

  return result;
}

async function persistMatchPredictionsBatch(
  userId: string,
  inputs: z.infer<typeof bulkPredictionSchema>["predictions"]
) {
  const prepared = await Promise.all(inputs.map((input) => prepareMatchPrediction(input)));

  let saved = 0;
  let unchanged = 0;
  let skipped = 0;

  const toApply = prepared.filter((item): item is Extract<PreparedMatchPrediction, { ok: true }> => {
    if (!item.ok) {
      skipped += 1;
      return false;
    }
    return true;
  });

  if (toApply.length === 0) {
    return { saved, unchanged, skipped };
  }

  await mutatePredictionDocument(userId, (document) => {
    let changed = false;
    const now = new Date().toISOString();

    for (const item of toApply) {
      const existing = document.matches[item.matchId];
      if (predictionsEqual(existing, item.entry)) {
        unchanged += 1;
        continue;
      }

      document.matches[item.matchId] = item.entry;
      changed = true;
      saved += 1;
    }

    if (changed) {
      document.updatedAt = now;
    }

    return changed;
  });

  return { saved, unchanged, skipped };
}

export async function saveMatchPredictionAction(input: {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId?: string | null;
  predictedDecidedBy?: DecisionMethod | null;
}): Promise<MatchSaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Faca login para salvar." };

  try {
    const parsed = predictionSchema.parse(input);
    const result = await persistMatchPrediction(user.id, parsed);

    if (result.status === "saved") {
      revalidatePath("/palpites");
      revalidatePath("/comunidade");
      revalidateTag("predictions");
      return { ok: true };
    }

    if (result.status === "unchanged") return { ok: true, unchanged: true };
    if (result.status === "invalid") {
      return { ok: false, error: result.error ?? "Palpite invalido." };
    }
    if (result.status === "locked") {
      return { ok: false, error: "Palpite bloqueado: o jogo ja comecou." };
    }
    if (result.status === "unpredictable") {
      return { ok: false, error: "Confronto ainda nao liberado." };
    }

    return { ok: false, error: "Jogo nao encontrado." };
  } catch {
    return { ok: false, error: "Placar invalido." };
  }
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
  revalidateTag("predictions");
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

  const { saved, unchanged, skipped } = await persistMatchPredictionsBatch(
    user.id,
    parsedInput.predictions
  );

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
  revalidateTag("predictions");
  redirect("/top-4?saved=1");
}
