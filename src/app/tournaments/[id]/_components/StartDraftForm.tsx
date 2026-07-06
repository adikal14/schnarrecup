"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateDraftTurns } from "@/lib/draft";
import type { Team, Tournament } from "@/lib/types";

export default function StartDraftForm({
  tournament,
  teams,
}: {
  tournament: Tournament;
  teams: Team[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [firstCaptainId, setFirstCaptainId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!firstCaptainId) {
      setError("Choose which captain picks first.");
      return;
    }
    setSaving(true);
    setError(null);

    const secondCaptainId = teams.find(
      (t) => t.captain_player_id !== firstCaptainId
    )?.captain_player_id;

    if (!secondCaptainId) {
      setError("Could not determine the second captain.");
      setSaving(false);
      return;
    }

    const { data: draft, error: draftError } = await supabase
      .from("drafts")
      .insert({
        tournament_id: tournament.id,
        first_pick_captain_id: firstCaptainId,
        status: "in_progress",
      })
      .select()
      .single();

    if (draftError || !draft) {
      setError(draftError?.message ?? "Could not create the draft.");
      setSaving(false);
      return;
    }

    const turns = generateDraftTurns(
      tournament.roster_size,
      firstCaptainId,
      secondCaptainId
    ).map((t) => ({ ...t, draft_id: draft.id }));

    const { error: turnsError } = await supabase
      .from("draft_turns")
      .insert(turns);

    if (turnsError) {
      setError(turnsError.message);
      setSaving(false);
      return;
    }

    await supabase
      .from("tournaments")
      .update({ status: "drafting" })
      .eq("id", tournament.id);

    router.push(`/tournaments/${tournament.id}/draft`);
  }

  return (
    <div className="scorecard p-6">
      <h2 className="stamp text-turf-500 mb-4">Step 2 — Start the draft</h2>
      <p className="text-turf-700 mb-4">
        {tournament.roster_size} players total, {tournament.roster_size - 2}{" "}
        to draft. First pick is solo, then it alternates two at a time.
      </p>
      <form onSubmit={handleStart} className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="stamp text-turf-700">First pick</span>
          <select
            required
            value={firstCaptainId}
            onChange={(e) => setFirstCaptainId(e.target.value)}
            className="bg-white/70 border border-turf-900/20 rounded px-3 py-2 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-turf-500"
          >
            <option value="">Choose captain</option>
            {teams.map((t) => (
              <option key={t.id} value={t.captain_player_id}>
                {t.team_name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-flag text-parchment-100 stamp px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Starting…" : "Start draft"}
        </button>
        {error && <p className="text-flag text-sm">{error}</p>}
      </form>
    </div>
  );
}
