import { withApi, parseJsonBody } from "@/server/apiHandler";
import { updateUserSchema } from "@/server/validation/schemas";
import { requireAdmin } from "@/server/auth/guards";
import { deleteUser, updateUser } from "@/server/services/users.service";

export const runtime = "nodejs";

export const PATCH = withApi<{ id: string }>(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const input = await parseJsonBody(req, updateUserSchema);
  return updateUser(id, admin.id, input);
});

export const DELETE = withApi<{ id: string }>(async (_req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await deleteUser(id, admin.id);
  return { deleted: true };
});
