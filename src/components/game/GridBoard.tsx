"use client";

import type { FloorPlan, Person } from "@/engine/types";
import { roomVisual, suspectTokenColor } from "@/lib/furnitureIcons";
import { FurnitureIcon } from "./FurnitureIcon";

interface Placement {
  cell: number;
  confirmed: boolean;
}

interface Props {
  layout: FloorPlan;
  suspects: Person[];
  placements: Record<string, Placement>;
  blockedCells: Set<number>;
  autoBlockedCells: Set<number>;
  onCellClick: (cellIndex: number) => void;
}

const WALL = "3px solid #1c1917"; // stone-900: reads as a room partition
const NO_WALL = "1px solid transparent";

/** Only draws a wall between two cells when they belong to different rooms — this is what makes procedurally-shaped rooms read as a connected floor plan instead of a flat grid of tiles. */
function wallStyle(layout: FloorPlan, cell: { row: number; col: number; roomId: number }) {
  const { size, cells } = layout;
  const neighbourRoom = (row: number, col: number) =>
    row < 0 || row >= size || col < 0 || col >= size ? null : cells[row * size + col]!.roomId;

  return {
    borderTop: neighbourRoom(cell.row - 1, cell.col) === cell.roomId ? NO_WALL : WALL,
    borderBottom: neighbourRoom(cell.row + 1, cell.col) === cell.roomId ? NO_WALL : WALL,
    borderLeft: neighbourRoom(cell.row, cell.col - 1) === cell.roomId ? NO_WALL : WALL,
    borderRight: neighbourRoom(cell.row, cell.col + 1) === cell.roomId ? NO_WALL : WALL,
  };
}

export function GridBoard({ layout, suspects, placements, blockedCells, autoBlockedCells, onCellClick }: Props) {
  const occupantByCell = new Map<number, { person: Person; index: number; confirmed: boolean }>();
  suspects.forEach((person, index) => {
    const p = placements[person.id];
    if (p) occupantByCell.set(p.cell, { person, index, confirmed: p.confirmed });
  });

  const roomLabelCell = new Map<number, number>(); // roomId -> first (top-left-most) cell index
  for (const room of layout.rooms) {
    const first = room.cellIndices.reduce((a, b) => (a < b ? a : b));
    roomLabelCell.set(room.id, first);
  }

  return (
    <div
      className="grid overflow-hidden rounded-2xl p-1 shadow-[0_0_0_6px_rgba(0,0,0,0.4),0_0_0_8px_rgba(180,140,80,0.35)]"
      style={{ gridTemplateColumns: `repeat(${layout.size}, minmax(0, 1fr))`, background: "#0c0a09" }}
    >
      {layout.cells.map((cell) => {
        const occupant = occupantByCell.get(cell.index);
        const visual = roomVisual(cell.roomId);
        const isManuallyBlocked = blockedCells.has(cell.index);
        const isAutoBlocked = !isManuallyBlocked && cell.isSeat && autoBlockedCells.has(cell.index);
        const room = layout.rooms.find((r) => r.id === cell.roomId)!;
        const showLabel = roomLabelCell.get(cell.roomId) === cell.index;

        return (
          <button
            key={cell.index}
            type="button"
            onClick={() => onCellClick(cell.index)}
            disabled={!cell.isSeat}
            style={wallStyle(layout, cell)}
            className={`relative flex aspect-square min-w-10 flex-col items-center justify-center text-xs transition ${visual.bg} ${
              cell.isSeat ? "cursor-pointer hover:brightness-125" : "opacity-70"
            }`}
            title={cell.furnitureId}
          >
            {showLabel && (
              <span className={`pointer-events-none absolute left-1 top-0.5 text-[8px] font-semibold uppercase tracking-wide ${visual.label}`}>
                {room.name}
              </span>
            )}

            <FurnitureIcon id={cell.furnitureId} className={`h-5 w-5 ${visual.icon}`} />

            {!occupant && (isManuallyBlocked || isAutoBlocked) && (
              <svg
                viewBox="0 0 24 24"
                className={`absolute inset-0 m-auto h-6 w-6 ${isManuallyBlocked ? "text-red-500/90" : "text-neutral-400/50"}`}
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            )}

            {occupant && (
              <span
                className={`absolute inset-1 flex items-center justify-center rounded-full text-sm font-bold text-white shadow-lg ${suspectTokenColor(occupant.index)} ${
                  occupant.confirmed ? "border-2 border-white/80" : "border-2 border-dashed border-white/70 opacity-70"
                }`}
                title={occupant.confirmed ? "Confirmado" : "Hipótese"}
              >
                {occupant.person.name.slice(0, 2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
