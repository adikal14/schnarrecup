"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentTurn } from "@/lib/draft";
import type {
  Draft,
  DraftPick,
  DraftTurn,
  Player,
  Team,
  Tournament,
} from "@/lib/types";

export default function DraftRoomPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [turns, setTurns] = useState<DraftTurn[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingPlayerId, setSubmittingPlayerId] = useState<string | null>(
    null
  );

  async function loadAll() {
    const [tRes, teamsRes, playersRes, draftRes] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single<Tournament>(),
      supabase.from("teams").select("*").eq("tournament_id", id).returns<Team[]>(),
      supabase.from("players").select("*").eq("active", true).returns<Player[]>(),
      supabase.from("drafts").select("*").eq("tournament_id", id).single<Draft>(),
    ]);

    setTournament(tRes.data);
    setTeams(teamsRes.data ?? []);
    setPlayers(playersRes.data ?? []);
    setDraft(draftRes.data);

    if (draftRes.data) {
      const [turnsRes, picksRes] = await Promise.all([
        supabase
          .from("draft_turns")
          .select("*")
          .eq("draft_id", draftRes.data.id)
          .order("turn_number", { ascending: true })
          .returns<DraftTurn[]>(),
        supabase
          .from("draft_picks")
          .select("*")
          .eq("draft_id", draftRes.data.id)
          .returns<DraftPick[]>(),
      ]);
      setTurns(turnsRes.data ?? []);
      setPicks(picksRes.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live updates: whenever anyone (either captain's browser) inserts or
  // deletes a pick, everyone's view refreshes automatically.
  useEffect(() => {
    if (!draft) return;
    const channel = supabase
      .channel(`draft-${draft.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draft_picks",
          filter: `draft_id=eq.${draft.id}`,
        },
        () => loadAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  const currentTurn = useMemo(
    () => getCurrentTurn(turns, picks),
    [turns, picks]
  );

  const draftedPlayerIds = useMemo(
    () => new Set(picks.filter((p) => p.status === "active").map((p) => p.player_id)),
    [picks]
  );

  const availablePlayers = useMemo(
    () =>
      players
        .filter((p) => !draftedPlayerIds.has(p.id) && !teams.some((t) => t.captain_player_id === p.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players, draftedPlayerIds, teams]
  );

  const currentTeam = currentTurn
    ? teams.find((t) => t.captain_player_id === currentTurn.captain_id)
    : null;

  const picksMadeThisTurn = currentTurn
    ? picks.filter(
        (p) => p.turn_number === currentTurn.turn_number && p.status === "active"
      ).length
    : 0;

  async function makePick(playerId: string) {
    if (!draft || !currentTurn || !currentTeam) return;
    setSubmittingPlayerId(playerId);
    setError(null);

    const { error } = await supabase.from("draft_picks").insert({
      draft_id: draft.id,
      turn_number: currentTurn.turn_number,
      team_id: currentTeam.id,
      player_id: playerId,
      pick_order: picks.filter((p) => p.status === "active").length + 1,
    });

    if (error) {
      setError(error.message);
    } else {
      const isLastTurn = currentTurn.turn_number === turns[turns.length - 1]?.turn_number;
      const willCompleteTurn = picksMadeThisTurn + 1 >= currentTurn.picks_required;
      if (isLastTurn && willCompleteTurn) {
        await supabase.from("drafts").update({ status: "completed" }).eq("id", draft.id);
        await supabase
          .from("tournaments")
          .update({ status: "in_progress" })
          .eq("id", tournament!.id);
      }
    }
    setSubmittingPlayerId(null);
  }

  async function undoLastPick() {
    if (!draft) return;
    const activePicks = picks.filter((p) => p.status === "active");
    if (activePicks.length === 0) return;
    const last = activePicks.reduce((latest, p) =>
      p.pick_order > latest.pick_order ? p : latest
    );
    setError(null);
    const { error } = await supabase.from("draft_picks").delete().eq("id", last.id);
    if (error) setError(error.message);
  }

  if (loading) return <p className="text-turf-700">Loading draft…</p>;
  if (!draft || !tournament) {
    return (
      <div className="scorecard p-8 text-center text-turf-700">
        No draft has been started for this tournament yet.
      </div>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const isComplete = draft.status === "completed" || !currentTurn;

  return (
    <div className="space-y-8">
      <div>
        <p className="stamp text-turf-500 mb-2">{tournament.name}</p>
        <h1 className="font-display text-3xl font-700 text-turf-950">
          Draft room
        </h1>
      </div>

      {isComplete ? (
        <div className="scorecard p-8 text-center">
          <p className="font-display text-xl text-turf-950 mb-2">
            Draft complete
          </p>
          <a
            href={`/tournaments/${tournament.id}`}
            className="stamp text-flag hover:underline"
          >
            View tournament & rosters →
          </a>
        </div>
      ) : (
        <div className="scorecard p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="stamp text-turf-500 mb-1">On the clock</p>
            <p className="font-display text-2xl text-turf-950">
              {currentTeam?.team_name}
            </p>
            <p className="text-turf-700 text-sm mt-1">
              Pick {picksMadeThisTurn + 1} of {currentTurn?.picks_required} this
              turn · Turn {currentTurn?.turn_number} of {turns.length}
            </p>
          </div>
          {picks.filter((p) => p.status === "active").length > 0 && (
            <button
              onClick={undoLastPick}
              className="stamp text-turf-700 border border-turf-700/40 rounded-full px-4 py-1.5 hover:border-flag hover:text-flag transition-colors"
            >
              Undo last pick
            </button>
          )}
        </div>
      )}

      {error && <p className="text-flag text-sm">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2">
          <h2 className="stamp text-turf-500 mb-3">
            Available players ({availablePlayers.length})
          </h2>
          <div className="scorecard divide-y divide-turf-900/10 max-h-[520px] overflow-y-auto">
            {availablePlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-turf-500">
                    {p.hometown ?? "—"}
                    {p.handicap != null ? ` · ${p.handicap} hcp` : ""}
                  </p>
                </div>
                <button
                  disabled={isComplete || submittingPlayerId === p.id}
                  onClick={() => makePick(p.id)}
                  className="stamp bg-turf-900 text-parchment-100 px-3 py-1.5 rounded hover:bg-turf-700 transition-colors disabled:opacity-40"
                >
                  {submittingPlayerId === p.id ? "Picking…" : "Draft"}
                </button>
              </div>
            ))}
            {availablePlayers.length === 0 && (
              <p className="px-4 py-6 text-turf-700 text-sm">
                Every eligible player has been drafted.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {teams.map((team) => {
            const roster = picks
              .filter((p) => p.team_id === team.id && p.status === "active")
              .sort((a, b) => a.pick_order - b.pick_order);
            return (
              <div key={team.id} className="scorecard p-4">
                <h3 className="font-display text-lg text-turf-950">
                  {team.team_name}
                </h3>
                <p className="stamp text-turf-500 mb-2">
                  Captain: {playerById.get(team.captain_player_id)?.name}
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  {roster.map((r) => (
                    <li key={r.id}>{playerById.get(r.player_id)?.name}</li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
