import { withApi, parseJsonBody } from "@/server/apiHandler";
import { loginSchema } from "@/server/validation/schemas";
import { prisma } from "@/server/db";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import { createSession, setSessionCookie } from "@/server/auth/session";
import { assertLoginNotRateLimited, clientIp, hashIp, recordLoginAttempt } from "@/server/auth/rateLimit";
import { Unauthorized } from "@/server/apiError";

export const runtime = "nodejs";

// Constant-shape dummy hash so an unknown username takes the same code path
// (and roughly the same time) as a known one with a wrong password.
const DUMMY_HASH_PROMISE = hashPassword("dummy-not-a-real-password-000000");

export const POST = withApi(async (req) => {
  const { username, password } = await parseJsonBody(req, loginSchema);
  const usernameLower = username.toLowerCase();
  const ipHash = hashIp(clientIp(req));

  await assertLoginNotRateLimited(usernameLower, ipHash);

  const user = await prisma.user.findUnique({ where: { usernameLower } });
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, await DUMMY_HASH_PROMISE).then(() => false);

  await recordLoginAttempt(usernameLower, ipHash, valid && !!user?.isActive);

  if (!user || !valid || !user.isActive) {
    throw Unauthorized();
  }

  const token = await createSession(user.id, { userAgent: req.headers.get("user-agent") });
  await setSessionCookie(token);

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
});
