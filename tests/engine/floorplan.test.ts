import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/rng";
import { generateFloorPlan } from "@/engine/floorplan/generateFloorPlan";
import { FURNITURE } from "@/engine/floorplan/furniture";

function isConnected(cellIndices: number[], size: number): boolean {
  const set = new Set(cellIndices);
  const start = cellIndices[0]!;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    const row = Math.floor(cur / size);
    const col = cur % size;
    const neighbours = [cur - size, cur + size, cur - 1, cur + 1].filter((n) => {
      if (!set.has(n)) return false;
      const nr = Math.floor(n / size);
      const nc = n % size;
      return Math.abs(nr - row) + Math.abs(nc - col) === 1;
    });
    for (const n of neighbours) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size === cellIndices.length;
}

describe("generateFloorPlan", () => {
  it("is deterministic for a given seed", () => {
    const planA = generateFloorPlan(createRng("plan-seed"), 5);
    const planB = generateFloorPlan(createRng("plan-seed"), 5);
    expect(planA).not.toBeNull();
    expect(planA).toEqual(planB);
  });

  it("covers every cell exactly once across rooms", () => {
    const plan = generateFloorPlan(createRng("coverage"), 5)!;
    expect(plan.cells).toHaveLength(25);
    const covered = new Set(plan.rooms.flatMap((r) => r.cellIndices));
    expect(covered.size).toBe(25);
  });

  it("produces only connected rooms", () => {
    const plan = generateFloorPlan(createRng("connected"), 5)!;
    for (const room of plan.rooms) {
      expect(isConnected(room.cellIndices, plan.size)).toBe(true);
    }
  });

  it("guarantees at least one seat cell per row and per column", () => {
    for (let s = 0; s < 15; s++) {
      const plan = generateFloorPlan(createRng(`row-col-${s}`), 5)!;
      expect(plan).not.toBeNull();
      const rowHasSeat = new Array(5).fill(false);
      const colHasSeat = new Array(5).fill(false);
      for (const cell of plan.cells) {
        if (cell.isSeat) {
          rowHasSeat[cell.row] = true;
          colHasSeat[cell.col] = true;
        }
      }
      expect(rowHasSeat.every(Boolean)).toBe(true);
      expect(colHasSeat.every(Boolean)).toBe(true);
    }
  });

  it("every cell's furniture isSeat flag matches the furniture catalog", () => {
    const plan = generateFloorPlan(createRng("furniture-consistency"), 5)!;
    for (const cell of plan.cells) {
      expect(cell.isSeat).toBe(FURNITURE[cell.furnitureId].isSeat);
    }
  });
});
