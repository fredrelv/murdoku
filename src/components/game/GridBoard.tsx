"use client";

import type { FloorPlan, Person } from "@/engine/types";
import { FURNITURE_ICON, roomColor } from "@/lib/furnitureIcons";

interface Props {
  layout: FloorPlan;
  suspects: Person[];
  placements: Record<string, number>;
  onCellClick: (cellIndex: number) => void;
}

export function GridBoard({ layout, suspects, placements, onCellClick }: Props) {
  const occupantByCell = new Map<number, Person>();
  for (const suspect of suspects) {
    const cell = placements[suspect.id];
    if (cell !== undefined) occupantByCell.set(cell, suspect);
  }

  return (
    <div
      className="grid gap-1 rounded-xl border border-neutral-800 bg-neutral-950 p-2"
      style={{ gridTemplateColumns: `repeat(${layout.size}, minmax(0, 1fr))` }}
    >
      {layout.cells.map((cell) => {
        const occupant = occupantByCell.get(cell.index);
        return (
          <button
            key={cell.index}
            type="button"
            onClick={() => onCellClick(cell.index)}
            disabled={!cell.isSeat}
            className={`relative flex aspect-square min-w-11 flex-col items-center justify-center rounded-lg border text-xs transition ${roomColor(cell.roomId)} ${
              cell.isSeat ? "cursor-pointer hover:brightness-125" : "opacity-60"
            }`}
            title={cell.furnitureId}
          >
            <span className="text-lg leading-none">{FURNITURE_ICON[cell.furnitureId]}</span>
            {occupant && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-amber-500/90 text-sm font-bold text-neutral-950">
                {occupant.name.slice(0, 2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
