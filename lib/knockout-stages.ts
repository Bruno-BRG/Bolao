export const KNOCKOUT_STAGES = [
  "32 avos",
  "Oitavas",
  "Quartas",
  "Semifinal",
  "Terceiro lugar",
  "Final"
] as const;

export type KnockoutStage = (typeof KNOCKOUT_STAGES)[number];

export const ADMIN_STAGE_OPTIONS = ["Grupos", ...KNOCKOUT_STAGES] as const;

export function isKnockoutStage(stage: string | null | undefined) {
  if (!stage) return false;
  return (KNOCKOUT_STAGES as readonly string[]).includes(stage);
}
