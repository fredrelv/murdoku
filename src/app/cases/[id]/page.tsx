import { requireUserForPage } from "@/server/auth/pageGuards";
import { getPlayerPuzzle } from "@/server/services/puzzles.service";
import { getOrCreateAttempt } from "@/server/services/attempts.service";
import { Header } from "@/components/ui/Header";
import { GameBoard } from "@/components/game/GameBoard";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserForPage();
  const puzzle = await getPlayerPuzzle(id);
  const attempt = await getOrCreateAttempt(user.id, id);

  return (
    <div className="flex flex-1 flex-col">
      <Header username={user.username} role={user.role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold text-neutral-100">{puzzle.title}</h1>
        <p className="mb-6 text-sm text-neutral-500">
          {puzzle.code} · {puzzle.difficulty === "EASY" ? "Fácil" : "Médio"}
        </p>
        <GameBoard
          puzzle={puzzle}
          initialAttempt={{
            id: attempt.id,
            status: attempt.status,
            placements: attempt.placements as { suspectId: string; cell: number }[],
            hintsUsed: attempt.hintsUsed,
            wrongAccusations: attempt.wrongAccusations,
          }}
        />
      </main>
    </div>
  );
}
