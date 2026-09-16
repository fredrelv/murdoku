import type { Rng } from "../rng";
import { FURNITURE } from "../floorplan/furniture";
import type { Cast, Clue, Direction, FloorPlan, FurnitureId } from "../types";
import { CLUE_DEFS, type ClueEvalContext } from "./registry";

function makeClue<T extends keyof typeof CLUE_DEFS>(
  type: T,
  args: Parameters<(typeof CLUE_DEFS)[T]["evaluate"]>[0],
  suspects: Cast["suspects"],
  plan: FloorPlan,
  counter: { n: number },
): Clue {
  const def = CLUE_DEFS[type];
  counter.n += 1;
  return {
    id: `clue-${counter.n}`,
    type,
    tier: def.tier,
    args,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text: (def.render as any)(args, suspects, plan),
  };
}

const NEG_SAMPLES_PER_SUSPECT = 2;

/**
 * Builds the pool of candidate true clues about `ctx`'s solution. Every
 * returned clue evaluates true against the solution and never references
 * the victim (only ctx.suspects are ever used as clue subjects).
 */
export function buildCluePool(
  rng: Rng,
  plan: FloorPlan,
  cast: Cast,
  ctx: ClueEvalContext,
): Clue[] {
  const clues: Clue[] = [];
  const { suspects } = cast;
  const allFurnitureIds = Object.keys(FURNITURE) as FurnitureId[];
  const landmarkIds = allFurnitureIds.filter((f) => !FURNITURE[f].isSeat);
  const counter = { n: 0 }; // per-call, not module-global, so seeded generation is reproducible

  for (const suspect of suspects) {
    const cellIndex = ctx.board[ctx.suspects.findIndex((s) => s.id === suspect.id)]!;
    const cell = plan.cells[cellIndex]!;

    clues.push(makeClue("SEAT_TYPE", { suspectId: suspect.id, furnitureId: cell.furnitureId }, suspects, plan, counter));

    const otherSeatFurniture = allFurnitureIds.filter(
      (f) => FURNITURE[f].isSeat && f !== cell.furnitureId,
    );
    for (const f of rng.shuffle(otherSeatFurniture).slice(0, NEG_SAMPLES_PER_SUSPECT)) {
      clues.push(makeClue("NOT_SEAT_TYPE", { suspectId: suspect.id, furnitureId: f }, suspects, plan, counter));
    }

    clues.push(makeClue("IN_ROOM", { suspectId: suspect.id, roomId: cell.roomId }, suspects, plan, counter));

    const otherRooms = plan.rooms.filter((r) => r.id !== cell.roomId);
    for (const r of rng.shuffle(otherRooms).slice(0, NEG_SAMPLES_PER_SUSPECT)) {
      clues.push(makeClue("NOT_IN_ROOM", { suspectId: suspect.id, roomId: r.id }, suspects, plan, counter));
    }

    for (const landmarkId of landmarkIds) {
      const test = CLUE_DEFS.ADJACENT_FURNITURE.evaluate({ suspectId: suspect.id, furnitureId: landmarkId }, ctx);
      if (test) {
        clues.push(makeClue("ADJACENT_FURNITURE", { suspectId: suspect.id, furnitureId: landmarkId }, suspects, plan, counter));
      }
    }
  }

  for (let i = 0; i < suspects.length; i++) {
    for (let j = i + 1; j < suspects.length; j++) {
      const a = suspects[i]!;
      const b = suspects[j]!;

      const sameRoom = CLUE_DEFS.SAME_ROOM.evaluate({ suspectAId: a.id, suspectBId: b.id }, ctx);
      if (sameRoom) {
        clues.push(makeClue("SAME_ROOM", { suspectAId: a.id, suspectBId: b.id }, suspects, plan, counter));
      } else {
        clues.push(makeClue("DIFFERENT_ROOM", { suspectAId: a.id, suspectBId: b.id }, suspects, plan, counter));
      }

      const adjacent = CLUE_DEFS.ADJACENT_PERSON.evaluate({ suspectAId: a.id, suspectBId: b.id }, ctx);
      if (adjacent) {
        clues.push(makeClue("ADJACENT_PERSON", { suspectAId: a.id, suspectBId: b.id }, suspects, plan, counter));
      } else {
        clues.push(makeClue("NOT_ADJACENT_PERSON", { suspectAId: a.id, suspectBId: b.id }, suspects, plan, counter));
      }

      const cellA = ctx.board[i]!;
      const cellB = ctx.board[j]!;
      const rowDir: Direction =
        Math.floor(cellA / plan.size) < Math.floor(cellB / plan.size) ? "north" : "south";
      clues.push(
        makeClue("DIRECTION", { suspectAId: a.id, suspectBId: b.id, direction: rowDir }, suspects, plan, counter),
      );
      const colDir: Direction = cellA % plan.size < cellB % plan.size ? "west" : "east";
      clues.push(
        makeClue("DIRECTION", { suspectAId: a.id, suspectBId: b.id, direction: colDir }, suspects, plan, counter),
      );
    }
  }

  return clues;
}
