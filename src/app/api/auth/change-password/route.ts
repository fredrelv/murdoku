import { withApi, parseJsonBody } from "@/server/apiHandler";
import { changePasswordSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth/guards";
import { changeOwnPassword } from "@/server/services/users.service";
import { assertLoginNotRateLimited, clientIp, hashIp, recordLoginAttempt } from "@/server/auth/rateLimit";

export const runtime = "nodejs";

export const POST = withApi(async (req) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = await parseJsonBody(req, changePasswordSchema);

  const usernameLower = user.username.toLowerCase();
  const ipHash = hashIp(clientIp(req));
  await assertLoginNotRateLimited(usernameLower, ipHash);

  try {
    await changeOwnPassword(user.id, currentPassword, newPassword);
  } catch (err) {
    await recordLoginAttempt(usernameLower, ipHash, false);
    throw err;
  }
  await recordLoginAttempt(usernameLower, ipHash, true);

  return { changed: true };
});
