import { directionHolds, isOrthogonallyAdjacent, roomOf } from "../clues/registry";
import type {
  Cast,
  Clue,
  ClueArgsAdjacentFurniture,
  ClueArgsBinary,
  ClueArgsDirection,
  ClueArgsUnaryFurniture,
  ClueArgsUnaryRoom,
  ClueTier,
  DeductionStep,
  FloorPlan,
  Person,
  SolveVerdict,
} from "../types";

type Domain = boolean[]; // length size*size

function suspectIndex(suspects: Person[], id: string): number {
  const i = suspects.findIndex((s) => s.id === id);
  if (i === -1) throw new Error(`unknown suspect ${id}`);
  return i;
}

function domainCells(domain: Domain): number[] {
  const out: number[] = [];
  for (let i = 0; i < domain.length; i++) if (domain[i]) out.push(i);
  return out;
}

function removeCell(domain: Domain, cell: number, removed: number[]): boolean {
  if (domain[cell]) {
    domain[cell] = false;
    removed.push(cell);
    return true;
  }
  return false;
}

/**
 * Human-style constraint propagation. Never uses the enumerated placement
 * list (that would be "solving by exhaustive search", not by deduction) —
 * this is the fairness gate: a case only ships if a player could reach the
 * solution through these rules alone.
 */
