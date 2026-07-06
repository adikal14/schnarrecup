import { createClient } from "@/lib/supabase/server";
import type { Draft, DraftPick, Player, Team, Tournament, Trade } from "@/lib/types";
import { notFound } from "next/navigation";
import TeamSetupForm from "./_components/TeamSetupForm";
import StartDraftForm from "./_components/StartDraftForm";
import RosterSummary from "./_components/RosterSummary";
import TradesPanel from "./_components/TradesPanel";

export default async function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: tournament }, { data: teams }, { data: activePlayers }] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", params.id).single<Tournament>(),
      supabase.from("teams").select("*").eq("tournament_id", params.id).returns<Team[]>(),
      supabase.from("players").select("*").eq("active", true).returns<Player[]>(),
    ]);

  if (!tournament) notFound();

  const { data: draft } = await supabase
    .from("drafts")
    .select("*")
    .eq("tournament_id", params.id)
    .maybeSingle<Draft>();

  const teamList = teams ?? [];
  const playerList = activePlayers ?? [];

  let picks: DraftPick[] = [];
  let trades: Trade[] = [];
  if (draft) {
    const [picksRes, tradesRes] = await Promise.all([
      supabase.from("draft_picks").select("*").eq("draft_id", draft.id).returns<DraftPick[]>(),
      supabase.from("trades").select("*").eq("tournament_id", params.id).returns<Trade[]>(),
    ]);
    picks = picksRes.data ?? [];
    trades = tradesRes.data ?? [];
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="stamp text-turf-500 mb-2">{tournament.year}</p>
        <h1 className="font-display text-3xl font-700 text-turf-950">
          {tournament.name}
        </h1>
        <p className="text-turf-700 mt-1">
          {tournament.course_name ?? "Course TBD"} · {tournament.roster_size}{" "}
          players · {tournament.num_rounds} rounds
        </p>
      </div>

      {teamList.length < 2 && (
        <TeamSetupForm tournamentId={tournament.id} activePlayers={playerList} />
      )}

      {teamList.length >= 2 && !draft && (
        <StartDraftForm tournament={tournament} teams={teamList} />
      )}

      {draft && draft.status === "in_progress" && (
        <div className="scorecard p-8 text-center">
          <p className="text-turf-700 mb-4">The draft is currently underway.</p>
          <a
            href={`/tournaments/${tournament.id}/draft`}
            className="stamp bg-flag text-parchment-100 px-5 py-2.5 rounded inline-block hover:opacity-90 transition-opacity"
          >
            Enter draft room →
          </a>
        </div>
      )}

      {draft && draft.status === "completed" && (
        <div className="space-y-8">
          <div>
            <h2 className="stamp text-turf-500 mb-3">Rosters</h2>
            <RosterSummary
              teams={teamList}
              players={playerList}
              picks={picks}
              trades={trades}
            />
          </div>
          <TradesPanel
            tournamentId={tournament.id}
            teams={teamList}
            players={playerList}
            picks={picks}
            trades={trades}
          />
          <div className="scorecard p-8 text-center text-turf-700">
            Pairings and match scoring are next up.
          </div>
        </div>
      )}
    </div>
  );
}
