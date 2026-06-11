import type { LiveMatch } from "@/services/worldcup-live.service";

export const MAIN_BRACKET_STAGES = [
  "32 avos",
  "Oitavas",
  "Quartas",
  "Semifinal",
  "Final"
] as const;

export const PLACEMENT_STAGE = "Terceiro lugar";

export type BracketLayoutConfig = {
  nodeWidth: number;
  nodeHeight: number;
  columnGap: number;
  baseRowGap: number;
  padding: number;
};

export type BracketLayoutNode = {
  match: LiveMatch;
  x: number;
  y: number;
  stage: string;
  column: number;
  row: number;
};

export type BracketLayoutEdge = {
  d: string;
  tone: string;
};

export type BracketLayout = {
  nodes: BracketLayoutNode[];
  edges: BracketLayoutEdge[];
  width: number;
  height: number;
};

const DEFAULT_CONFIG: BracketLayoutConfig = {
  nodeWidth: 148,
  nodeHeight: 44,
  columnGap: 36,
  baseRowGap: 48,
  padding: 24
};

function sortMatches(matches: LiveMatch[]) {
  return [...matches].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

function connectorTone(match: LiveMatch) {
  if (match.status === "LIVE") return "rgba(46, 194, 126, 0.5)";
  return "rgba(151, 166, 186, 0.22)";
}

function columnWidth(config: BracketLayoutConfig) {
  return config.nodeWidth + config.columnGap;
}

export function buildBracketLayout(
  matches: LiveMatch[],
  config: Partial<BracketLayoutConfig> = {}
): BracketLayout {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  const byStage = new Map<string, LiveMatch[]>();

  for (const match of matches) {
    const stage = match.stage ?? "Outros";
    const bucket = byStage.get(stage) ?? [];
    bucket.push(match);
    byStage.set(stage, bucket);
  }

  const nodes: BracketLayoutNode[] = [];
  const edges: BracketLayoutEdge[] = [];
  const colW = columnWidth(resolved);

  let seedCount = 0;
  for (const stage of MAIN_BRACKET_STAGES) {
    const count = byStage.get(stage)?.length ?? 0;
    if (count > 0) {
      seedCount = count;
      break;
    }
  }
  if (seedCount === 0) seedCount = 1;

  const treeHeight =
    seedCount * resolved.baseRowGap * Math.pow(2, MAIN_BRACKET_STAGES.length - 1) +
    resolved.nodeHeight;

  MAIN_BRACKET_STAGES.forEach((stage, column) => {
    const stageMatches = sortMatches(byStage.get(stage) ?? []);
    const span = resolved.baseRowGap * Math.pow(2, column);

    stageMatches.forEach((match, row) => {
      const x = resolved.padding + column * colW;
      const y =
        resolved.padding + row * span * 2 + span / 2 - resolved.nodeHeight / 2;

      nodes.push({ match, x, y, stage, column, row });

      if (column === 0) return;

      const prevMatches = sortMatches(
        byStage.get(MAIN_BRACKET_STAGES[column - 1]) ?? []
      );
      const childTop = prevMatches[row * 2];
      const childBottom = prevMatches[row * 2 + 1];
      if (!childTop || !childBottom) return;

      const topNode = nodes.find((node) => node.match.external_id === childTop.external_id);
      const bottomNode = nodes.find(
        (node) => node.match.external_id === childBottom.external_id
      );
      if (!topNode || !bottomNode) return;

      const fork = x - resolved.columnGap / 2;
      const right = topNode.x + resolved.nodeWidth;
      const topY = topNode.y + resolved.nodeHeight / 2;
      const bottomY = bottomNode.y + resolved.nodeHeight / 2;
      const parentY = y + resolved.nodeHeight / 2;

      edges.push({
        d: `M ${right} ${topY} H ${fork} V ${parentY} H ${x} M ${right} ${bottomY} H ${fork}`,
        tone: connectorTone(match)
      });
    });
  });

  const placementMatches = sortMatches(byStage.get(PLACEMENT_STAGE) ?? []);
  if (placementMatches[0]) {
    const match = placementMatches[0];
    const finalColumn = MAIN_BRACKET_STAGES.length - 1;
    const x = resolved.padding + finalColumn * colW;
    const y = resolved.padding + treeHeight + resolved.baseRowGap * 0.35;

    nodes.push({
      match,
      x,
      y,
      stage: PLACEMENT_STAGE,
      column: finalColumn,
      row: 0
    });

    const semiMatches = sortMatches(
      byStage.get("Semifinal") ?? []
    );
    if (semiMatches.length > 0) {
      const semiNodes = nodes.filter((node) => node.stage === "Semifinal");
      const anchor = semiNodes[semiNodes.length - 1];
      if (anchor) {
        const fork = x - resolved.columnGap / 2;
        const right = anchor.x + resolved.nodeWidth;
        const anchorY = anchor.y + resolved.nodeHeight / 2;
        const placementY = y + resolved.nodeHeight / 2;

        edges.push({
          d: `M ${right} ${anchorY} H ${fork} V ${placementY} H ${x}`,
          tone: connectorTone(match)
        });
      }
    }
  }

  const maxX = Math.max(
    resolved.padding,
    ...nodes.map((node) => node.x + resolved.nodeWidth)
  );
  const maxY = Math.max(
    resolved.padding + treeHeight,
    ...nodes.map((node) => node.y + resolved.nodeHeight)
  );

  return {
    nodes,
    edges,
    width: maxX + resolved.padding,
    height: maxY + resolved.padding
  };
}
