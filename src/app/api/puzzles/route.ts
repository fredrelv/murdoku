import { withApi } from "@/server/apiHandler";
import { requireUser } from "@/server/auth/guards";
import { listPublishedPuzzlesForUser } from "@/server/services/puzzles.service";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  const user = await requireUser();
  return listPublishedPuzzlesForUser(user.id);
});
