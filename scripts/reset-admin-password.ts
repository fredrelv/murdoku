/**
 * One-off recovery script: resets an existing user's password and forces a
 * change on next login. Usage:
 *   DATABASE_URL="..." npx tsx scripts/reset-admin-password.ts <username> <newPassword>
 */
import "dotenv/config";
import { prisma } from "../src/server/db";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const [, , username, newPassword] = process.argv;
  if (!username || !newPassword) {
    throw new Error("Usage: reset-admin-password.ts <username> <newPassword>");
  }
  if (newPassword.length < 8) {
    throw new Error("newPassword must be at least 8 characters.");
  }

  const usernameLower = username.toLowerCase();
  const user = await prisma.user.findUnique({ where: { usernameLower } });
  if (!user) {
    throw new Error(`No user found with username "${username}".`);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: true },
  });
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  console.log(`Password reset for "${user.username}". All sessions revoked.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
