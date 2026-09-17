interface RoomVisual {
  bg: string;
  border: string;
  icon: string;
  label: string;
}

const ROOM_VISUALS: RoomVisual[] = [
  { bg: "bg-gradient-to-br from-rose-950 to-rose-900/60", border: "border-rose-700/70", icon: "text-rose-300/80", label: "text-rose-300/90" },
  { bg: "bg-gradient-to-br from-sky-950 to-sky-900/60", border: "border-sky-700/70", icon: "text-sky-300/80", label: "text-sky-300/90" },
  { bg: "bg-gradient-to-br from-emerald-950 to-emerald-900/60", border: "border-emerald-700/70", icon: "text-emerald-300/80", label: "text-emerald-300/90" },
  { bg: "bg-gradient-to-br from-violet-950 to-violet-900/60", border: "border-violet-700/70", icon: "text-violet-300/80", label: "text-violet-300/90" },
  { bg: "bg-gradient-to-br from-amber-950 to-amber-900/60", border: "border-amber-700/70", icon: "text-amber-300/80", label: "text-amber-300/90" },
  { bg: "bg-gradient-to-br from-teal-950 to-teal-900/60", border: "border-teal-700/70", icon: "text-teal-300/80", label: "text-teal-300/90" },
  { bg: "bg-gradient-to-br from-fuchsia-950 to-fuchsia-900/60", border: "border-fuchsia-700/70", icon: "text-fuchsia-300/80", label: "text-fuchsia-300/90" },
];

export function roomVisual(roomId: number): RoomVisual {
  return ROOM_VISUALS[roomId % ROOM_VISUALS.length]!;
}

const SUSPECT_TOKEN_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export function suspectTokenColor(index: number): string {
  return SUSPECT_TOKEN_COLORS[index % SUSPECT_TOKEN_COLORS.length]!;
}
