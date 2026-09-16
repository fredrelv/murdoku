import { withApi, parseJsonBody } from "@/server/apiHandler";
import { accuseSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth/guards";
import { accuse } from "@/server/services/attempts.service";

export const runtime = "nodejs";

export const POST = withApi<{ id: string }>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { placements, accusedSuspectId } = await parseJsonBody(req, accuseSchema);
  return accuse(id, user.id, placements, accusedSuspectId);
});
