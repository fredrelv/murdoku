"use client";

import { useState } from "react";
import type { Clue } from "@/engine/types";

export function CluesPanel({ clues }: { clues: Clue[] }) {
  const [struck, setStruck] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setStruck((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ul className="space-y-2">
      {clues.map((clue, i) => (
        <li key={clue.id}>
          <button
            type="button"
            onClick={() => toggle(clue.id)}
            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-left text-sm transition hover:border-amber-500 ${
              struck.has(clue.id) ? "text-neutral-600 line-through" : "text-neutral-200"
            }`}
          >
            <span className="mr-2 text-neutral-500">{i + 1}.</span>
            {clue.text}
          </button>
        </li>
      ))}
    </ul>
  );
}
