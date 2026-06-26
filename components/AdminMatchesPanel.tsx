"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMatchAdminAction,
  syncWorldCupAdminAction,
  updateMatchAdminAction
} from "@/actions/admin.actions";
import { isSameAppDay } from "@/lib/date";
import { ADMIN_STAGE_OPTIONS, isKnockoutStage } from "@/lib/knockout-stages";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import { isMatchLive, MATCH_STATUS_OPTIONS } from "@/lib/match-status";
import type { Match, Team } from "@/types/domain";

type Filter = "all" | "live" | "today" | "knockout";

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function sortByKickoff(a: Match, b: Match) {
  return (
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
    a.external_id.localeCompare(b.external_id)
  );
}

export function AdminMatchesPanel({
  matches,
  teams
}: {
  matches: Match[];
  teams: Team[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [adminToken, setAdminToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStage, setCreateStage] = useState<string>("Oitavas");

  const filtered = useMemo(() => {
    const now = Date.now();
    const list = matches.filter((match) => {
      if (filter === "live") return isMatchLive(match);
      if (filter === "today") {
        const startsAt = new Date(match.starts_at);
        return !Number.isNaN(startsAt.getTime()) && isSameAppDay(startsAt, now);
      }
      if (filter === "knockout") return isKnockoutStage(match.stage);
      return true;
    });

    return list.sort(sortByKickoff);
  }, [filter, matches]);

  async function handleSync() {
    setMessage(null);
    setError(null);
    setSyncing(true);

    const formData = new FormData();
    formData.set("adminToken", adminToken);
    formData.set("recalculateRanking", "on");

    const result = await syncWorldCupAdminAction(formData);
    setSyncing(false);

    if (!result.ok) {
      setError(result.error ?? "Falha no sync.");
      return;
    }

    setMessage(result.message ?? "Sync concluido.");
    router.refresh();
  }

  async function handleCreate(form: HTMLFormElement) {
    setMessage(null);
    setError(null);
    setCreating(true);

    const formData = new FormData(form);
    formData.set("adminToken", adminToken);
    formData.set("stage", createStage);

    const result = await createMatchAdminAction(formData);
    setCreating(false);

    if (!result.ok) {
      setError(result.error ?? "Falha ao criar jogo.");
      return;
    }

    setMessage(result.message ?? "Jogo criado.");
    form.reset();
    router.refresh();
  }

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
          Pagina secreta. Use o token de <code>ADMIN_SYNC_TOKEN</code>.
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
        <div className="admin-matches__sync-row">
          <button
            className="button"
            disabled={syncing}
            onClick={() => void handleSync()}
            type="button"
          >
            {syncing ? "Sincronizando..." : "Sincronizar jogos agora"}
          </button>
          <span className="muted">
            Puxa times, jogos e grupos da API (com fallback GitHub).
          </span>
        </div>
      </section>

      <details className="card admin-matches__create">
        <summary>Inserir jogo manualmente</summary>
        <form
          className="admin-match-card"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate(event.currentTarget);
          }}
        >
          <div className="admin-match-card__grid">
            <div className="field">
              <label>ID do jogo</label>
              <input name="matchId" placeholder="ex: 89" required />
            </div>

            <div className="field">
              <label>Fase</label>
              <select
                name="stage"
                onChange={(event) => setCreateStage(event.target.value)}
                value={createStage}
              >
                {ADMIN_STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            {createStage === "Grupos" ? (
              <div className="field">
                <label>Grupo</label>
                <input name="groupName" placeholder="ex: Grupo A" />
              </div>
            ) : null}

            <div className="field">
              <label>Mandante</label>
              <select defaultValue="" name="homeTeamId">
                <option value="">A definir</option>
                {teams.map((team) => (
                  <option key={team.external_id} value={team.external_id}>
                    {team.name} ({team.external_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Visitante</label>
              <select defaultValue="" name="awayTeamId">
                <option value="">A definir</option>
                {teams.map((team) => (
                  <option key={team.external_id} value={team.external_id}>
                    {team.name} ({team.external_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select defaultValue="SCHEDULED" name="status">
                {MATCH_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Placar mandante</label>
              <input inputMode="numeric" min={0} name="scoreHome" type="number" />
            </div>

            <div className="field">
              <label>Placar visitante</label>
              <input inputMode="numeric" min={0} name="scoreAway" type="number" />
            </div>

            <div className="field">
              <label>Inicio (local)</label>
              <input name="startsAt" required type="datetime-local" />
            </div>
          </div>

          <label className="admin-match-card__recalc">
            <input defaultChecked name="recalculateRanking" type="checkbox" />
            Recalcular ranking apos criar
          </label>

          <button className="button" disabled={creating} type="submit">
            {creating ? "Criando..." : "Criar jogo"}
          </button>
        </form>
      </details>

      <section className="card">
        <div className="admin-matches__toolbar">
          <div className="admin-matches__filters">
            {(
              [
                ["knockout", "Mata-mata"],
                ["live", "Ao vivo"],
                ["today", "Hoje"],
                ["all", "Todos"]
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={`button secondary ${filter === value ? "active" : ""}`}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <span className="muted">{filtered.length} jogos</span>
        </div>

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="admin-matches__list">
          {filtered.length === 0 ? (
            <p className="muted">Nenhum jogo neste filtro.</p>
          ) : null}

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
                disabled={savingId === match.external_id}
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
