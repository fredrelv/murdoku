import { withApi, parseJsonBody } from "@/server/apiHandler";
import { saveAttemptSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth/guards";
import { saveProgress } from "@/server/services/attempts.service";

export const runtime = "nodejs";

export const PATCH = withApi<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { placements } = await parseJsonBody(req, saveAttemptSchema);
  const attempt = await saveProgress(id, user.id, placements);
  return { saved: true, updatedAt: attempt.updatedAt };
});
