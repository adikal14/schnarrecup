import { createClient } from "@/lib/supabase/server";
import type { Tournament } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", params.id)
    .single<Tournament>();

  if (!tournament) notFound();

  return (
    <div className="space-y-6">
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

      <div className="scorecard p-8 text-center text-turf-700">
        Team setup and the draft room are next up — this page will host
        captain assignment, the live draft, pairings, and match scoring as
        those get built.
      </div>
    </div>
  );
}
