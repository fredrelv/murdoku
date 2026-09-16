import { withApi, parseJsonBody } from "@/server/apiHandler";
import { generatePuzzleBatchSchema } from "@/server/validation/schemas";
import { requireAdmin } from "@/server/auth/guards";
import { generateBatch, listPuzzlesForAdmin } from "@/server/services/puzzles.service";

export const runtime = "nodejs";
export const maxDuration = 30;

export const GET = withApi(async () => {
  await requireAdmin();
  return listPuzzlesForAdmin();
});

export const POST = withApi(async (req) => {
  await requireAdmin();
  const input = await parseJsonBody(req, generatePuzzleBatchSchema);
  return generateBatch(input);
});
