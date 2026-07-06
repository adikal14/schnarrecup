import { getCurrentTeamId } from "@/lib/draft";
import type { DraftPick, Player, Team, Trade } from "@/lib/types";

export default function RosterSummary({
  teams,
  players,
  picks,
  trades,
}: {
  teams: Team[];
  players: Player[];
  picks: DraftPick[];
  trades: Trade[];
}) {
  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {teams.map((team) => {
        const roster = players.filter(
          (p) => getCurrentTeamId(p.id, picks, trades) === team.id
        );
        return (
          <div key={team.id} className="scorecard p-5">
            <h3 className="font-display text-lg text-turf-950">
              {team.team_name}
            </h3>
            <p className="stamp text-turf-500 mb-3">
              Captain: {playerById.get(team.captain_player_id)?.name ?? "—"}
            </p>
            <ul className="space-y-1.5">
              {roster.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{p.name}</span>
                  {p.handicap != null && (
                    <span className="font-mono text-turf-500">
                      {p.handicap}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
