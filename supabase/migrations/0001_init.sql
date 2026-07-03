-- ============================================================================
-- Annual Golf Tournament App — Initial Schema
-- ============================================================================
-- Run this in the Supabase SQL editor, or via `supabase db push` once the
-- Supabase CLI is linked to your project.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user, carries the commissioner/player role
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'player' check (role in ('commissioner', 'player')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used throughout RLS policies below
create function public.is_commissioner()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'commissioner'
  );
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- players: the org-wide eligible player pool (not per-tournament)
-- ----------------------------------------------------------------------------
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hometown text,
  handicap numeric(4,1),
  fun_fact text,
  active boolean not null default true,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- tournaments: one per year
-- ----------------------------------------------------------------------------
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  name text not null,
  course_name text,
  tournament_date date,
  roster_size int not null check (roster_size in (16, 20)),
  num_rounds int not null default 3,
  tiebreaker_type text,
  tiebreaker_result text,
  status text not null default 'setup'
    check (status in ('setup', 'drafting', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- teams: the two sides for a given tournament
-- ----------------------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  captain_player_id uuid not null references players(id),
  team_name text not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, captain_player_id)
);

-- ----------------------------------------------------------------------------
-- drafts + draft_turns + draft_picks
-- ----------------------------------------------------------------------------
create table drafts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null unique references tournaments(id) on delete cascade,
  first_pick_captain_id uuid not null references players(id),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

create table draft_turns (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references drafts(id) on delete cascade,
  turn_number int not null,
  captain_id uuid not null references players(id),
  picks_required int not null check (picks_required in (1, 2)),
  unique (draft_id, turn_number)
);

create table draft_picks (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references drafts(id) on delete cascade,
  turn_number int not null,
  team_id uuid not null references teams(id),
  player_id uuid not null references players(id),
  pick_order int not null,
  status text not null default 'active'
    check (status in ('active', 'corrected', 'traded')),
  created_at timestamptz not null default now(),
  unique (draft_id, player_id)
);

-- ----------------------------------------------------------------------------
-- trades: post-draft team swaps (draft_picks stays the historical record of
-- who was actually drafted; trades layer on top of it)
-- ----------------------------------------------------------------------------
create table trades (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id uuid not null references players(id),
  from_team_id uuid not null references teams(id),
  to_team_id uuid not null references teams(id),
  traded_at timestamptz not null default now(),
  note text
);

-- ----------------------------------------------------------------------------
-- round_pairings: two-ball scramble duos, can change round to round
-- ----------------------------------------------------------------------------
create table round_pairings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round_number int not null,
  team_id uuid not null references teams(id),
  player_1_id uuid not null references players(id),
  player_2_id uuid not null references players(id),
  created_at timestamptz not null default now(),
  check (player_1_id <> player_2_id)
);

-- ----------------------------------------------------------------------------
-- round_matches: one pairing from each team goes head to head, match play
-- ----------------------------------------------------------------------------
create table round_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round_number int not null,
  team_a_pairing_id uuid not null references round_pairings(id),
  team_b_pairing_id uuid not null references round_pairings(id),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed')),
  holes_played int,
  conceded boolean not null default false,
  result_summary text,          -- e.g. "3&2", "AS"
  points_team_a numeric(3,1) not null default 0,
  points_team_b numeric(3,1) not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- match_holes: hole-by-hole scramble score + winner
-- ----------------------------------------------------------------------------
create table match_holes (
  id uuid primary key default gen_random_uuid(),
  round_match_id uuid not null references round_matches(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  par int,
  team_a_strokes int,
  team_b_strokes int,
  hole_winner text check (hole_winner in ('team_a', 'team_b', 'halved')),
  unique (round_match_id, hole_number)
);

-- ============================================================================
-- Row Level Security
-- Everyone signed in can read everything (it's one shared tournament group).
-- Only commissioners can write, for every table, for now. As the "players
-- log their own scores" feature gets built later, loosen match_holes writes
-- to the two players in that match.
-- ============================================================================

alter table profiles enable row level security;
alter table players enable row level security;
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table drafts enable row level security;
alter table draft_turns enable row level security;
alter table draft_picks enable row level security;
alter table trades enable row level security;
alter table round_pairings enable row level security;
alter table round_matches enable row level security;
alter table match_holes enable row level security;

-- profiles: everyone can read; only the user themself or a commissioner can
-- update; only commissioners can change roles
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_self_or_commissioner" on profiles for update
  using (auth.uid() = id or public.is_commissioner());

-- generic pattern for every tournament-data table below:
--   read = any signed-in user, write = commissioner only
create policy "players_select_all" on players for select using (true);
create policy "players_write_commissioner" on players for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "tournaments_select_all" on tournaments for select using (true);
create policy "tournaments_write_commissioner" on tournaments for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "teams_select_all" on teams for select using (true);
create policy "teams_write_commissioner" on teams for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "drafts_select_all" on drafts for select using (true);
create policy "drafts_write_commissioner" on drafts for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "draft_turns_select_all" on draft_turns for select using (true);
create policy "draft_turns_write_commissioner" on draft_turns for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "draft_picks_select_all" on draft_picks for select using (true);
create policy "draft_picks_write_commissioner" on draft_picks for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "trades_select_all" on trades for select using (true);
create policy "trades_write_commissioner" on trades for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "round_pairings_select_all" on round_pairings for select using (true);
create policy "round_pairings_write_commissioner" on round_pairings for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "round_matches_select_all" on round_matches for select using (true);
create policy "round_matches_write_commissioner" on round_matches for all
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy "match_holes_select_all" on match_holes for select using (true);
create policy "match_holes_write_commissioner" on match_holes for all
  using (public.is_commissioner()) with check (public.is_commissioner());

-- ============================================================================
-- Enable realtime so the draft room / live match updates can subscribe
-- ============================================================================
alter publication supabase_realtime add table draft_picks;
alter publication supabase_realtime add table round_matches;
alter publication supabase_realtime add table match_holes;
