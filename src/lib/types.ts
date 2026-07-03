// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked to Supabase, replace this with generated types:
//   npx supabase gen types typescript --project-id <id> > src/lib/types.ts

export type PlayerRole = "commissioner" | "player";
export type TournamentStatus = "setup" | "drafting" | "in_progress" | "completed";
export type DraftStatus = "pending" | "in_progress" | "completed";
export type DraftPickStatus = "active" | "corrected" | "traded";
export type MatchStatus = "scheduled" | "in_progress" | "completed";
export type HoleWinner = "team_a" | "team_b" | "halved";

export interface Player {
  id: string;
  name: string;
  hometown: string | null;
  handicap: number | null;
  fun_fact: string | null;
  active: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Tournament {
  id: string;
  year: number;
  name: string;
  course_name: string | null;
  tournament_date: string | null;
  roster_size: 16 | 20;
  num_rounds: number;
  tiebreaker_type: string | null;
  tiebreaker_result: string | null;
  status: TournamentStatus;
  created_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  captain_player_id: string;
  team_name: string;
  created_at: string;
}

export interface Draft {
  id: string;
  tournament_id: string;
  first_pick_captain_id: string;
  status: DraftStatus;
  created_at: string;
}

export interface DraftTurn {
  id: string;
  draft_id: string;
  turn_number: number;
  captain_id: string;
  picks_required: 1 | 2;
}

export interface DraftPick {
  id: string;
  draft_id: string;
  turn_number: number;
  team_id: string;
  player_id: string;
  pick_order: number;
  status: DraftPickStatus;
  created_at: string;
}

export interface Trade {
  id: string;
  tournament_id: string;
  player_id: string;
  from_team_id: string;
  to_team_id: string;
  traded_at: string;
  note: string | null;
}

export interface RoundPairing {
  id: string;
  tournament_id: string;
  round_number: number;
  team_id: string;
  player_1_id: string;
  player_2_id: string;
  created_at: string;
}

export interface RoundMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  team_a_pairing_id: string;
  team_b_pairing_id: string;
  status: MatchStatus;
  holes_played: number | null;
  conceded: boolean;
  result_summary: string | null;
  points_team_a: number;
  points_team_b: number;
  created_at: string;
}

export interface MatchHole {
  id: string;
  round_match_id: string;
  hole_number: number;
  par: number | null;
  team_a_strokes: number | null;
  team_b_strokes: number | null;
  hole_winner: HoleWinner | null;
}

// Minimal Database type so @supabase/ssr's generics are happy.
// Swap for the real generated type once you run `supabase gen types`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
