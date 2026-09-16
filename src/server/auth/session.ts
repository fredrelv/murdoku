import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "./constants";

export { SESSION_COOKIE_NAME };
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000; // refresh if last seen > 24h ago

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null } = {},
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: meta.userAgent ?? null,
    },
  });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Reads the session cookie, validates it against the DB, and slides the expiry if stale. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  if (Date.now() - session.lastSeenAt.getTime() > REFRESH_THRESHOLD_MS) {
    await prisma.session.update({
      where: { tokenHash },
      data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    mustChangePassword: session.user.mustChangePassword,
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  await clearSessionCookie();
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
