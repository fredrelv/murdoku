import { FURNITURE } from "../floorplan/furniture";
import type {
  Board,
  Cast,
  Clue,
  ClueArgs,
  ClueArgsAdjacentFurniture,
  ClueArgsBinary,
  ClueArgsDirection,
  ClueArgsUnaryFurniture,
  ClueArgsUnaryRoom,
  ClueTier,
  ClueType,
  Direction,
  FloorPlan,
  Person,
} from "../types";

export interface ClueEvalContext {
  plan: FloorPlan;
  suspects: Person[]; // parallel to board
  board: Board; // board[i] = cellIndex of suspects[i]
}

function cellOf(suspectId: string, ctx: ClueEvalContext): number {
  const i = ctx.suspects.findIndex((s) => s.id === suspectId);
  if (i === -1) throw new Error(`unknown suspect ${suspectId}`);
  return ctx.board[i]!;
}

function roomOf(cellIndex: number, plan: FloorPlan): number {
  return plan.cells[cellIndex]!.roomId;
}

function isOrthogonallyAdjacent(a: number, b: number, size: number): boolean {
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function personName(id: string, suspects: Person[]): string {
  return suspects.find((s) => s.id === id)?.name ?? id;
}

function indefiniteArticle(gender: "m" | "f"): string {
  return gender === "f" ? "uma" : "um";
}

/** "em" + article, contracted: no/na */
function inArticle(gender: "m" | "f"): string {
  return gender === "f" ? "na" : "no";
}

/** "de" + article, contracted: do/da */
function ofArticle(gender: "m" | "f"): string {
  return gender === "f" ? "da" : "do";
}

interface ClueDef<A extends ClueArgs> {
  type: ClueType;
  tier: ClueTier;
  evaluate(args: A, ctx: ClueEvalContext): boolean;
  render(args: A, suspects: Person[], plan: FloorPlan): string;
}

const SEAT_TYPE: ClueDef<ClueArgsUnaryFurniture> = {
  type: "SEAT_TYPE",
  tier: 1,
  evaluate(args, ctx) {
    const cell = cellOf(args.suspectId, ctx);
    return ctx.plan.cells[cell]!.furnitureId === args.furnitureId;
  },
  render(args, suspects) {
    const furniture = FURNITURE[args.furnitureId];
    return `${personName(args.suspectId, suspects)} estava sentado(a) em ${indefiniteArticle(furniture.gender)} ${furniture.label}.`;
  },
};

const NOT_SEAT_TYPE: ClueDef<ClueArgsUnaryFurniture> = {
  type: "NOT_SEAT_TYPE",
  tier: 1,
  evaluate(args, ctx) {
    const cell = cellOf(args.suspectId, ctx);
    return ctx.plan.cells[cell]!.furnitureId !== args.furnitureId;
  },
  render(args, suspects) {
    const furniture = FURNITURE[args.furnitureId];
    return `${personName(args.suspectId, suspects)} não estava em ${indefiniteArticle(furniture.gender)} ${furniture.label}.`;
  },
};

const IN_ROOM: ClueDef<ClueArgsUnaryRoom> = {
  type: "IN_ROOM",
  tier: 1,
  evaluate(args, ctx) {
    const cell = cellOf(args.suspectId, ctx);
    return roomOf(cell, ctx.plan) === args.roomId;
  },
  render(args, suspects, plan) {
    const room = plan.rooms.find((r) => r.id === args.roomId)!;
    return `${personName(args.suspectId, suspects)} estava ${inArticle(room.gender)} ${room.name}.`;
  },
};

const NOT_IN_ROOM: ClueDef<ClueArgsUnaryRoom> = {
  type: "NOT_IN_ROOM",
  tier: 1,
  evaluate(args, ctx) {
    const cell = cellOf(args.suspectId, ctx);
    return roomOf(cell, ctx.plan) !== args.roomId;
  },
  render(args, suspects, plan) {
    const room = plan.rooms.find((r) => r.id === args.roomId)!;
    return `${personName(args.suspectId, suspects)} não estava ${inArticle(room.gender)} ${room.name}.`;
  },
};

const ADJACENT_FURNITURE: ClueDef<ClueArgsAdjacentFurniture> = {
  type: "ADJACENT_FURNITURE",
  tier: 1,
  evaluate(args, ctx) {
    const cell = cellOf(args.suspectId, ctx);
    const landmarkCells = ctx.plan.cells.filter((c) => c.furnitureId === args.furnitureId);
    return landmarkCells.some((lc) => isOrthogonallyAdjacent(cell, lc.index, ctx.plan.size));
  },
  render(args, suspects) {
    const furniture = FURNITURE[args.furnitureId];
    return `${personName(args.suspectId, suspects)} estava ao lado ${ofArticle(furniture.gender)} ${furniture.label}.`;
  },
};

const SAME_ROOM: ClueDef<ClueArgsBinary> = {
  type: "SAME_ROOM",
  tier: 2,
  evaluate(args, ctx) {
    const a = cellOf(args.suspectAId, ctx);
    const b = cellOf(args.suspectBId, ctx);
    return roomOf(a, ctx.plan) === roomOf(b, ctx.plan);
  },
  render(args, suspects) {
    return `${personName(args.suspectAId, suspects)} e ${personName(args.suspectBId, suspects)} estavam na mesma divisão.`;
  },
};

const DIFFERENT_ROOM: ClueDef<ClueArgsBinary> = {
  type: "DIFFERENT_ROOM",
  tier: 2,
  evaluate(args, ctx) {
    const a = cellOf(args.suspectAId, ctx);
    const b = cellOf(args.suspectBId, ctx);
    return roomOf(a, ctx.plan) !== roomOf(b, ctx.plan);
  },
  render(args, suspects) {
    return `${personName(args.suspectAId, suspects)} e ${personName(args.suspectBId, suspects)} não estavam na mesma divisão.`;
  },
};

const ADJACENT_PERSON: ClueDef<ClueArgsBinary> = {
  type: "ADJACENT_PERSON",
  tier: 2,
  evaluate(args, ctx) {
    const a = cellOf(args.suspectAId, ctx);
    const b = cellOf(args.suspectBId, ctx);
    return isOrthogonallyAdjacent(a, b, ctx.plan.size);
  },
  render(args, suspects) {
    return `${personName(args.suspectAId, suspects)} estava sentado(a) ao lado de ${personName(args.suspectBId, suspects)}.`;
  },
};

const NOT_ADJACENT_PERSON: ClueDef<ClueArgsBinary> = {
  type: "NOT_ADJACENT_PERSON",
  tier: 2,
  evaluate(args, ctx) {
    const a = cellOf(args.suspectAId, ctx);
    const b = cellOf(args.suspectBId, ctx);
    return !isOrthogonallyAdjacent(a, b, ctx.plan.size);
  },
  render(args, suspects) {
    return `${personName(args.suspectAId, suspects)} não estava perto de ${personName(args.suspectBId, suspects)}.`;
  },
};

function directionHolds(a: number, b: number, size: number, dir: Direction): boolean {
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;
  switch (dir) {
    case "north":
      return ar < br;
    case "south":
      return ar > br;
    case "west":
      return ac < bc;
    case "east":
      return ac > bc;
  }
}

const DIRECTION_LABEL: Record<Direction, string> = {
  north: "a norte de",
  south: "a sul de",
  east: "a este de",
  west: "a oeste de",
};

const DIRECTION: ClueDef<ClueArgsDirection> = {
  type: "DIRECTION",
  tier: 2,
  evaluate(args, ctx) {
    const a = cellOf(args.suspectAId, ctx);
    const b = cellOf(args.suspectBId, ctx);
    return directionHolds(a, b, ctx.plan.size, args.direction);
  },
  render(args, suspects) {
    return `${personName(args.suspectAId, suspects)} estava ${DIRECTION_LABEL[args.direction]} ${personName(args.suspectBId, suspects)}.`;
  },
};

export const CLUE_DEFS = {
  SEAT_TYPE,
  NOT_SEAT_TYPE,
  IN_ROOM,
  NOT_IN_ROOM,
  ADJACENT_FURNITURE,
  SAME_ROOM,
  DIFFERENT_ROOM,
  ADJACENT_PERSON,
  NOT_ADJACENT_PERSON,
  DIRECTION,
} as const;

export function evaluateClue(clue: Clue, ctx: ClueEvalContext): boolean {
  const def = CLUE_DEFS[clue.type] as ClueDef<ClueArgs>;
  return def.evaluate(clue.args, ctx);
}

export { cellOf, roomOf, isOrthogonallyAdjacent, personName, directionHolds, inArticle, ofArticle };
export type { Cast };
