import { withApi } from "@/server/apiHandler";
import { revokeCurrentSession } from "@/server/auth/session";

export const runtime = "nodejs";

export const POST = withApi(async () => {
  await revokeCurrentSession();
  return { loggedOut: true };
});
