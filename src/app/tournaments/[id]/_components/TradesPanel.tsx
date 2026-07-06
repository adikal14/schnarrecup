"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentTeamId } from "@/lib/draft";
import type { DraftPick, Player, Team, Trade } from "@/lib/types";

export default function TradesPanel({
  tournamentId,
  teams,
  players,
  picks,
  trades,
}: {
  tournamentId: string;
  teams: Team[];
  players: Player[];
  picks: DraftPick[];
  trades: Trade[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [playerId, setPlayerId] = useState("");
  const [toTeamId, setToTeamId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftedPlayers = players.filter((p) =>
    getCurrentTeamId(p.id, picks, trades)
  );

  async function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fromTeamId = getCurrentTeamId(playerId, picks, trades);
    if (!fromTeamId) {
      setError("Choose a drafted player.");
      return;
    }
    if (!toTeamId || toTeamId === fromTeamId) {
      setError("Choose a different destination team.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("trades").insert({
      tournament_id: tournamentId,
      player_id: playerId,
      from_team_id: fromTeamId,
      to_team_id: toTeamId,
      note: note.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setPlayerId("");
    setToTeamId("");
    setNote("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="scorecard p-6">
      <h2 className="stamp text-turf-500 mb-1">Trades</h2>
      <p className="text-turf-700 text-sm mb-4">
        Moves a player to a new team. The original draft pick stays on the
        record — this just logs who they play for now.
      </p>

      <form onSubmit={handleTrade} className="flex flex-wrap items-end gap-4 mb-6">
        <label className="flex flex-col gap-1">
          <span className="stamp text-turf-700">Player</span>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-turf-500"
          >
            <option value="">Choose player</option>
            {draftedPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="stamp text-turf-700">To team</span>
          <select
            value={toTeamId}
            onChange={(e) => setToTeamId(e.target.value)}
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-turf-500"
          >
            <option value="">Choose team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.team_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <span className="stamp text-turf-700">Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            placeholder="Reason for the trade"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-turf-900 text-parchment-100 stamp px-5 py-2.5 rounded hover:bg-turf-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Log trade"}
        </button>
      </form>
      {error && <p className="text-flag text-sm mb-4">{error}</p>}

      {trades.length > 0 && (
        <div>
          <p className="stamp text-turf-500 mb-2">Trade history</p>
          <ul className="space-y-1 text-sm">
            {trades
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.traded_at).getTime() -
                  new Date(a.traded_at).getTime()
              )
              .map((t) => {
                const player = players.find((p) => p.id === t.player_id);
                const from = teams.find((tm) => tm.id === t.from_team_id);
                const to = teams.find((tm) => tm.id === t.to_team_id);
                return (
                  <li key={t.id} className="text-turf-700">
                    <span className="font-medium text-ink">
                      {player?.name}
                    </span>{" "}
                    — {from?.team_name} → {to?.team_name}
                    {t.note ? ` (${t.note})` : ""}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
