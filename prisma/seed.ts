import "dotenv/config";
import { prisma } from "../src/server/db";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set (see .env.example) to seed the bootstrap admin.",
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const usernameLower = username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { usernameLower } });
  if (existing) {
    console.log(`Admin "${username}" already exists, skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      username,
      usernameLower,
      passwordHash,
      role: "ADMIN",
      mustChangePassword: true,
    },
  });
  console.log(`Created bootstrap admin "${username}". Change the password on first login.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
