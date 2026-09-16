import { withApi, parseJsonBody } from "@/server/apiHandler";
import { createUserSchema } from "@/server/validation/schemas";
import { requireAdmin } from "@/server/auth/guards";
import { createUser, listUsers } from "@/server/services/users.service";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  await requireAdmin();
  return listUsers();
});

export const POST = withApi(async (req) => {
  const admin = await requireAdmin();
  const input = await parseJsonBody(req, createUserSchema);
  return createUser(input, admin.id);
});
