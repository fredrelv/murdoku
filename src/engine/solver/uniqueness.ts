import { andMasks, popcount } from "../placement/bitset";
import { evaluateClue } from "../clues/registry";
import type { Board, Cast, Clue, FloorPlan } from "../types";

/**
 * For each enumerated placement, 1 if the placement satisfies `clue`, else 0.
 */
export function buildClueMask(clue: Clue, plan: FloorPlan, suspects: Cast["suspects"], placements: Board[]): Uint8Array {
  const mask = new Uint8Array(placements.length);
  for (let i = 0; i < placements.length; i++) {
    if (evaluateClue(clue, { plan, suspects, board: placements[i]! })) {
      mask[i] = 1;
    }
  }
  return mask;
}

export function countSolutions(masks: Uint8Array[]): number {
  if (masks.length === 0) return 0;
  return popcount(andMasks(masks));
}
