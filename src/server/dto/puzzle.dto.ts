import type { Cast, Clue, FloorPlan } from "@/engine/types";

/**
 * Player-facing puzzle payload. This is the ONLY function that should ever
 * build a response for a non-admin puzzle read — it must never include
 * solution placements, the victim's cell, or the murderer's id.
 */
export interface PlayerPuzzle {
  id: string;
  code: string;
  title: string;
  size: number;
  difficulty: string;
  layout: FloorPlan;
  suspects: Cast["suspects"];
  victimName: string;
  clues: Clue[];
}

export function toPlayerPuzzle(puzzle: {
  id: string;
  code: string;
  title: string;
  size: number;
  difficulty: string;
  layout: unknown;
  cast: unknown;
  clues: unknown;
}): PlayerPuzzle {
  const layout = puzzle.layout as FloorPlan;
  const cast = puzzle.cast as Cast;
  const clues = puzzle.clues as Clue[];
  return {
    id: puzzle.id,
    code: puzzle.code,
    title: puzzle.title,
    size: puzzle.size,
    difficulty: puzzle.difficulty,
    layout,
    suspects: cast.suspects,
    victimName: cast.victim.name,
    clues,
  };
}
