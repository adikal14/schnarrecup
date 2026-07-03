# The Cup — Tournament HQ

Foundation scaffold: draft, score, and track your annual two-team match-play
tournament, year over year.

## What's built so far (Phase 1: Foundation)

- Full Postgres schema (`supabase/migrations/0001_init.sql`) covering
  players, tournaments, teams, drafts, draft turns/picks, trades, round
  pairings, matches, and hole-by-hole scoring — plus row-level security
  (commissioner-only writes, everyone can read).
- Next.js 14 app router project, Supabase client wired up for both
  server and browser use.
- Admin screens: add/deactivate players, create a tournament.
- A placeholder tournament page ready for the draft room (Phase 3).

## Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a new project, and note
your project URL and anon key from **Settings > API**.

### 2. Run the schema
In the Supabase dashboard, open the **SQL Editor**, paste the contents of
`supabase/migrations/0001_init.sql`, and run it. This creates every table,
the commissioner/player role system, and RLS policies.

Alternatively, if you have the Supabase CLI installed and linked:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Make yourself commissioner
After you sign up once through the app (auth screens come in a later
phase — for now you can invite yourself a user via the Supabase dashboard
under **Authentication > Users**), run this in the SQL Editor:
```sql
update profiles set role = 'commissioner' where id = 'your-auth-user-id';
```

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 5. Install and run
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

### 6. Deploy
Push this repo to GitHub, then import it into
[Vercel](https://vercel.com/new). Add the same two environment variables in
the Vercel project settings. Every push to `main` deploys automatically.

## What's next

- **Phase 2:** captain assignment + the "1-2-2-2..." draft room, live via
  Supabase realtime subscriptions on `draft_picks`.
- **Phase 3:** round pairings + match play scoring UI (two-ball scramble,
  hole-by-hole entry, auto-computed match status like "3&2").
- **Phase 4:** historical records — cross-year standings, player career
  stats, draft history — built as views over the raw tables so nothing
  drifts out of sync.
- **Phase 5:** let individual players log their own scramble scores
  (loosen the `match_holes` RLS policy to the two players in that match),
  trades UI, mobile polish.

## Notes on the schema

- `players` is the org-wide eligible pool, independent of any one
  tournament — `active` is just a flag, not a delete, so inactive players
  stay in historical records.
- A player's "current team" for a tournament is derived: their original
  `draft_picks` entry, unless a later row in `trades` overrides it. Both
  stay on the record.
- `round_pairings` is scoped per round, since your pairings can change
  each round.
- `match_holes.hole_winner` plus `round_matches.holes_played` /
  `conceded` support matches that end early (e.g. "3&2") without needing
  to fill in scores for holes that were never played.
