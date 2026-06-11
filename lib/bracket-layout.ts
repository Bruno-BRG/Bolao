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
  matchGap: number;
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
  config: BracketLayoutConfig;
};

export const BRACKET_LAYOUT_CONFIG: BracketLayoutConfig = {
  nodeWidth: 196,
  nodeHeight: 78,
  columnGap: 44,
  matchGap: 10,
  padding: 16
};

function sortMatches(matches: LiveMatch[]) {
  return [...matches].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

function connectorTone(match: LiveMatch) {
  if (match.status === "LIVE") return "rgba(46, 194, 126, 0.55)";
  return "rgba(151, 166, 186, 0.28)";
}

function columnWidth(config: BracketLayoutConfig) {
  return config.nodeWidth + config.columnGap;
}

function buildConnectorPath(
  childTop: BracketLayoutNode,
  childBottom: BracketLayoutNode,
  parent: BracketLayoutNode,
  config: BracketLayoutConfig
) {
  const fork = parent.x - config.columnGap / 2;
  const right = childTop.x + config.nodeWidth;
  const topY = childTop.y + config.nodeHeight / 2;
  const bottomY = childBottom.y + config.nodeHeight / 2;
  const parentY = parent.y + config.nodeHeight / 2;

  return `M ${right} ${topY} H ${fork} V ${parentY} H ${parent.x} M ${right} ${bottomY} H ${fork}`;
}

export function buildBracketLayout(
  matches: LiveMatch[],
  partialConfig: Partial<BracketLayoutConfig> = {}
): BracketLayout {
  const config = { ...BRACKET_LAYOUT_CONFIG, ...partialConfig };
  const byStage = new Map<string, LiveMatch[]>();

  for (const match of matches) {
    const stage = match.stage ?? "Outros";
    const bucket = byStage.get(stage) ?? [];
    bucket.push(match);
    byStage.set(stage, bucket);
  }

  const nodes: BracketLayoutNode[] = [];
  const edges: BracketLayoutEdge[] = [];
  const colW = columnWidth(config);
  const slot = config.nodeHeight + config.matchGap;

  let firstColumn = -1;
  for (let column = 0; column < MAIN_BRACKET_STAGES.length; column += 1) {
    if ((byStage.get(MAIN_BRACKET_STAGES[column])?.length ?? 0) > 0) {
      firstColumn = column;
      break;
    }
  }

  if (firstColumn === -1) {
    return {
      nodes,
      edges,
      width: config.padding * 2,
      height: config.padding * 2,
      config
    };
  }

  const yByMatchId = new Map<string, number>();

  function findPreviousStageMatches(column: number) {
    for (let index = column - 1; index >= 0; index -= 1) {
      const stage = MAIN_BRACKET_STAGES[index];
      const matches = sortMatches(byStage.get(stage) ?? []);
      if (matches.length > 0) return { matches, column: index };
    }
    return null;
  }

  function resolveChildMatches(
    row: number,
    column: number,
    previous: { matches: LiveMatch[]; column: number }
  ) {
    if (previous.column === firstColumn) {
      const depth = column - firstColumn;
      const block = Math.pow(2, depth + 1);
      const topIndex = row * block;
      const bottomIndex = row * block + Math.pow(2, depth) - 1;
      return {
        childTop: previous.matches[topIndex],
        childBottom: previous.matches[bottomIndex]
      };
    }

    return {
      childTop: previous.matches[row * 2],
      childBottom: previous.matches[row * 2 + 1]
    };
  }

  MAIN_BRACKET_STAGES.forEach((stage, column) => {
    const stageMatches = sortMatches(byStage.get(stage) ?? []);
    if (stageMatches.length === 0) return;

    const x = config.padding + column * colW;

    if (column === firstColumn) {
      stageMatches.forEach((match, row) => {
        const y = config.padding + row * slot;
        yByMatchId.set(match.external_id, y);
        nodes.push({ match, x, y, stage, column, row });
      });
      return;
    }

    const previous = findPreviousStageMatches(column);
    if (!previous) return;

    stageMatches.forEach((match, row) => {
      const { childTop, childBottom } = resolveChildMatches(row, column, previous);
      let y = config.padding + row * slot;

      if (childTop && childBottom) {
        const topY = yByMatchId.get(childTop.external_id);
        const bottomY = yByMatchId.get(childBottom.external_id);
        if (topY !== undefined && bottomY !== undefined) {
          y = (topY + bottomY) / 2;
        }
      } else if (childTop) {
        const topY = yByMatchId.get(childTop.external_id);
        if (topY !== undefined) y = topY;
      }

      yByMatchId.set(match.external_id, y);
      nodes.push({ match, x, y, stage, column, row });

      if (!childTop || !childBottom) return;

      const topNode = nodes.find((node) => node.match.external_id === childTop.external_id);
      const bottomNode = nodes.find(
        (node) => node.match.external_id === childBottom.external_id
      );
      const parentNode = nodes[nodes.length - 1];
      if (!topNode || !bottomNode) return;

      edges.push({
        d: buildConnectorPath(topNode, bottomNode, parentNode, config),
        tone: connectorTone(match)
      });
    });
  });

  const placementMatches = sortMatches(byStage.get(PLACEMENT_STAGE) ?? []);
  if (placementMatches[0]) {
    const match = placementMatches[0];
    const finalColumn = MAIN_BRACKET_STAGES.length - 1;
    const finalMatches = sortMatches(byStage.get("Final") ?? []);
    const semiMatches = sortMatches(byStage.get("Semifinal") ?? []);
    const x = config.padding + finalColumn * colW;

    let y = config.padding;
    if (finalMatches[0]) {
      const finalY = yByMatchId.get(finalMatches[0].external_id);
      if (finalY !== undefined) {
        y = finalY + config.nodeHeight + config.matchGap * 3;
      }
    } else if (semiMatches.length > 0) {
      const lastSemi = semiMatches[semiMatches.length - 1];
      const semiY = yByMatchId.get(lastSemi.external_id);
      if (semiY !== undefined) y = semiY + slot;
    }

    yByMatchId.set(match.external_id, y);
    nodes.push({
      match,
      x,
      y,
      stage: PLACEMENT_STAGE,
      column: finalColumn,
      row: 0
    });
  }

  const maxX = Math.max(
    config.padding,
    ...nodes.map((node) => node.x + config.nodeWidth)
  );
  const maxY = Math.max(
    config.padding,
    ...nodes.map((node) => node.y + config.nodeHeight)
  );

  return {
    nodes,
    edges,
    width: maxX + config.padding,
    height: maxY + config.padding,
    config
  };
}
