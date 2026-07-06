import type { DraftPick, DraftTurn, Trade } from "@/lib/types";

/**
 * Builds the full turn sequence for a draft up front, e.g. for a 16-person
 * roster (14 draftable players after the two captains):
 *   turn 1: captainA picks 1
 *   turn 2: captainB picks 2
 *   turn 3: captainA picks 2
 *   ...
 *   final turn: picks 1 (falls out naturally once the pool is odd)
 *
 * Only needs roster size + who picks first — everything else is derived.
 */
export function generateDraftTurns(
  rosterSize: 16 | 20,
  firstCaptainId: string,
  secondCaptainId: string
): Array<{ turn_number: number; captain_id: string; picks_required: 1 | 2 }> {
  const draftable = rosterSize - 2;
  const turns: Array<{
    turn_number: number;
    captain_id: string;
    picks_required: 1 | 2;
  }> = [];

  let remaining = draftable;
  let turnNumber = 1;
  let currentCaptain = firstCaptainId;

  // first turn is always a single pick
  turns.push({ turn_number: turnNumber, captain_id: currentCaptain, picks_required: 1 });
  remaining -= 1;
  turnNumber += 1;
  currentCaptain = currentCaptain === firstCaptainId ? secondCaptainId : firstCaptainId;

  while (remaining > 0) {
    const picks: 1 | 2 = remaining >= 2 ? 2 : 1;
    turns.push({ turn_number: turnNumber, captain_id: currentCaptain, picks_required: picks });
    remaining -= picks;
    turnNumber += 1;
    currentCaptain = currentCaptain === firstCaptainId ? secondCaptainId : firstCaptainId;
  }

  return turns;
}

/**
 * Given all turns and all *active* picks so far, finds the turn currently
 * in progress (or not yet started). Returns null once every turn is full,
 * meaning the draft is complete.
 */
export function getCurrentTurn(
  turns: DraftTurn[],
  picks: DraftPick[]
): DraftTurn | null {
  const sorted = [...turns].sort((a, b) => a.turn_number - b.turn_number);
  for (const turn of sorted) {
    const picksForTurn = picks.filter(
      (p) => p.turn_number === turn.turn_number && p.status === "active"
    );
    if (picksForTurn.length < turn.picks_required) {
      return turn;
    }
  }
  return null;
}

/**
 * A player's team for a tournament is their original draft pick, unless a
 * later trade moved them. This keeps "who was drafted" and "who they play
 * for now" both visible in history rather than overwriting one with the
 * other.
 */
export function getCurrentTeamId(
  playerId: string,
  picks: DraftPick[],
  trades: Trade[]
): string | null {
  const relevantTrades = trades
    .filter((t) => t.player_id === playerId)
    .sort((a, b) => new Date(b.traded_at).getTime() - new Date(a.traded_at).getTime());

  if (relevantTrades.length > 0) {
    return relevantTrades[0].to_team_id;
  }

  const pick = picks.find((p) => p.player_id === playerId && p.status === "active");
  return pick ? pick.team_id : null;
}
