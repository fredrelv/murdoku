import { describe, expect, it } from "vitest";
import { enumeratePlacements, leftoverCell } from "@/engine/placement/enumerate";
import type { Cell, FloorPlan } from "@/engine/types";

/**
 * Hand-built 3x3 fixture (2 suspects + 1 victim):
 *   row0: [seat, seat, non-seat]
 *   row1: [non-seat, seat, seat]
 *   row2: [seat, non-seat, seat]
 * Single room covering everything (room content irrelevant to enumeration).
 */
function fixture3x3(): FloorPlan {
  const seatMap = [true, true, false, false, true, true, true, false, true];
  const cells: Cell[] = seatMap.map((isSeat, index) => ({
    row: Math.floor(index / 3),
    col: index % 3,
    index,
    roomId: 0,
    furnitureId: isSeat ? "chair" : "table",
    isSeat,
  }));
  return {
    size: 3,
    cells,
    rooms: [{ id: 0, kind: "parlour", name: "Sala", gender: "f", cellIndices: cells.map((c) => c.index) }],
    seatCells: cells.filter((c) => c.isSeat).map((c) => c.index),
  };
}

describe("enumeratePlacements", () => {
  it("only returns boards where every suspect sits on a distinct row/col seat cell", () => {
    const plan = fixture3x3();
    const placements = enumeratePlacements(plan, 2)!;
    expect(placements.length).toBeGreaterThan(0);
    for (const board of placements) {
      expect(board).toHaveLength(2);
      const rows = board.map((c) => Math.floor(c / 3));
      const cols = board.map((c) => c % 3);
      expect(new Set(rows).size).toBe(2);
      expect(new Set(cols).size).toBe(2);
      for (const cell of board) {
        expect(plan.cells[cell]!.isSeat).toBe(true);
      }
    }
  });

  it("rejects boards whose leftover row/col intersection is not a seat", () => {
    const plan = fixture3x3();
    const placements = enumeratePlacements(plan, 2)!;
    for (const board of placements) {
      const leftover = leftoverCell(plan, board);
      expect(plan.cells[leftover]!.isSeat).toBe(true);
    }
  });

  it("matches an exhaustively hand-counted result on the fixture", () => {
    const plan = fixture3x3();
    const placements = enumeratePlacements(plan, 2)!;
    // Brute force by hand: all seat-cell permutations of size 2 with distinct
    // row/col AND a seat leftover.
    const seatCells = plan.seatCells;
    let expected = 0;
    for (const a of seatCells) {
      for (const b of seatCells) {
        if (a === b) continue;
        const ar = Math.floor(a / 3);
        const ac = a % 3;
        const br = Math.floor(b / 3);
        const bc = b % 3;
        if (ar === br || ac === bc) continue;
        const leftover = leftoverCell(plan, [a, b]);
        if (plan.cells[leftover]!.isSeat) expected++;
      }
    }
    expect(placements.length).toBe(expected);
  });

  it("returns null only when the cap is exceeded (sanity on a normal 5x5)", () => {
    // A 5x5 fully-seated grid stays well under the default cap.
    const cells: Cell[] = Array.from({ length: 25 }, (_, index) => ({
      row: Math.floor(index / 5),
      col: index % 5,
      index,
      roomId: 0,
      furnitureId: "chair",
      isSeat: true,
    }));
    const plan: FloorPlan = {
      size: 5,
      cells,
      rooms: [{ id: 0, kind: "parlour", name: "Sala", gender: "f", cellIndices: cells.map((c) => c.index) }],
      seatCells: cells.map((c) => c.index),
    };
    const placements = enumeratePlacements(plan, 4);
    expect(placements).not.toBeNull();
    expect(placements!.length).toBeGreaterThan(0);
  });
});
