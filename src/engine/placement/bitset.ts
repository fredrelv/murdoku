/**
 * A "mask" is a Uint8Array of length P (number of enumerated placements),
 * one byte per placement: 1 if the placement satisfies a clue, 0 otherwise.
 * AND + popcount over masks turns "how many boards remain consistent with
 * this clue set" into a couple of cheap array scans instead of re-running
 * the solver, which is what makes clue-set search fast enough for N<=6.
 */

export function andMasks(masks: Uint8Array[]): Uint8Array {
  if (masks.length === 0) throw new Error("andMasks requires at least one mask");
  const length = masks[0]!.length;
  const result = new Uint8Array(length).fill(1);
  for (const mask of masks) {
    for (let i = 0; i < length; i++) {
      result[i] = result[i]! & mask[i]!;
    }
  }
  return result;
}

export function popcount(mask: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) count++;
  }
  return count;
}

export function firstSetIndex(mask: Uint8Array): number {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) return i;
  }
  return -1;
}
