import Link from "next/link";
import { requireUserForPage } from "@/server/auth/pageGuards";
import { listPublishedPuzzlesForUser } from "@/server/services/puzzles.service";
import { Header } from "@/components/ui/Header";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Por resolver",
  IN_PROGRESS: "Em progresso",
  SOLVED: "Resolvido",
  FAILED: "Falhado",
};

export default async function CasesPage() {
  const user = await requireUserForPage();
  const puzzles = await listPublishedPuzzlesForUser(user.id);

  return (
    <div className="flex flex-1 flex-col">
      <Header username={user.username} role={user.role} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral-100">Casos disponíveis</h1>
        {puzzles.length === 0 && (
          <p className="text-neutral-400">Ainda não há casos publicados. Volta mais tarde.</p>
        )}
        <ul className="space-y-3">
          {puzzles.map((p) => (
            <li key={p.id}>
              <Link
                href={`/cases/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition hover:border-amber-500"
              >
                <div>
                  <p className="font-semibold text-neutral-100">{p.title}</p>
                  <p className="text-xs text-neutral-500">
                    {p.code} · Grelha {p.size}x{p.size} · {p.difficulty === "EASY" ? "Fácil" : "Médio"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.attemptStatus === "SOLVED"
                      ? "bg-emerald-900 text-emerald-300"
                      : p.attemptStatus === "FAILED"
                        ? "bg-red-900 text-red-300"
                        : p.attemptStatus === "IN_PROGRESS"
                          ? "bg-amber-900 text-amber-300"
                          : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {STATUS_LABEL[p.attemptStatus]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
