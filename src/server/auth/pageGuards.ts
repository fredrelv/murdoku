import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

/**
 * Page-level counterparts to requireUser/requireAdmin (guards.ts). Those
 * throw ApiError, which only src/server/apiHandler.ts's withApi() catches —
 * a Server Component page calling them directly would let an expired
 * session or wrong-role visit fall through to Next.js's generic error page
 * instead of bouncing the user somewhere sensible. These redirect instead.
 */
export async function requireUserForPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminForPage(): Promise<SessionUser> {
  const user = await requireUserForPage();
  if (user.role !== "ADMIN") redirect("/cases");
  return user;
}
