import type { FurnitureId } from "@/engine/types";

export const FURNITURE_ICON: Record<FurnitureId, string> = {
  chair: "🪑",
  armchair: "🛋️",
  bed: "🛏️",
  stool: "🪑",
  rug: "🟫",
  bench: "💺",
  table: "🍽️",
  stove: "🍳",
  bookshelf: "📚",
  piano: "🎹",
  plant: "🪴",
  painting: "🖼️",
  fireplace: "🔥",
  clock: "🕐",
};

const ROOM_COLORS = [
  "bg-rose-950/40 border-rose-800/60",
  "bg-sky-950/40 border-sky-800/60",
  "bg-emerald-950/40 border-emerald-800/60",
  "bg-violet-950/40 border-violet-800/60",
  "bg-amber-950/40 border-amber-800/60",
  "bg-teal-950/40 border-teal-800/60",
  "bg-fuchsia-950/40 border-fuchsia-800/60",
];

export function roomColor(roomId: number): string {
  return ROOM_COLORS[roomId % ROOM_COLORS.length]!;
}
