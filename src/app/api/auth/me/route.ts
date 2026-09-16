import { withApi } from "@/server/apiHandler";
import { getSessionUser } from "@/server/auth/session";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  const user = await getSessionUser();
  return { user };
});
