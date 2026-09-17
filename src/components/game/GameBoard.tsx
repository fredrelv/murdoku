"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DeductionStep } from "@/engine/types";
import type { PlayerPuzzle } from "@/server/dto/puzzle.dto";
import { api, ApiClientError } from "@/lib/api";
import { GridBoard } from "./GridBoard";
import { SuspectTray } from "./SuspectTray";
import { CluesPanel } from "./CluesPanel";
import { VerdictPanel } from "./VerdictPanel";

interface AttemptState {
  id: string;
  status: "IN_PROGRESS" | "SOLVED" | "FAILED";
  placements: { suspectId: string; cell: number }[];
  hintsUsed: number;
  wrongAccusations: number;
}

interface AccuseResponse {
  correct: boolean;
  placementCorrect: boolean;
  status: "SOLVED" | "FAILED" | "IN_PROGRESS";
  murdererName?: string;
  trace?: DeductionStep[];
}

const AUTOSAVE_DELAY_MS = 1000;

interface Placement {
  cell: number;
  /** Hypothesis placements are a "testing a guess" scratch state — they
   * still occupy the cell like any other placement, but don't drive the
   * automatic row/column elimination overlay (see autoBlockedCells below),
   * since a wrong hypothesis shouldn't mislead the player elsewhere. */
  confirmed: boolean;
}

function toMap(list: { suspectId: string; cell: number }[]): Record<string, Placement> {
  return Object.fromEntries(list.map((p) => [p.suspectId, { cell: p.cell, confirmed: true }]));
}

