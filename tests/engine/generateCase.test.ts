import { describe, expect, it } from "vitest";
import { generateCase } from "@/engine/generate/generateCase";

describe("generateCase", () => {
  it("is reproducible: same seed + options -> identical case", () => {
    const a = generateCase({ size: 5, difficulty: "EASY", seed: "repro-1" });
    const b = generateCase({ size: 5, difficulty: "EASY", seed: "repro-1" });
    expect(a).not.toBeNull();
    expect(a).toEqual(b);
  });

  it("holds core invariants across many seeds (EASY, size 5)", () => {
    let generated = 0;
    for (let i = 0; i < 40; i++) {
      const result = generateCase({ size: 5, difficulty: "EASY", seed: `easy-${i}` });
      if (!result) continue; // generator may legitimately fail some seeds; asserted below via count
      generated++;

      // Board respects one-per-row/col and only seat cells.
      const rows = new Set(result.board.map((c) => Math.floor(c / 5)));
      const cols = new Set(result.board.map((c) => c % 5));
      expect(rows.size).toBe(4);
      expect(cols.size).toBe(4);
      for (const cell of result.board) {
        expect(result.plan.cells[cell]!.isSeat).toBe(true);
      }

      // Victim's room contains exactly one suspect (the murderer).
      const victimRoom = result.plan.cells[result.victimCell]!.roomId;
      const occupants = result.board.filter((cell) => result.plan.cells[cell]!.roomId === victimRoom);
      expect(occupants).toHaveLength(1);

      const murdererIdx = result.cast.suspects.findIndex((s) => s.id === result.murdererId);
      expect(murdererIdx).toBeGreaterThanOrEqual(0);
      expect(result.plan.cells[result.board[murdererIdx]!]!.roomId).toBe(victimRoom);

      // No clue ever references the victim.
      const victimId = result.cast.victim.id;
      for (const clue of result.clues) {
        const args = clue.args as unknown as Record<string, unknown>;
        expect(args.suspectId).not.toBe(victimId);
        expect(args.suspectAId).not.toBe(victimId);
        expect(args.suspectBId).not.toBe(victimId);
      }

      // EASY cases only ever use tier-1 clues.
      for (const clue of result.clues) {
        expect(clue.tier).toBe(1);
      }

      expect(result.clues.length).toBeGreaterThan(0);
    }
    // The generator should succeed for the overwhelming majority of seeds.
    expect(generated).toBeGreaterThan(30);
  });

  it("holds core invariants for MEDIUM (tier 1+2 clues allowed)", () => {
    let generated = 0;
    let usedTier2 = false;
    for (let i = 0; i < 40; i++) {
      const result = generateCase({ size: 5, difficulty: "MEDIUM", seed: `medium-${i}` });
      if (!result) continue;
      generated++;
      if (result.clues.some((c) => c.tier === 2)) usedTier2 = true;
      expect(result.clues.every((c) => c.tier <= 2)).toBe(true);
    }
    expect(generated).toBeGreaterThan(20);
    expect(usedTier2).toBe(true);
  });

  it("returns null when attempts are exhausted with an impossible option set", () => {
    // maxPlanAttempts: 0 means it can't even try once.
    const result = generateCase({ size: 5, difficulty: "EASY", seed: "impossible", maxPlanAttempts: 0 });
    expect(result).toBeNull();
  });
});
