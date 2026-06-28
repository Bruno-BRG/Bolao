"use client";

import { useEffect, useState } from "react";
import { RankingTable } from "@/components/RankingTable";
import type { RankingView } from "@/lib/ranking-views";
import type { RankingRow } from "@/types/domain";

const RANKING_POLL_MS = Number(process.env.NEXT_PUBLIC_RANKING_POLL_MS ?? "45000");

const VIEWS: { id: RankingView; label: string; hint: string }[] = [
  {
    id: "geral",
    label: "Geral",
    hint: "Todos os pontos do bolao"
  },
  {
    id: "eliminatorias",
    label: "Eliminatorias",
    hint: "Jogos do mata-mata + chaveamento"
  }
];

export function RankingLiveBoard({ initialRows }: { initialRows: RankingRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [view, setView] = useState<RankingView>("geral");

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    let active = true;

    async function refreshRanking() {
      try {
        const response = await fetch("/api/ranking", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { ranking?: RankingRow[] };
        if (active && Array.isArray(payload.ranking)) {
          setRows(payload.ranking);
        }
      } catch {
        // Keep the last good snapshot on transient failures.
      }
    }

    void refreshRanking();

    const timer = setInterval(() => {
      void refreshRanking();
    }, RANKING_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const activeView = VIEWS.find((entry) => entry.id === view) ?? VIEWS[0];

  return (
    <div className="ranking-board">
      <div className="ranking-tabs" role="tablist" aria-label="Tipo de ranking">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            aria-selected={view === entry.id}
            className={`ranking-tab${view === entry.id ? " ranking-tab--active" : ""}`}
            onClick={() => setView(entry.id)}
            role="tab"
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p className="muted ranking-board__hint">{activeView.hint}</p>

      <RankingTable rows={rows} view={view} />
    </div>
  );
}
