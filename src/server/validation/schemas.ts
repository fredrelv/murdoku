import { z } from "zod";

const usernamePattern = /^[a-zA-Z0-9._-]{3,32}$/;

export const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export const createUserSchema = z.object({
  username: z.string().regex(usernamePattern, "3-32 caracteres: letras, números, ponto, hífen ou underscore."),
  displayName: z.string().max(80).optional(),
  role: z.enum(["ADMIN", "PLAYER"]).default("PLAYER"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256),
});

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "PLAYER"]).optional(),
  resetPassword: z.boolean().optional(),
});

export const generatePuzzleBatchSchema = z.object({
  count: z.number().int().min(1).max(5).default(1),
  size: z.number().int().min(4).max(6).default(5),
  difficulty: z.enum(["EASY", "MEDIUM"]).default("EASY"),
});

const MAX_GRID_CELL_INDEX = 35; // largest supported grid is 6x6 (indices 0..35)

const placementSchema = z.object({
  suspectId: z.string().min(1).max(64),
  cell: z.number().int().nonnegative().max(MAX_GRID_CELL_INDEX),
});

export const saveAttemptSchema = z.object({
  placements: z.array(placementSchema).max(16),
});

export const accuseSchema = z.object({
  placements: z.array(placementSchema).max(16),
  accusedSuspectId: z.string().min(1).max(64),
});
