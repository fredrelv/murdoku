import { withApi } from "@/server/apiHandler";
import { requireUser } from "@/server/auth/guards";
import { getPlayerPuzzle } from "@/server/services/puzzles.service";
import { getOrCreateAttempt } from "@/server/services/attempts.service";

export const runtime = "nodejs";

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const puzzle = await getPlayerPuzzle(id);
  const attempt = await getOrCreateAttempt(user.id, id);
  return {
    puzzle,
    attempt: {
      id: attempt.id,
      status: attempt.status,
      placements: attempt.placements,
      hintsUsed: attempt.hintsUsed,
      wrongAccusations: attempt.wrongAccusations,
    },
  };
});
