"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isBracketLocked } from "@/lib/bracket-scoring";
import { getOrCreatePredictionDocument, updatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches } from "@/repositories/worldcup.repo";
import { getCurrentUser } from "@/services/auth.service";
import { normalizePredictionDocument } from "@/services/prediction-document";
import type { BracketPrediction } from "@/types/domain";

const slotSchema = z.object({
  slot: z.string().min(1),
  teamId: z.string().min(1)
});

const bracketSchema = z.object({
  quarterFinals: z.array(slotSchema),
  semiFinals: z.array(slotSchema),
  final: z.array(slotSchema),
  championTeamId: z.string().min(1),
  runnerUpTeamId: z.string().min(1),
  thirdPlaceTeamId: z.string().min(1),
  fourthPlaceTeamId: z.string().min(1)
});

export type BracketSaveResult = {
  ok: boolean;
  error?: string;
};

export async function saveBracketPredictionAction(
  input: z.infer<typeof bracketSchema>
): Promise<BracketSaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Faca login para salvar." };

  const matches = await listMatches({ refreshIfStale: false });
  if (isBracketLocked(matches)) {
    return { ok: false, error: "Chaveamento bloqueado: o mata-mata ja comecou." };
  }

  try {
    const parsed = bracketSchema.parse(input);
    const top4Teams = [
      parsed.championTeamId,
      parsed.runnerUpTeamId,
      parsed.thirdPlaceTeamId,
      parsed.fourthPlaceTeamId
    ];
    if (new Set(top4Teams).size !== 4) {
      return { ok: false, error: "O Top 4 precisa ter quatro selecoes diferentes." };
    }

    const row = await getOrCreatePredictionDocument(user.id);
    const document = normalizePredictionDocument(row.predictions);
    const now = new Date().toISOString();

    const bracket: BracketPrediction = {
      quarterFinals: parsed.quarterFinals,
      semiFinals: parsed.semiFinals,
      final: parsed.final,
      championTeamId: parsed.championTeamId,
      runnerUpTeamId: parsed.runnerUpTeamId,
      top4: [
        { position: 1, teamId: parsed.championTeamId },
        { position: 2, teamId: parsed.runnerUpTeamId },
        { position: 3, teamId: parsed.thirdPlaceTeamId },
        { position: 4, teamId: parsed.fourthPlaceTeamId }
      ],
      savedAt: now,
      locked: false,
      points: null
    };

    document.updatedAt = now;
    document.bracket = bracket;
    await updatePredictionDocument(user.id, document);

    revalidatePath("/chaveamento");
    revalidatePath("/ranking");
    return { ok: true };
  } catch {
    return { ok: false, error: "Chaveamento invalido." };
  }
}
