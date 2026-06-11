"use client";

import { useEffect, useState } from "react";
import { RankingTable } from "@/components/RankingTable";
import type { RankingRow } from "@/types/domain";

const RANKING_POLL_MS = Number(process.env.NEXT_PUBLIC_RANKING_POLL_MS ?? "45000");

export function RankingLiveBoard({ initialRows }: { initialRows: RankingRow[] }) {
  const [rows, setRows] = useState(initialRows);

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

    const timer = setInterval(() => {
      void refreshRanking();
    }, RANKING_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return <RankingTable rows={rows} />;
}
