import { prisma } from "../db";
import { generateTempPassword, hashPassword, verifyPassword } from "../auth/password";
import { revokeAllSessionsForUser } from "../auth/session";
import { BadRequest, Conflict, NotFound } from "../apiError";
import type { Role } from "@prisma/client";

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

function toPublicUser(u: {
  id: string;
  username: string;
  displayName: string | null;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt,
  };
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return users.map(toPublicUser);
}

export async function createUser(
  input: { username: string; displayName?: string; role: Role },
  actorId: string,
): Promise<{ user: PublicUser; tempPassword: string }> {
  const usernameLower = input.username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { usernameLower } });
  if (existing) throw Conflict("Já existe um utilizador com esse nome.");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      usernameLower,
      displayName: input.displayName,
      role: input.role,
      passwordHash,
      mustChangePassword: true,
      createdById: actorId,
    },
  });

  await prisma.auditLog.create({
    data: { actorId, action: "USER_CREATED", targetType: "User", targetId: user.id },
  });

  return { user: toPublicUser(user), tempPassword };
}

async function countActiveAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN", isActive: true } });
}

export async function updateUser(
  targetId: string,
  actorId: string,
  input: { isActive?: boolean; role?: Role; resetPassword?: boolean },
): Promise<{ user: PublicUser; tempPassword?: string }> {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw NotFound("Utilizador não encontrado.");

  const demotingLastAdmin =
    target.role === "ADMIN" &&
    ((input.role && input.role !== "ADMIN") || input.isActive === false) &&
    (await countActiveAdmins()) <= 1;
  if (demotingLastAdmin) {
    throw BadRequest("Não é possível remover o último administrador.");
  }
  if (targetId === actorId && (input.role === "PLAYER" || input.isActive === false)) {
    throw BadRequest("Não pode despromover ou desativar a sua própria conta.");
  }

  let tempPassword: string | undefined;
  const data: { isActive?: boolean; role?: Role; passwordHash?: string; mustChangePassword?: boolean } = {};
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.role !== undefined) data.role = input.role;
  if (input.resetPassword) {
    tempPassword = generateTempPassword();
    data.passwordHash = await hashPassword(tempPassword);
    data.mustChangePassword = true;
  }

  const updated = await prisma.user.update({ where: { id: targetId }, data });

  if (input.isActive === false || input.resetPassword) {
    await revokeAllSessionsForUser(targetId);
  }

  await prisma.auditLog.create({
    data: { actorId, action: "USER_UPDATED", targetType: "User", targetId, metadata: input },
  });

  return { user: toPublicUser(updated), tempPassword };
}

export async function deleteUser(targetId: string, actorId: string): Promise<void> {
  if (targetId === actorId) throw BadRequest("Não pode eliminar a sua própria conta.");
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw NotFound("Utilizador não encontrado.");
  if (target.role === "ADMIN" && (await countActiveAdmins()) <= 1) {
    throw BadRequest("Não é possível eliminar o último administrador.");
  }
  await prisma.user.delete({ where: { id: targetId } });
  await prisma.auditLog.create({
    data: { actorId, action: "USER_DELETED", targetType: "User", targetId },
  });
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw NotFound("Utilizador não encontrado.");
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw BadRequest("Palavra-passe atual incorreta.");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
  await revokeAllSessionsForUser(userId);
}
