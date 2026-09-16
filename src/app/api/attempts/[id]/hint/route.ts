import { withApi } from "@/server/apiHandler";
import { requireUser } from "@/server/auth/guards";
import { nextHint } from "@/server/services/attempts.service";

export const runtime = "nodejs";

export const POST = withApi<{ id: string }>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const step = await nextHint(id, user.id);
  return { step };
});
