import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng("case-1");
    const b = createRng("case-1");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("diverges for different seeds", () => {
    const a = createRng("case-1");
    const b = createRng("case-2");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("next() stays within [0, 1)", () => {
    const rng = createRng("bounds");
    for (let i = 0; i < 500; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int(n) stays within [0, n)", () => {
    const rng = createRng("bounds-int");
    for (let i = 0; i < 500; i++) {
      const v = rng.int(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });

  it("shuffle is a permutation of the input", () => {
    const rng = createRng("shuffle");
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(input);
    expect(shuffled.slice().sort()).toEqual(input.slice().sort());
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // does not mutate
  });
});
