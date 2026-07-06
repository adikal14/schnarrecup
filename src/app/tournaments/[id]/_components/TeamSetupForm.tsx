"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

export default function TeamSetupForm({
  tournamentId,
  activePlayers,
}: {
  tournamentId: string;
  activePlayers: Player[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [captainAId, setCaptainAId] = useState("");
  const [teamAName, setTeamAName] = useState("");
  const [captainBId, setCaptainBId] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!captainAId || !captainBId) {
      setError("Choose a captain for both teams.");
      return;
    }
    if (captainAId === captainBId) {
      setError("The two captains must be different players.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("teams").insert([
      {
        tournament_id: tournamentId,
        captain_player_id: captainAId,
        team_name: teamAName.trim() || "Team A",
      },
      {
        tournament_id: tournamentId,
        captain_player_id: captainBId,
        team_name: teamBName.trim() || "Team B",
      },
    ]);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="scorecard p-6">
      <h2 className="stamp text-turf-500 mb-4">Step 1 — Set the two teams</h2>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Team A name</span>
            <input
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              placeholder="Team A"
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Captain A</span>
            <select
              required
              value={captainAId}
              onChange={(e) => setCaptainAId(e.target.value)}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            >
              <option value="">Select a player</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Team B name</span>
            <input
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              placeholder="Team B"
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="stamp text-turf-700">Captain B</span>
            <select
              required
              value={captainBId}
              onChange={(e) => setCaptainBId(e.target.value)}
              className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-turf-500"
            >
              <option value="">Select a player</option>
              {activePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="sm:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-turf-900 text-parchment-100 stamp px-5 py-2.5 rounded hover:bg-turf-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating teams…" : "Create teams"}
          </button>
          {error && <p className="text-flag text-sm">{error}</p>}
        </div>
      </form>
    </div>
  );
}
