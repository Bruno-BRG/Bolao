export type DecisionMethod = "REGULAR" | "EXTRA_TIME" | "PENALTIES";

export const DECISION_METHOD_OPTIONS: DecisionMethod[] = [
  "REGULAR",
  "EXTRA_TIME",
  "PENALTIES"
];

export const DECISION_METHOD_LABELS: Record<DecisionMethod, string> = {
  REGULAR: "Tempo normal",
  EXTRA_TIME: "Prorrogacao",
  PENALTIES: "Penaltis"
};

export function isDecisionMethod(value: unknown): value is DecisionMethod {
  return (
    value === "REGULAR" || value === "EXTRA_TIME" || value === "PENALTIES"
  );
}
