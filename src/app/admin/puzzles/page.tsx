import { requireAdminForPage } from "@/server/auth/pageGuards";
import { listPuzzlesForAdmin } from "@/server/services/puzzles.service";
import { Header } from "@/components/ui/Header";
import { PuzzleManager } from "@/components/admin/PuzzleManager";

export default async function AdminPuzzlesPage() {
  const admin = await requireAdminForPage();
  const puzzles = await listPuzzlesForAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <Header username={admin.username} role={admin.role} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral-100">Casos</h1>
        <PuzzleManager
          initialPuzzles={puzzles.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        />
      </main>
    </div>
  );
}