export function solveDeductively(
  plan: FloorPlan,
  cast: Cast,
  clues: Clue[],
  opts: { maxTier: ClueTier } = { maxTier: 2 },
): SolveVerdict {
  const { suspects } = cast;
  const size = plan.size;
  const cellCount = size * size;
  const trace: DeductionStep[] = [];
  let maxTierUsed: ClueTier | 0 = 0;

  const domains: Domain[] = suspects.map(() => plan.cells.map((c) => c.isSeat));

  // --- Unary clue restrictions (tier 1), applied once up front. ---
  for (const clue of clues) {
    if (clue.type === "SEAT_TYPE") {
      const args = clue.args as ClueArgsUnaryFurniture;
      const idx = suspectIndex(suspects, args.suspectId);
      const removed: number[] = [];
      for (let cell = 0; cell < cellCount; cell++) {
        if (domains[idx]![cell] && plan.cells[cell]!.furnitureId !== args.furnitureId) {
          removeCell(domains[idx]!, cell, removed);
        }
      }
      if (removed.length) {
        trace.push({ ruleId: "R2_UnaryClue", clueIds: [clue.id], suspectId: args.suspectId, eliminatedCells: removed, narrative: clue.text });
      }
    } else if (clue.type === "NOT_SEAT_TYPE") {
      const args = clue.args as ClueArgsUnaryFurniture;
      const idx = suspectIndex(suspects, args.suspectId);
      const removed: number[] = [];
      for (const cell of domainCells(domains[idx]!)) {
        if (plan.cells[cell]!.furnitureId === args.furnitureId) removeCell(domains[idx]!, cell, removed);
      }
      if (removed.length) {
        trace.push({ ruleId: "R2_UnaryClue", clueIds: [clue.id], suspectId: args.suspectId, eliminatedCells: removed, narrative: clue.text });
      }
    } else if (clue.type === "IN_ROOM") {
      const args = clue.args as ClueArgsUnaryRoom;
      const idx = suspectIndex(suspects, args.suspectId);
      const removed: number[] = [];
      for (const cell of domainCells(domains[idx]!)) {
        if (roomOf(cell, plan) !== args.roomId) removeCell(domains[idx]!, cell, removed);
      }
      if (removed.length) {
        trace.push({ ruleId: "R2_UnaryClue", clueIds: [clue.id], suspectId: args.suspectId, eliminatedCells: removed, narrative: clue.text });
      }
    } else if (clue.type === "NOT_IN_ROOM") {
      const args = clue.args as ClueArgsUnaryRoom;
      const idx = suspectIndex(suspects, args.suspectId);
      const removed: number[] = [];
      for (const cell of domainCells(domains[idx]!)) {
        if (roomOf(cell, plan) === args.roomId) removeCell(domains[idx]!, cell, removed);
      }
      if (removed.length) {
        trace.push({ ruleId: "R2_UnaryClue", clueIds: [clue.id], suspectId: args.suspectId, eliminatedCells: removed, narrative: clue.text });
      }
    } else if (clue.type === "ADJACENT_FURNITURE") {
      const args = clue.args as ClueArgsAdjacentFurniture;
      const idx = suspectIndex(suspects, args.suspectId);
      const landmarks = plan.cells.filter((c) => c.furnitureId === args.furnitureId).map((c) => c.index);
      const removed: number[] = [];
      for (const cell of domainCells(domains[idx]!)) {
        if (!landmarks.some((lc) => isOrthogonallyAdjacent(cell, lc, size))) {
          removeCell(domains[idx]!, cell, removed);
        }
      }
      if (removed.length) {
        trace.push({ ruleId: "R2_UnaryClue", clueIds: [clue.id], suspectId: args.suspectId, eliminatedCells: removed, narrative: clue.text });
      }
    }
  }

  const binaryClues = clues.filter((c) =>
    ["SAME_ROOM", "DIFFERENT_ROOM", "ADJACENT_PERSON", "NOT_ADJACENT_PERSON", "DIRECTION"].includes(c.type),
  );

  function binaryHolds(clue: Clue, cellA: number, cellB: number): boolean {
    switch (clue.type) {
      case "SAME_ROOM":
        return roomOf(cellA, plan) === roomOf(cellB, plan);
      case "DIFFERENT_ROOM":
        return roomOf(cellA, plan) !== roomOf(cellB, plan);
      case "ADJACENT_PERSON":
        return isOrthogonallyAdjacent(cellA, cellB, size);
      case "NOT_ADJACENT_PERSON":
        return !isOrthogonallyAdjacent(cellA, cellB, size);
      case "DIRECTION":
        return directionHolds(cellA, cellB, size, (clue.args as ClueArgsDirection).direction);
      default:
        return true;
    }
  }

  let changed = true;
  let guard = 10_000;
  while (changed && guard-- > 0) {
    changed = false;

    // R4/R3: naked singles propagate row/col/cell exclusion to everyone else.
    for (let i = 0; i < suspects.length; i++) {
      const cells = domainCells(domains[i]!);
      if (cells.length !== 1) continue;
      const placedCell = cells[0]!;
      const row = Math.floor(placedCell / size);
      const col = placedCell % size;
      for (let j = 0; j < suspects.length; j++) {
        if (j === i) continue;
        const removed: number[] = [];
        for (const cell of domainCells(domains[j]!)) {
          const r = Math.floor(cell / size);
          const c = cell % size;
          if (r === row || c === col) removeCell(domains[j]!, cell, removed);
        }
        if (removed.length) {
          changed = true;
          trace.push({
            ruleId: "R3_Placed",
            clueIds: [],
            suspectId: suspects[j]!.id,
            eliminatedCells: removed,
            narrative: `${suspects[i]!.name} ocupa a linha/coluna, eliminando essas casas para ${suspects[j]!.name}.`,
          });
        }
      }
    }

    // R5: line lock — if a suspect's whole domain sits in one row (or column),
    // no one else can use that row (or column).
    for (let i = 0; i < suspects.length; i++) {
      const cells = domainCells(domains[i]!);
      if (cells.length <= 1) continue;
      const rows = new Set(cells.map((c) => Math.floor(c / size)));
      const cols = new Set(cells.map((c) => c % size));
      if (rows.size === 1) {
        const row = [...rows][0]!;
        for (let j = 0; j < suspects.length; j++) {
          if (j === i) continue;
          const removed: number[] = [];
          for (const cell of domainCells(domains[j]!)) {
            if (Math.floor(cell / size) === row) removeCell(domains[j]!, cell, removed);
          }
          if (removed.length) {
            changed = true;
            trace.push({
              ruleId: "R5_LineLock",
              clueIds: [],
              suspectId: suspects[j]!.id,
              eliminatedCells: removed,
              narrative: `Apenas ${suspects[i]!.name} pode estar nessa linha, eliminando-a para ${suspects[j]!.name}.`,
            });
          }
        }
      }
      if (cols.size === 1) {
        const col = [...cols][0]!;
        for (let j = 0; j < suspects.length; j++) {
          if (j === i) continue;
          const removed: number[] = [];
          for (const cell of domainCells(domains[j]!)) {
            if (cell % size === col) removeCell(domains[j]!, cell, removed);
          }
          if (removed.length) {
            changed = true;
            trace.push({
              ruleId: "R5_LineLock",
              clueIds: [],
              suspectId: suspects[j]!.id,
              eliminatedCells: removed,
              narrative: `Apenas ${suspects[i]!.name} pode estar nessa coluna, eliminando-a para ${suspects[j]!.name}.`,
            });
          }
        }
      }
    }

    // R7: arc consistency over binary clues (tier 2).
    if (opts.maxTier >= 2) {
      for (const clue of binaryClues) {
        const args = clue.args as ClueArgsBinary;
        const idxA = suspectIndex(suspects, args.suspectAId);
        const idxB = suspectIndex(suspects, args.suspectBId);

        const removedA: number[] = [];
        for (const cellA of domainCells(domains[idxA]!)) {
          const hasSupport = domainCells(domains[idxB]!).some((cellB) => binaryHolds(clue, cellA, cellB));
          if (!hasSupport) removeCell(domains[idxA]!, cellA, removedA);
        }
        if (removedA.length) {
          changed = true;
          maxTierUsed = 2;
          trace.push({ ruleId: "R7_ArcConsistency", clueIds: [clue.id], suspectId: args.suspectAId, eliminatedCells: removedA, narrative: clue.text });
        }

        const removedB: number[] = [];
        for (const cellB of domainCells(domains[idxB]!)) {
          const hasSupport = domainCells(domains[idxA]!).some((cellA) => binaryHolds(clue, cellA, cellB));
          if (!hasSupport) removeCell(domains[idxB]!, cellB, removedB);
        }
        if (removedB.length) {
          changed = true;
          maxTierUsed = 2;
          trace.push({ ruleId: "R7_ArcConsistency", clueIds: [clue.id], suspectId: args.suspectBId, eliminatedCells: removedB, narrative: clue.text });
        }
      }
    }
  }

  const allSingleton = domains.every((d) => domainCells(d).length === 1);
  if (!allSingleton) {
    return { solved: false, trace, maxTierUsed, steps: trace.length };
  }

  if (maxTierUsed === 0 && trace.length > 0) maxTierUsed = 1;

  const board = domains.map((d) => domainCells(d)[0]!);
  return { solved: true, trace, maxTierUsed, steps: trace.length, board };
}
