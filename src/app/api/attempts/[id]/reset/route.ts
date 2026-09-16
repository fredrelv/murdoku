import { withApi } from "@/server/apiHandler";
import { requireUser } from "@/server/auth/guards";
import { resetAttempt } from "@/server/services/attempts.service";

export const runtime = "nodejs";

export const POST = withApi<{ id: string }>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const attempt = await resetAttempt(id, user.id);
  return { status: attempt.status };
});
