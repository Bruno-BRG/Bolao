"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateMatchAdminAction } from "@/actions/admin.actions";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import { isMatchLive, MATCH_STATUS_OPTIONS } from "@/lib/match-status";
import type { Match } from "@/types/domain";

type Filter = "all" | "live" | "today";

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminMatchesPanel({ matches }: { matches: Match[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("live");
  const [adminToken, setAdminToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    return matches.filter((match) => {
      if (filter === "live") return isMatchLive(match);
      if (filter === "today") {
        const startsAt = new Date(match.starts_at);
        return !Number.isNaN(startsAt.getTime()) && isSameLocalDay(startsAt, new Date(now));
      }
      return true;
    });
  }, [filter, matches]);

  async function handleSave(match: Match, form: HTMLFormElement) {
    setMessage(null);
    setError(null);
    setSavingId(match.external_id);

    const formData = new FormData(form);
    formData.set("adminToken", adminToken);
    formData.set("matchId", match.external_id);

    const result = await updateMatchAdminAction(formData);
    setSavingId(null);

    if (!result.ok) {
      setError(result.error ?? "Falha ao salvar.");
      return;
    }

    setMessage(result.message ?? "Jogo atualizado.");
    router.refresh();
  }

  return (
    <div className="admin-matches">
      <section className="card admin-matches__auth">
        <h2>Acesso admin</h2>
        <p className="muted">
          URL secreta — nao compartilhe. Use o mesmo token de{" "}
          <code>ADMIN_SYNC_TOKEN</code>.
        </p>
        <div className="field">
          <label htmlFor="adminToken">Token admin</label>
          <input
            id="adminToken"
            name="adminToken"
            onChange={(event) => setAdminToken(event.target.value)}
            type="password"
            value={adminToken}
          />
        </div>
      </section>

      <section className="card">
        <div className="admin-matches__toolbar">
          <div className="admin-matches__filters">
            {(["live", "today", "all"] as const).map((value) => (
              <button
                key={value}
                className={`button secondary ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value === "live" ? "Ao vivo" : value === "today" ? "Hoje" : "Todos"}
              </button>
            ))}
          </div>
          <span className="muted">{filtered.length} jogos</span>
        </div>

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="admin-matches__list">
          {filtered.map((match) => (
            <form
              key={match.external_id}
              className="admin-match-card"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave(match, event.currentTarget);
              }}
            >
              <header className="admin-match-card__head">
                <div>
                  <strong>
                    #{match.external_id} — {getMatchTeamLabel(match, "home")} x{" "}
                    {getMatchTeamLabel(match, "away")}
                  </strong>
                  <p className="muted">
                    {match.stage ?? "Jogo"}
                    {match.group_name ? ` · ${match.group_name}` : ""}
                  </p>
                </div>
                {isMatchLive(match) ? <span className="badge live">Ao vivo</span> : null}
              </header>

              <div className="admin-match-card__grid">
                <div className="field">
                  <label>Status</label>
                  <select defaultValue={match.status} name="status">
                    {MATCH_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Placar mandante</label>
                  <input
                    defaultValue={match.score_home ?? ""}
                    inputMode="numeric"
                    min={0}
                    name="scoreHome"
                    type="number"
                  />
                </div>

                <div className="field">
                  <label>Placar visitante</label>
                  <input
                    defaultValue={match.score_away ?? ""}
                    inputMode="numeric"
                    min={0}
                    name="scoreAway"
                    type="number"
                  />
                </div>

                <div className="field">
                  <label>Inicio (local)</label>
                  <input
                    defaultValue={toDatetimeLocalValue(match.starts_at)}
                    name="startsAt"
                    type="datetime-local"
                  />
                </div>
              </div>

              <label className="admin-match-card__recalc">
                <input defaultChecked name="recalculateRanking" type="checkbox" />
                Recalcular ranking apos salvar
              </label>

              <button
                className="button"
                disabled={!adminToken || savingId === match.external_id}
                type="submit"
              >
                {savingId === match.external_id ? "Salvando..." : "Salvar jogo"}
              </button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
