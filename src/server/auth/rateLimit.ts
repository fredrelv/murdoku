import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "../db";
import { TooManyRequests } from "../apiError";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_USERNAME = 5;
const MAX_ATTEMPTS_PER_IP = 20;

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Trusts `x-forwarded-for` as-is, which only holds because this app is
 * deployed on Vercel's edge (it sets/overwrites this header itself). If
 * ever self-hosted behind a different or no reverse proxy, a client could
 * spoof this to bypass the per-IP bucket (the per-username bucket below is
 * unaffected either way, so rate limiting degrades rather than disappears).
 */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Shared by both login and password-verification attempts (change-password)
 * — both are the same class of event: proving you know an account's
 * current password.
 */
export async function assertLoginNotRateLimited(usernameLower: string, ipHash: string): Promise<void> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byUsername, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { usernameLower, succeeded: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { ipHash, succeeded: false, createdAt: { gte: since } } }),
  ]);
  if (byUsername >= MAX_ATTEMPTS_PER_USERNAME || byIp >= MAX_ATTEMPTS_PER_IP) {
    throw TooManyRequests();
  }
}

export async function recordLoginAttempt(
  usernameLower: string,
  ipHash: string,
  succeeded: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { usernameLower, ipHash, succeeded } });
}
