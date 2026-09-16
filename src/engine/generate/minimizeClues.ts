import { andMasks, popcount } from "../placement/bitset";
import type { Rng } from "../rng";
import type { Clue } from "../types";

interface ClueWithMask {
  clue: Clue;
  mask: Uint8Array;
}

/**
 * Random-add-then-shrink search for an irredundant clue subset that narrows
 * the enumerated placements down to exactly one. Every clue in the returned
 * set is load-bearing (removing any single one would re-introduce ambiguity).
 * Returns null if even the full pool can't narrow the placements to one
 * solution (caller should regenerate with a different board/plan).
 */
export function selectClueSet(
  rng: Rng,
  pool: Clue[],
  masks: Uint8Array[],
  restarts = 8,
): Clue[] | null {
  const entries: ClueWithMask[] = pool.map((clue, i) => ({ clue, mask: masks[i]! }));
  if (entries.length === 0) return null;

  let best: Clue[] | null = null;

  for (let restart = 0; restart < restarts; restart++) {
    const shuffled = rng.shuffle(entries);
    const selected: ClueWithMask[] = [];
    let acc: Uint8Array<ArrayBufferLike> = new Uint8Array(shuffled[0]!.mask.length).fill(1);
    let accCount = popcount(acc);

    for (const entry of shuffled) {
      if (accCount <= 1) break;
      const candidate = andMasks([acc, entry.mask]);
      const candidateCount = popcount(candidate);
      if (candidateCount < accCount) {
        selected.push(entry);
        acc = candidate;
        accCount = candidateCount;
      }
    }

    if (accCount !== 1) continue; // this restart's ordering couldn't reach uniqueness

    // Shrink phase: drop any clue whose absence still leaves exactly one solution.
    let shrunk = selected.slice();
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < shrunk.length; i++) {
        const without = shrunk.filter((_, idx) => idx !== i);
        const remainingMask = without.length > 0 ? andMasks(without.map((e) => e.mask)) : acc;
        if (without.length > 0 && popcount(remainingMask) === 1) {
          shrunk = without;
          changed = true;
          break;
        }
      }
    }

    if (!best || shrunk.length < best.length) {
      best = shrunk.map((e) => e.clue);
    }
  }

  return best;
}
