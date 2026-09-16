import { prisma } from "../db";
import { BadRequest, Forbidden, NotFound } from "../apiError";
import type { Cast, DeductionStep } from "@/engine/types";

const MAX_WRONG_ACCUSATIONS = 1;

interface PlacementInput {
  suspectId: string;
  cell: number;
}

async function loadAttemptOwned(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { puzzle: { include: { solution: true } } },
  });
  if (!attempt) throw NotFound("Tentativa não encontrada.");
  if (attempt.userId !== userId) throw Forbidden();
  return attempt;
}

export async function getOrCreateAttempt(userId: string, puzzleId: string) {
  const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.status !== "PUBLISHED") throw NotFound("Caso não encontrado.");

  return prisma.attempt.upsert({
    where: { userId_puzzleId: { userId, puzzleId } },
    create: { userId, puzzleId, placements: [] },
    update: {},
  });
}

export async function saveProgress(attemptId: string, userId: string, placements: PlacementInput[]) {
  const attempt = await loadAttemptOwned(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") throw BadRequest("Esta tentativa já foi concluída.");
  return prisma.attempt.update({
    where: { id: attemptId },
    data: { placements: JSON.parse(JSON.stringify(placements)) },
  });
}

export async function resetAttempt(attemptId: string, userId: string) {
  await loadAttemptOwned(attemptId, userId);
  return prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "IN_PROGRESS",
      placements: [],
      accusedSuspectId: null,
      wrongAccusations: 0,
      hintsUsed: 0,
      completedAt: null,
    },
  });
}

export interface AccuseResult {
  correct: boolean;
  placementCorrect: boolean;
  status: "SOLVED" | "FAILED" | "IN_PROGRESS";
  murdererName?: string;
  murdererId?: string;
  solutionPlacements?: PlacementInput[];
  trace?: DeductionStep[];
}

export async function accuse(
  attemptId: string,
  userId: string,
  placements: PlacementInput[],
  accusedSuspectId: string,
): Promise<AccuseResult> {
  const attempt = await loadAttemptOwned(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") throw BadRequest("Esta tentativa já foi concluída.");
  if (!attempt.puzzle.solution) throw NotFound("Solução não encontrada.");

  const cast = attempt.puzzle.cast as unknown as Cast;
  const solutionBoard = attempt.puzzle.solution.placements as unknown as number[];
  const solutionPlacements: PlacementInput[] = cast.suspects.map((s, i) => ({
    suspectId: s.id,
    cell: solutionBoard[i]!,
  }));

  const correct = accusedSuspectId === attempt.puzzle.solution.murdererId;
  const placementCorrect =
    placements.length === solutionPlacements.length &&
    solutionPlacements.every((sp) => placements.some((p) => p.suspectId === sp.suspectId && p.cell === sp.cell));

  let status: "SOLVED" | "FAILED" | "IN_PROGRESS" = "IN_PROGRESS";
  let wrongAccusations = attempt.wrongAccusations;

  if (correct) {
    status = "SOLVED";
  } else {
    wrongAccusations += 1;
    status = wrongAccusations >= MAX_WRONG_ACCUSATIONS ? "FAILED" : "IN_PROGRESS";
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      placements: JSON.parse(JSON.stringify(placements)),
      accusedSuspectId,
      wrongAccusations,
      status,
      completedAt: status === "IN_PROGRESS" ? null : new Date(),
    },
  });

  const murderer = cast.suspects.find((s) => s.id === attempt.puzzle.solution!.murdererId);

  const resolved = status !== "IN_PROGRESS";
  return {
    correct,
    placementCorrect,
    status,
    murdererName: resolved ? murderer?.name : undefined,
    murdererId: resolved ? attempt.puzzle.solution.murdererId : undefined,
    solutionPlacements: resolved ? solutionPlacements : undefined,
    trace: resolved ? (attempt.puzzle.solution.deductionTrace as unknown as DeductionStep[]) : undefined,
  };
}

export async function nextHint(attemptId: string, userId: string): Promise<DeductionStep | null> {
  const attempt = await loadAttemptOwned(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") throw BadRequest("Esta tentativa já foi concluída.");
  if (!attempt.puzzle.solution) throw NotFound("Solução não encontrada.");

  const trace = attempt.puzzle.solution.deductionTrace as unknown as DeductionStep[];
  const step = trace[attempt.hintsUsed];
  if (!step) return null;

  await prisma.attempt.update({ where: { id: attemptId }, data: { hintsUsed: { increment: 1 } } });
  return step;
}
