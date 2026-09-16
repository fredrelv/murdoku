"use client";

import { useState, type FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";

interface AdminPuzzle {
  id: string;
  code: string;
  title: string;
  size: number;
  difficulty: "EASY" | "MEDIUM";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  clueCount: number;
  createdAt: string;
}

const STATUS_LABEL: Record<AdminPuzzle["status"], string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export function PuzzleManager({ initialPuzzles }: { initialPuzzles: AdminPuzzle[] }) {
  const [puzzles, setPuzzles] = useState(initialPuzzles);
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM">("EASY");
  const [size, setSize] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function refresh() {
    const list = await api.get<AdminPuzzle[]>("/api/admin/puzzles");
    setPuzzles(list);
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setGenerating(true);
    try {
      const result = await api.post<{ created: AdminPuzzle[]; failed: number }>("/api/admin/puzzles", {
        count,
        size,
        difficulty,
      });
      setInfo(`Gerados ${result.created.length} caso(s)${result.failed ? `, ${result.failed} falharam` : ""}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao gerar casos.");
    } finally {
      setGenerating(false);
    }
  }

  async function setStatus(id: string, status: AdminPuzzle["status"]) {
    setError(null);
    try {
      await api.patch(`/api/admin/puzzles/${id}`, { status });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao atualizar caso.");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.delete(`/api/admin/puzzles/${id}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao eliminar caso.");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleGenerate}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
      >
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Quantidade (máx. 5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Tamanho da grelha</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          >
            <option value={5}>5x5</option>
            <option value={6}>6x6</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Dificuldade</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM")}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          >
            <option value="EASY">Fácil</option>
            <option value="MEDIUM">Médio</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={generating}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {generating ? "A gerar..." : "Gerar casos"}
        </button>
      </form>

      {info && <p className="text-sm text-emerald-400">{info}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <table className="w-full text-left text-sm">
        <thead className="text-neutral-500">
          <tr>
            <th className="pb-2">Caso</th>
            <th className="pb-2">Dificuldade</th>
            <th className="pb-2">Pistas</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {puzzles.map((p) => (
            <tr key={p.id}>
              <td className="py-2 text-neutral-200">
                {p.code} — {p.title}
              </td>
              <td className="py-2 text-neutral-400">{p.difficulty === "EASY" ? "Fácil" : "Médio"}</td>
              <td className="py-2 text-neutral-400">{p.clueCount}</td>
              <td className="py-2 text-neutral-400">{STATUS_LABEL[p.status]}</td>
              <td className="space-x-3 py-2">
                {p.status !== "PUBLISHED" && (
                  <button onClick={() => setStatus(p.id, "PUBLISHED")} className="text-neutral-400 hover:text-emerald-400">
                    Publicar
                  </button>
                )}
                {p.status === "PUBLISHED" && (
                  <button onClick={() => setStatus(p.id, "ARCHIVED")} className="text-neutral-400 hover:text-amber-400">
                    Arquivar
                  </button>
                )}
                <button onClick={() => handleDelete(p.id)} className="text-neutral-400 hover:text-red-400">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
