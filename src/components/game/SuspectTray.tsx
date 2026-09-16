"use client";

import type { Person } from "@/engine/types";

interface Props {
  suspects: Person[];
  placements: Record<string, number>;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function SuspectTray({ suspects, placements, activeId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {suspects.map((s) => {
        const placed = placements[s.id] !== undefined;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "border-amber-400 bg-amber-500 text-neutral-950"
                : placed
                  ? "border-emerald-700 bg-emerald-950/50 text-emerald-300"
                  : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-amber-500"
            }`}
          >
            {s.name}
            {placed && !active && " ✓"}
          </button>
        );
      })}
    </div>
  );
}
