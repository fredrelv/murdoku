import type { Furniture, FurnitureId, RoomKind } from "../types";

export const FURNITURE: Record<FurnitureId, Furniture> = {
  chair: { id: "chair", label: "cadeira", gender: "f", isSeat: true },
  armchair: { id: "armchair", label: "poltrona", gender: "f", isSeat: true },
  bed: { id: "bed", label: "cama", gender: "f", isSeat: true },
  stool: { id: "stool", label: "banco", gender: "m", isSeat: true },
  rug: { id: "rug", label: "tapete", gender: "m", isSeat: true },
  bench: { id: "bench", label: "banco de jardim", gender: "m", isSeat: true },
  table: { id: "table", label: "mesa", gender: "f", isSeat: false },
  stove: { id: "stove", label: "fogão", gender: "m", isSeat: false },
  bookshelf: { id: "bookshelf", label: "estante", gender: "f", isSeat: false },
  piano: { id: "piano", label: "piano", gender: "m", isSeat: false },
  plant: { id: "plant", label: "planta", gender: "f", isSeat: false },
  painting: { id: "painting", label: "quadro", gender: "m", isSeat: false },
  fireplace: { id: "fireplace", label: "lareira", gender: "f", isSeat: false },
  clock: { id: "clock", label: "relógio", gender: "m", isSeat: false },
};

export interface RoomTheme {
  kind: RoomKind;
  name: string;
  gender: "m" | "f";
  seatFurniture: FurnitureId[];
  nonSeatFurniture: FurnitureId[];
}

export const ROOM_THEMES: Record<RoomKind, RoomTheme> = {
  kitchen: {
    kind: "kitchen",
    name: "Cozinha",
    gender: "f",
    seatFurniture: ["stool", "chair"],
    nonSeatFurniture: ["stove", "table", "plant"],
  },
  library: {
    kind: "library",
    name: "Biblioteca",
    gender: "f",
    seatFurniture: ["armchair", "chair"],
    nonSeatFurniture: ["bookshelf", "clock", "painting"],
  },
  study: {
    kind: "study",
    name: "Escritório",
    gender: "m",
    seatFurniture: ["chair", "armchair"],
    nonSeatFurniture: ["table", "bookshelf", "clock"],
  },
  parlour: {
    kind: "parlour",
    name: "Sala de Estar",
    gender: "f",
    seatFurniture: ["armchair", "rug"],
    nonSeatFurniture: ["fireplace", "piano", "painting"],
  },
  bedroom: {
    kind: "bedroom",
    name: "Quarto",
    gender: "m",
    seatFurniture: ["bed", "chair"],
    nonSeatFurniture: ["table", "painting", "plant"],
  },
  hall: {
    kind: "hall",
    name: "Hall de Entrada",
    gender: "m",
    seatFurniture: ["bench", "stool"],
    nonSeatFurniture: ["clock", "plant", "painting"],
  },
  dining: {
    kind: "dining",
    name: "Sala de Jantar",
    gender: "f",
    seatFurniture: ["chair"],
    nonSeatFurniture: ["table", "fireplace", "painting"],
  },
};

export const ALL_ROOM_KINDS: RoomKind[] = [
  "kitchen",
  "library",
  "study",
  "parlour",
  "bedroom",
  "hall",
  "dining",
];
