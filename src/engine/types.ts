/**
 * Core types for the Murdoku puzzle engine.
 *
 * Grid is N x N. There are N-1 suspects and 1 victim. A solution places every
 * suspect in a distinct row and column (Sudoku-style); the one row/column left
 * empty intersects at the victim's cell. The murderer is the suspect who ends
 * up alone with the victim in the victim's room.
 */

export type CellIndex = number; // row * size + col

export type RoomKind =
  | "kitchen"
  | "library"
  | "study"
  | "parlour"
  | "bedroom"
  | "hall"
  | "dining";

export type FurnitureId =
  | "chair"
  | "armchair"
  | "bed"
  | "stool"
  | "rug"
  | "bench"
  | "table"
  | "stove"
  | "bookshelf"
  | "piano"
  | "plant"
  | "painting"
  | "fireplace"
  | "clock";

export interface Furniture {
  id: FurnitureId;
  label: string;
  gender: "m" | "f";
  isSeat: boolean;
}

export interface Cell {
  row: number;
  col: number;
  index: CellIndex;
  roomId: number;
  furnitureId: FurnitureId;
  isSeat: boolean;
}

export interface Room {
  id: number;
  kind: RoomKind;
  name: string;
  gender: "m" | "f";
  cellIndices: CellIndex[];
}

export interface FloorPlan {
  size: number;
  cells: Cell[]; // length size*size, indexed by CellIndex
  rooms: Room[];
  seatCells: CellIndex[];
}

export interface Person {
  id: string;
  name: string;
  avatarKey: string;
}

/** board[suspectIndex] = cellIndex. Length = suspects.length (size - 1). */
export type Board = number[];

export interface Cast {
  suspects: Person[];
  victim: Person;
}

export type ClueType =
  | "SEAT_TYPE"
  | "NOT_SEAT_TYPE"
  | "IN_ROOM"
  | "NOT_IN_ROOM"
  | "ADJACENT_FURNITURE"
  | "SAME_ROOM"
  | "DIFFERENT_ROOM"
  | "ADJACENT_PERSON"
  | "NOT_ADJACENT_PERSON"
  | "DIRECTION";

export type ClueTier = 1 | 2;

export type Direction = "north" | "south" | "east" | "west";

export interface ClueArgsUnaryFurniture {
  suspectId: string;
  furnitureId: FurnitureId;
}
export interface ClueArgsUnaryRoom {
  suspectId: string;
  roomId: number;
}
export interface ClueArgsAdjacentFurniture {
  suspectId: string;
  furnitureId: FurnitureId;
}
export interface ClueArgsBinary {
  suspectAId: string;
  suspectBId: string;
}
export interface ClueArgsDirection {
  suspectAId: string;
  suspectBId: string;
  direction: Direction;
}

export type ClueArgs =
  | ClueArgsUnaryFurniture
  | ClueArgsUnaryRoom
  | ClueArgsAdjacentFurniture
  | ClueArgsBinary
  | ClueArgsDirection;

export interface Clue {
  id: string;
  type: ClueType;
  tier: ClueTier;
  args: ClueArgs;
  text: string;
}

export interface DeductionStep {
  ruleId: string;
  clueIds: string[];
  suspectId?: string;
  eliminatedCells: CellIndex[];
  narrative: string;
}

export interface SolveVerdict {
  solved: boolean;
  trace: DeductionStep[];
  maxTierUsed: ClueTier | 0;
  steps: number;
  board?: Board; // present when solved: the deduced placement, parallel to suspects
}

export interface GeneratedCase {
  plan: FloorPlan;
  cast: Cast;
  board: Board; // solution placements, parallel to cast.suspects
  victimCell: CellIndex;
  murdererId: string;
  clues: Clue[];
  difficulty: "EASY" | "MEDIUM";
  difficultyScore: number;
  trace: DeductionStep[];
  seed: string;
  title: string;
}

export interface GenerateOptions {
  size?: number; // default 5
  difficulty?: "EASY" | "MEDIUM";
  seed?: string;
  maxPlanAttempts?: number;
  clueRestarts?: number;
}
