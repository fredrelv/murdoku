import { describe, expect, it } from "vitest";
import { toPlayerPuzzle } from "@/server/dto/puzzle.dto";
import { generateCaseOrThrow } from "@/engine/generate/generateCase";

/**
 * The player-facing puzzle payload must never leak the solution: no cell
 * placements, no victim cell, no murderer id. This is the single most
 * important invariant in the persistence layer (see AGENTS notes on
 * solution-leak defenses) — it's tested directly against the sanitizer,
 * independent of the database.
 */
describe("toPlayerPuzzle", () => {
  it("never includes solution placements, victim cell, or murderer id", () => {
    for (let i = 0; i < 10; i++) {
      const result = generateCaseOrThrow({ size: 5, difficulty: "EASY", seed: `dto-leak-${i}` });
      const row = {
        id: "puzzle-1",
        code: "CASE-0001",
        title: result.title,
        size: result.plan.size,
        difficulty: result.difficulty,
        layout: JSON.parse(JSON.stringify(result.plan)),
        cast: JSON.parse(JSON.stringify(result.cast)),
        clues: JSON.parse(JSON.stringify(result.clues)),
      };

      const player = toPlayerPuzzle(row);
      const serialized = JSON.stringify(player);

      // No key anywhere in the payload marks a suspect as "the murderer" or
      // reveals the solved board/victim position.
      expect(serialized).not.toContain("murdererId");
      expect(serialized).not.toContain("victimCell");
      expect(serialized).not.toContain("board");
      expect(player).not.toHaveProperty("board");
      expect(player).not.toHaveProperty("victimCell");
      expect(player).not.toHaveProperty("murdererId");
      // The victim never appears in the playable suspect list (their
      // position is derived by the player, never sent pre-solved).
      expect(player.suspects.find((s) => s.id === result.cast.victim.id)).toBeUndefined();
      // Every suspect object has an identical shape — nothing distinguishes
      // the murderer from any other suspect in the payload.
      for (const suspect of player.suspects) {
        expect(Object.keys(suspect).sort()).toEqual(["avatarKey", "id", "name"]);
      }
    }
  });

  it("exposes exactly the fields the game board needs", () => {
    const result = generateCaseOrThrow({ size: 5, difficulty: "EASY", seed: "dto-shape" });
    const player = toPlayerPuzzle({
      id: "puzzle-1",
      code: "CASE-0001",
      title: result.title,
      size: result.plan.size,
      difficulty: result.difficulty,
      layout: JSON.parse(JSON.stringify(result.plan)),
      cast: JSON.parse(JSON.stringify(result.cast)),
      clues: JSON.parse(JSON.stringify(result.clues)),
    });

    expect(player.layout.cells).toHaveLength(25);
    expect(player.suspects).toHaveLength(4);
    expect(player.clues.length).toBe(result.clues.length);
    expect(typeof player.victimName).toBe("string");
  });
});
