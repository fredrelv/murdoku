"use client";

import Link from "next/link";
import type { DeductionStep } from "@/engine/types";

interface Props {
  correct: boolean;
  placementCorrect: boolean;
  murdererName?: string;
  trace?: DeductionStep[];
  onReset: () => void;
  resetting: boolean;
}

export function VerdictPanel({ correct, placementCorrect, murdererName, trace, onReset, resetting }: Props) {
  return (
    <div
      className={`space-y-4 rounded-xl border p-5 ${
        correct ? "border-emerald-700 bg-emerald-950/40" : "border-red-800 bg-red-950/40"
      }`}
    >
      <h2 className={`text-xl font-bold ${correct ? "text-emerald-300" : "text-red-300"}`}>
        {correct ? "Caso resolvido! 🎉" : "Acusação incorreta."}
      </h2>
      <p className="text-sm text-neutral-300">
        O assassino era <span className="font-semibold text-neutral-100">{murdererName}</span>.
        {correct && !placementCorrect && " A tua grelha tinha algumas posições erradas, mas apontaste bem."}
      </p>

      {trace && trace.length > 0 && (
        <details className="text-sm text-neutral-400">
          <summary className="cursor-pointer text-neutral-300">Ver o raciocínio passo a passo</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {trace
              .filter((step) => step.narrative)
              .map((step, i) => (
                <li key={i}>{step.narrative}</li>
              ))}
          </ol>
        </details>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReset}
          disabled={resetting}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-amber-500 disabled:opacity-50"
        >
          {resetting ? "A reiniciar..." : "Tentar novamente"}
        </button>
        <Link
          href="/cases"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
        >
          Ver outros casos
        </Link>
      </div>
    </div>
  );
}
