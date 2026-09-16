import type { Rng } from "../rng";
import type { Cell, CellIndex, FloorPlan, FurnitureId, Room } from "../types";
import { ALL_ROOM_KINDS, FURNITURE, ROOM_THEMES } from "./furniture";

const MAX_FURNISH_RETRIES = 20;

function neighbours(index: CellIndex, size: number): CellIndex[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const out: CellIndex[] = [];
  if (row > 0) out.push(index - size);
  if (row < size - 1) out.push(index + size);
  if (col > 0) out.push(index - 1);
  if (col < size - 1) out.push(index + 1);
  return out;
}

function partitionIntoRooms(rng: Rng, size: number, roomCount: number): number[] | null {
  const total = size * size;
  const owner = new Array<number>(total).fill(-1);

  // Pick seed cells with some spread so rooms aren't degenerate slivers.
  const allCells = Array.from({ length: total }, (_, i) => i);
  const shuffled = rng.shuffle(allCells);
  const seeds: CellIndex[] = [];
  for (const cell of shuffled) {
    if (seeds.length >= roomCount) break;
    const row = Math.floor(cell / size);
    const col = cell % size;
    const farEnough = seeds.every((s) => {
      const sr = Math.floor(s / size);
      const sc = s % size;
      return Math.abs(sr - row) + Math.abs(sc - col) >= 2;
    });
    if (farEnough || seeds.length === 0) seeds.push(cell);
  }
  while (seeds.length < roomCount) {
    const candidate = rng.pick(shuffled);
    if (!seeds.includes(candidate)) seeds.push(candidate);
  }
  seeds.forEach((cell, roomId) => {
    owner[cell] = roomId;
  });

  // Region growing: repeatedly expand a random room into a free neighbour.
  const frontier = seeds.slice();
  let guard = total * 10;
  while (frontier.length > 0 && guard-- > 0) {
    const idx = rng.int(frontier.length);
    const cell = frontier[idx] as CellIndex;
    const roomId = owner[cell] as number;
    const free = neighbours(cell, size).filter((n) => owner[n] === -1);
    if (free.length === 0) {
      frontier.splice(idx, 1);
      continue;
    }
    const next = rng.pick(free);
    owner[next] = roomId;
    frontier.push(next);
  }

  if (owner.some((r) => r === -1)) return null; // disconnected leftovers, retry
  return owner;
}

function buildRooms(owner: number[], size: number, roomCount: number, rng: Rng): Room[] {
  const kinds = rng.shuffle(ALL_ROOM_KINDS).slice(0, roomCount);
  const rooms: Room[] = kinds.map((kind, id) => ({
    id,
    kind,
    name: ROOM_THEMES[kind].name,
    gender: ROOM_THEMES[kind].gender,
    cellIndices: [],
  }));
  owner.forEach((roomId, cellIndex) => {
    rooms[roomId]!.cellIndices.push(cellIndex);
  });
  return rooms;
}

function furnishRoom(rng: Rng, room: Room): Map<CellIndex, FurnitureId> {
  const theme = ROOM_THEMES[room.kind];
  const furniture = new Map<CellIndex, FurnitureId>();
  const seatTargetCount = Math.max(1, Math.round(room.cellIndices.length * 0.45));
  const shuffledCells = rng.shuffle(room.cellIndices);

  shuffledCells.forEach((cell, i) => {
    if (i < seatTargetCount) {
      furniture.set(cell, rng.pick(theme.seatFurniture));
    } else {
      furniture.set(cell, rng.pick(theme.nonSeatFurniture));
    }
  });

  // Guarantee at least one non-seat "landmark" per room so ADJACENT_FURNITURE
  // clues have somewhere to anchor.
  if (![...furniture.values()].some((f) => !FURNITURE[f].isSeat)) {
    const cell = shuffledCells[0]!;
    furniture.set(cell, rng.pick(theme.nonSeatFurniture));
  }
  return furniture;
}

/**
 * Generates a random floor plan with `roomCount` connected rooms, furnished
 * so that every row and every column contains at least one seat cell
 * (a necessary condition for any valid board to exist).
 */
export function generateFloorPlan(rng: Rng, size: number): FloorPlan | null {
  const roomCount = Math.min(7, Math.max(3, Math.round((size * size) / 4)));

  for (let attempt = 0; attempt < MAX_FURNISH_RETRIES; attempt++) {
    const owner = partitionIntoRooms(rng, size, roomCount);
    if (!owner) continue;

    const rooms = buildRooms(owner, size, roomCount, rng);
    if (rooms.some((r) => r.cellIndices.length < 2)) continue;

    const furnitureByCell = new Map<CellIndex, FurnitureId>();
    for (const room of rooms) {
      const furnished = furnishRoom(rng, room);
      for (const [cell, f] of furnished) furnitureByCell.set(cell, f);
    }

    const cells: Cell[] = [];
    for (let index = 0; index < size * size; index++) {
      const furnitureId = furnitureByCell.get(index);
      if (!furnitureId) {
        cells.length = 0;
        break;
      }
      cells.push({
        row: Math.floor(index / size),
        col: index % size,
        index,
        roomId: owner[index] as number,
        furnitureId,
        isSeat: FURNITURE[furnitureId].isSeat,
      });
    }
    if (cells.length !== size * size) continue;

    // Every row and column needs >= 1 seat cell, otherwise no valid board exists.
    const rowHasSeat = new Array(size).fill(false);
    const colHasSeat = new Array(size).fill(false);
    for (const cell of cells) {
      if (cell.isSeat) {
        rowHasSeat[cell.row] = true;
        colHasSeat[cell.col] = true;
      }
    }
    if (rowHasSeat.some((v) => !v) || colHasSeat.some((v) => !v)) continue;

    const seatCells = cells.filter((c) => c.isSeat).map((c) => c.index);

    return { size, cells, rooms, seatCells };
  }

  return null;
}
