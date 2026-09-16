import { z } from "zod";
import { withApi, parseJsonBody } from "@/server/apiHandler";
import { requireAdmin } from "@/server/auth/guards";
import { deletePuzzle, getAdminPuzzleDetail, setPuzzleStatus } from "@/server/services/puzzles.service";

export const runtime = "nodejs";

const statusSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) });

export const GET = withApi<{ id: string }>(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  return getAdminPuzzleDetail(id);
});

export const PATCH = withApi<{ id: string }>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { status } = await parseJsonBody(req, statusSchema);
  await setPuzzleStatus(id, status);
  return { updated: true };
});

export const DELETE = withApi<{ id: string }>(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await deletePuzzle(id);
  return { deleted: true };
});
