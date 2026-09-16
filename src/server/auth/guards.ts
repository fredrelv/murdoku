import { getSessionUser, type SessionUser } from "./session";
import { Forbidden, Unauthorized } from "../apiError";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw Forbidden("Apenas administradores podem aceder a este recurso.");
  return user;
}
