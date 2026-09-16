import { describe, expect, it } from "vitest";
import { evaluateClue } from "@/engine/clues/registry";
import type { Cell, Clue, FloorPlan, Person } from "@/engine/types";

/**
 * 4x4 fixture, two rooms:
 *   room 0 (kitchen-ish): cells 0,1,4,5   -> top-left quadrant
 *   room 1: cells 2,3,6,7,8,9,10,11,12,13,14,15 -> everything else
 * Furniture: cell0=chair(seat), cell1=table(landmark), cell5=chair(seat),
 * cell10=chair(seat), cell15=fireplace(landmark, non-seat).
 */
function fixturePlan(): FloorPlan {
  const furnitureByCell: Record<number, { id: Cell["furnitureId"]; isSeat: boolean }> = {
    0: { id: "chair", isSeat: true },
    1: { id: "table", isSeat: false },
    4: { id: "chair", isSeat: true },
    5: { id: "chair", isSeat: true },
    10: { id: "chair", isSeat: true },
    15: { id: "fireplace", isSeat: false },
  };
  const cells: Cell[] = Array.from({ length: 16 }, (_, index) => {
    const f = furnitureByCell[index] ?? { id: "table" as const, isSeat: false };
    return {
      row: Math.floor(index / 4),
      col: index % 4,
      index,
      roomId: [0, 1, 4, 5].includes(index) ? 0 : 1,
      furnitureId: f.id,
      isSeat: f.isSeat,
    };
  });
  const room0Cells = cells.filter((c) => c.roomId === 0).map((c) => c.index);
  const room1Cells = cells.filter((c) => c.roomId === 1).map((c) => c.index);
  return {
    size: 4,
    cells,
    rooms: [
      { id: 0, kind: "kitchen", name: "Cozinha", gender: "f", cellIndices: room0Cells },
      { id: 1, kind: "parlour", name: "Sala", gender: "f", cellIndices: room1Cells },
    ],
    seatCells: cells.filter((c) => c.isSeat).map((c) => c.index),
  };
}

const suspects: Person[] = [
  { id: "p1", name: "Emma", avatarKey: "fox" },
  { id: "p2", name: "Boris", avatarKey: "owl" },
  { id: "p3", name: "Clara", avatarKey: "cat" },
];

// p1 -> cell0 (chair, room0), p2 -> cell5 (chair, room0), p3 -> cell10 (chair, room1)
const board = [0, 5, 10];
const plan = fixturePlan();
const ctx = { plan, suspects, board };

function clue(type: Clue["type"], args: Clue["args"], tier: Clue["tier"] = 1): Clue {
  return { id: "t", type, tier, args, text: "" };
}

describe("evaluateClue", () => {
  it("SEAT_TYPE / NOT_SEAT_TYPE", () => {
    expect(evaluateClue(clue("SEAT_TYPE", { suspectId: "p1", furnitureId: "chair" }), ctx)).toBe(true);
    expect(evaluateClue(clue("SEAT_TYPE", { suspectId: "p1", furnitureId: "bed" }), ctx)).toBe(false);
    expect(evaluateClue(clue("NOT_SEAT_TYPE", { suspectId: "p1", furnitureId: "bed" }), ctx)).toBe(true);
  });

  it("IN_ROOM / NOT_IN_ROOM", () => {
    expect(evaluateClue(clue("IN_ROOM", { suspectId: "p1", roomId: 0 }), ctx)).toBe(true);
    expect(evaluateClue(clue("IN_ROOM", { suspectId: "p3", roomId: 0 }), ctx)).toBe(false);
    expect(evaluateClue(clue("NOT_IN_ROOM", { suspectId: "p3", roomId: 0 }), ctx)).toBe(true);
  });

  it("ADJACENT_FURNITURE", () => {
    // p1 at cell0 is orthogonally adjacent to cell1 (table) and cell4 (chair, not a landmark).
    expect(evaluateClue(clue("ADJACENT_FURNITURE", { suspectId: "p1", furnitureId: "table" }), ctx)).toBe(true);
    expect(evaluateClue(clue("ADJACENT_FURNITURE", { suspectId: "p1", furnitureId: "fireplace" }), ctx)).toBe(false);
  });

  it("SAME_ROOM / DIFFERENT_ROOM", () => {
    expect(evaluateClue(clue("SAME_ROOM", { suspectAId: "p1", suspectBId: "p2" }, 2), ctx)).toBe(true);
    expect(evaluateClue(clue("DIFFERENT_ROOM", { suspectAId: "p1", suspectBId: "p3" }, 2), ctx)).toBe(true);
  });

  it("ADJACENT_PERSON / NOT_ADJACENT_PERSON", () => {
    // p1(0) and p2(5) are not orthogonally adjacent (diagonal-ish, distance 2).
    expect(evaluateClue(clue("ADJACENT_PERSON", { suspectAId: "p1", suspectBId: "p2" }, 2), ctx)).toBe(false);
    expect(evaluateClue(clue("NOT_ADJACENT_PERSON", { suspectAId: "p1", suspectBId: "p2" }, 2), ctx)).toBe(true);
  });

  it("DIRECTION", () => {
    // p1 at row0, p3 at row2 -> p1 is north of p3.
    expect(evaluateClue(clue("DIRECTION", { suspectAId: "p1", suspectBId: "p3", direction: "north" }, 2), ctx)).toBe(true);
    expect(evaluateClue(clue("DIRECTION", { suspectAId: "p1", suspectBId: "p3", direction: "south" }, 2), ctx)).toBe(false);
    // p1 at col0, p3 at col2 -> p1 is west of p3.
    expect(evaluateClue(clue("DIRECTION", { suspectAId: "p1", suspectBId: "p3", direction: "west" }, 2), ctx)).toBe(true);
  });
});
