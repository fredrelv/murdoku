import { prisma } from "../db";
import { generateCase } from "@/engine/generate/generateCase";
import { toPlayerPuzzle, type PlayerPuzzle } from "../dto/puzzle.dto";
import { NotFound } from "../apiError";
import type { Difficulty, PuzzleStatus } from "@prisma/client";

const GENERATOR_VERSION = 1;
const BATCH_WALL_CLOCK_BUDGET_MS = 20_000;

export interface AdminPuzzleSummary {
  id: string;
  code: string;
  title: string;
  size: number;
  difficulty: Difficulty;
  status: PuzzleStatus;
  clueCount: number;
  difficultyScore: number;
  createdAt: Date;
  publishedAt: Date | null;
}

async function nextCode(): Promise<string> {
  const count = await prisma.puzzle.count();
  return `CASE-${String(count + 1).padStart(4, "0")}`;
}

export async function generateBatch(opts: {
  count: number;
  size: number;
  difficulty: Difficulty;
}): Promise<{ created: AdminPuzzleSummary[]; failed: number }> {
  const created: AdminPuzzleSummary[] = [];
  const deadline = Date.now() + BATCH_WALL_CLOCK_BUDGET_MS;
  let failed = 0;

  for (let i = 0; i < opts.count; i++) {
    if (Date.now() > deadline) {
      failed += opts.count - i;
      break;
    }
    const result = generateCase({ size: opts.size, difficulty: opts.difficulty });
    if (!result) {
      failed++;
      continue;
    }

    const code = await nextCode();
    const puzzle = await prisma.$transaction(async (tx) => {
      const p = await tx.puzzle.create({
        data: {
          code,
          title: result.title,
          size: result.plan.size,
          difficulty: result.difficulty,
          seed: result.seed,
          generatorVersion: GENERATOR_VERSION,
          layout: JSON.parse(JSON.stringify(result.plan)),
          cast: JSON.parse(JSON.stringify(result.cast)),
          clues: JSON.parse(JSON.stringify(result.clues)),
          clueCount: result.clues.length,
          difficultyScore: result.difficultyScore,
          status: "DRAFT",
        },
      });
      await tx.puzzleSolution.create({
        data: {
          puzzleId: p.id,
          placements: JSON.parse(JSON.stringify(result.board)),
          victimCell: result.victimCell,
          murdererId: result.murdererId,
          deductionTrace: JSON.parse(JSON.stringify(result.trace)),
        },
      });
      return p;
    });

    created.push({
      id: puzzle.id,
      code: puzzle.code,
      title: puzzle.title,
      size: puzzle.size,
      difficulty: puzzle.difficulty,
      status: puzzle.status,
      clueCount: puzzle.clueCount,
      difficultyScore: puzzle.difficultyScore,
      createdAt: puzzle.createdAt,
      publishedAt: puzzle.publishedAt,
    });
  }

  return { created, failed };
}

export async function listPuzzlesForAdmin(): Promise<AdminPuzzleSummary[]> {
  const puzzles = await prisma.puzzle.findMany({ orderBy: { createdAt: "desc" } });
  return puzzles.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    size: p.size,
    difficulty: p.difficulty,
    status: p.status,
    clueCount: p.clueCount,
    difficultyScore: p.difficultyScore,
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
  }));
}

export async function setPuzzleStatus(id: string, status: PuzzleStatus): Promise<void> {
  const puzzle = await prisma.puzzle.findUnique({ where: { id } });
  if (!puzzle) throw NotFound("Caso não encontrado.");
  await prisma.puzzle.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : puzzle.publishedAt },
  });
}

export async function deletePuzzle(id: string): Promise<void> {
  const puzzle = await prisma.puzzle.findUnique({ where: { id } });
  if (!puzzle) throw NotFound("Caso não encontrado.");
  await prisma.puzzle.delete({ where: { id } });
}

export interface PlayerPuzzleListItem {
  id: string;
  code: string;
  title: string;
  size: number;
  difficulty: Difficulty;
  attemptStatus: "NOT_STARTED" | "IN_PROGRESS" | "SOLVED" | "FAILED";
}

export async function listPublishedPuzzlesForUser(userId: string): Promise<PlayerPuzzleListItem[]> {
  const puzzles = await prisma.puzzle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { attempts: { where: { userId } } },
  });
  return puzzles.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    size: p.size,
    difficulty: p.difficulty,
    attemptStatus: p.attempts[0]?.status ?? "NOT_STARTED",
  }));
}

export async function getPlayerPuzzle(id: string): Promise<PlayerPuzzle> {
  const puzzle = await prisma.puzzle.findUnique({ where: { id } });
  if (!puzzle || puzzle.status !== "PUBLISHED") throw NotFound("Caso não encontrado.");
  return toPlayerPuzzle(puzzle);
}

export async function getAdminPuzzleDetail(id: string) {
  const puzzle = await prisma.puzzle.findUnique({ where: { id }, include: { solution: true } });
  if (!puzzle) throw NotFound("Caso não encontrado.");
  return puzzle;
}