export function GameBoard({ puzzle, initialAttempt }: { puzzle: PlayerPuzzle; initialAttempt: AttemptState }) {
  const [placements, setPlacements] = useState<Record<string, Placement>>(toMap(initialAttempt.placements));
  const [blockedCells, setBlockedCells] = useState<Set<number>>(new Set());
  const [placementMode, setPlacementMode] = useState<"confirmed" | "hypothesis">("confirmed");
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null);
  const [status, setStatus] = useState(initialAttempt.status);
  const [accusing, setAccusing] = useState(false);
  const [accusedId, setAccusedId] = useState<string>(puzzle.suspects[0]?.id ?? "");
  const [verdict, setVerdict] = useState<AccuseResponse | null>(null);
  const [hints, setHints] = useState<DeductionStep[]>([]);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solved = status !== "IN_PROGRESS";

  useEffect(() => {
    if (solved) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // The server only ever needs to know the final cell per suspect — the
      // confirmed/hypothesis distinction is a local scratch aid, same as
      // the X marks, and is never part of the puzzle's real submission.
      const list = Object.entries(placements).map(([suspectId, p]) => ({ suspectId, cell: p.cell }));
      api.patch(`/api/attempts/${initialAttempt.id}`, { placements: list }).catch(() => {
        // Autosave is best-effort; the player's local state is still correct.
      });
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, solved]);

  const occupiedByOther = useMemo(() => {
    const map = new Map<number, string>();
    for (const [suspectId, p] of Object.entries(placements)) map.set(p.cell, suspectId);
    return map;
  }, [placements]);

  // Sudoku rule made visible: once a suspect is confirmed at (row, col), no
  // one else can use that row or that column, so grey those seats out
  // automatically instead of making the player mark them by hand.
  const autoBlockedCells = useMemo(() => {
    const size = puzzle.layout.size;
    const blocked = new Set<number>();
    for (const p of Object.values(placements)) {
      if (!p.confirmed) continue;
      const row = Math.floor(p.cell / size);
      const col = p.cell % size;
      for (let c = 0; c < size; c++) {
        const idx = row * size + c;
        if (idx !== p.cell) blocked.add(idx);
      }
      for (let r = 0; r < size; r++) {
        const idx = r * size + col;
        if (idx !== p.cell) blocked.add(idx);
      }
    }
    return blocked;
  }, [placements, puzzle.layout.size]);

  function handleCellClick(cell: number) {
    if (solved) return;
    const cellData = puzzle.layout.cells[cell];
    if (!cellData?.isSeat) return;

    if (activeSuspect) {
      setPlacements((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key]!.cell === cell) delete next[key];
        }
        next[activeSuspect] = { cell, confirmed: placementMode === "confirmed" };
        return next;
      });
      setBlockedCells((prev) => {
        if (!prev.has(cell)) return prev;
        const next = new Set(prev);
        next.delete(cell);
        return next;
      });
      setActiveSuspect(null);
      return;
    }

    const occupant = occupiedByOther.get(cell);
    if (occupant) {
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[occupant];
        return next;
      });
      return;
    }

    // No suspect selected and the cell is empty: toggle a blocking "X" mark
    // — a scratch note ("this seat can't be the answer"), never sent to the
    // server, exactly like pencil marks in the physical book.
    setBlockedCells((prev) => {
      const next = new Set(prev);
      if (next.has(cell)) next.delete(cell);
      else next.add(cell);
      return next;
    });
  }

  async function handleAccuse() {
    setError(null);
    setAccusing(true);
    try {
      const list = Object.entries(placements).map(([suspectId, p]) => ({ suspectId, cell: p.cell }));
      const result = await api.post<AccuseResponse>(`/api/attempts/${initialAttempt.id}/accuse`, {
        placements: list,
        accusedSuspectId: accusedId,
      });
      setVerdict(result);
      if (result.status !== "IN_PROGRESS") setStatus(result.status);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao acusar.");
    } finally {
      setAccusing(false);
    }
  }

  async function handleHint() {
    setError(null);
    try {
      const { step } = await api.post<{ step: DeductionStep | null }>(`/api/attempts/${initialAttempt.id}/hint`);
      if (step) setHints((prev) => [...prev, step]);
      else setError("Não há mais dicas para este caso.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao pedir dica.");
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      await api.post(`/api/attempts/${initialAttempt.id}/reset`);
      setPlacements({});
      setBlockedCells(new Set());
      setStatus("IN_PROGRESS");
      setVerdict(null);
      setHints([]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao reiniciar.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <GridBoard
          layout={puzzle.layout}
          suspects={puzzle.suspects}
          placements={placements}
          blockedCells={blockedCells}
          autoBlockedCells={autoBlockedCells}
          onCellClick={handleCellClick}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SuspectTray
            suspects={puzzle.suspects}
            placements={placements}
            activeId={activeSuspect}
            onSelect={(id) => setActiveSuspect((cur) => (cur === id ? null : id))}
          />
          <div className="flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-900 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPlacementMode("hypothesis")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                placementMode === "hypothesis" ? "bg-sky-500 text-neutral-950" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Hipótese
            </button>
            <button
              type="button"
              onClick={() => setPlacementMode("confirmed")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                placementMode === "confirmed" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Confirmado
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Seleciona um suspeito e depois clica numa cadeira/cama/tapete livre para o colocar (em modo
          &ldquo;Hipótese&rdquo; o peão fica tracejado — testa sem compromisso). Clica numa casa ocupada para o remover. Sem suspeito
          selecionado, clicar numa casa vazia marca/desmarca uma cruz. Colocar alguém confirmado risca
          automaticamente o resto da linha e coluna (ninguém mais pode estar lá).
        </p>

        {hints.length > 0 && (
          <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-300">
            <p className="mb-1 font-semibold">Dicas</p>
            <ul className="list-disc space-y-1 pl-5">
              {hints.map((h, i) => (
                <li key={i}>{h.narrative}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {verdict ? (
          <VerdictPanel
            correct={verdict.correct}
            placementCorrect={verdict.placementCorrect}
            murdererName={verdict.murdererName}
            trace={verdict.trace}
            onReset={handleReset}
            resetting={resetting}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <label htmlFor="accused" className="text-sm text-neutral-300">
              Acuso:
            </label>
            <select
              id="accused"
              value={accusedId}
              onChange={(e) => setAccusedId(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
            >
              {puzzle.suspects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAccuse}
              disabled={accusing}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {accusing ? "A acusar..." : "Acusar"}
            </button>
            <button
              type="button"
              onClick={handleHint}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-sky-500"
            >
              Pedir dica
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Vítima: {puzzle.victimName}
          </h2>
          <p className="text-xs text-neutral-600">
            O assassino é quem ficou sozinho com {puzzle.victimName} na mesma divisão.
          </p>
        </div>
        <CluesPanel clues={puzzle.clues} />
      </aside>
    </div>
  );
}
