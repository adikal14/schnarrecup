import { createClient } from "@/lib/supabase/server";
import type { Tournament } from "@/lib/types";

export default async function HomePage() {
  const supabase = createClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false })
    .returns<Tournament[]>();

  return (
    <div className="space-y-10">
      <section>
        <p className="stamp text-turf-500 mb-2">Est. — track every year</p>
        <h1 className="font-display text-4xl font-700 text-turf-950 max-w-xl leading-tight">
          Every draft. Every match. Every year, on the record.
        </h1>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-turf-900">Tournaments</h2>
          <a
            href="/admin/tournaments"
            className="stamp text-flag hover:underline"
          >
            + New tournament
          </a>
        </div>

        {!tournaments || tournaments.length === 0 ? (
          <div className="scorecard p-8 text-center">
            <p className="text-turf-700">
              No tournaments yet. Create the first one to get the draft
              rolling.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tournaments.map((t) => (
              <a
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="scorecard p-5 flex items-center justify-between hover:border-turf-700 transition-colors"
              >
                <div>
                  <p className="font-display text-xl text-turf-950">
                    {t.name}
                  </p>
                  <p className="stamp text-turf-500 mt-1">
                    {t.year} · {t.course_name ?? "Course TBD"} ·{" "}
                    {t.roster_size} players
                  </p>
                </div>
                <span className="stamp text-turf-700 border border-turf-700/40 rounded-full px-3 py-1">
                  {t.status}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
