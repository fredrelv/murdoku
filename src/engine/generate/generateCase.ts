import { generateFloorPlan } from "../floorplan/generateFloorPlan";
import { enumeratePlacements, leftoverCell } from "../placement/enumerate";
import { buildCluePool } from "../clues/buildPool";
import { inArticle, ofArticle, type ClueEvalContext } from "../clues/registry";
import { selectClueSet } from "./minimizeClues";
import { buildClueMask, countSolutions } from "../solver/uniqueness";
import { solveDeductively } from "../solver/deductive";
import { pickCast } from "./cast";
import { createRng, randomSeed } from "../rng";
import type { Board, Cast, ClueTier, FloorPlan, GenerateOptions, GeneratedCase } from "../types";

const MIN_PLACEMENTS = 20;

function chooseSolution(
  rng: ReturnType<typeof createRng>,
  plan: FloorPlan,
  placements: Board[],
): { board: Board; victimCell: number; murdererIdx: number } | null {
  const shuffled = rng.shuffle(placements);
  for (const board of shuffled) {
    const victimCell = leftoverCell(plan, board);
    const victimRoom = plan.cells[victimCell]!.roomId;
    const occupantsInRoom = board
      .map((cell, idx) => ({ cell, idx }))
      .filter(({ cell }) => plan.cells[cell]!.roomId === victimRoom);
    if (occupantsInRoom.length === 1) {
      return { board, victimCell, murdererIdx: occupantsInRoom[0]!.idx };
    }
  }
  return null;
}

function titleFor(
  victimName: string,
  roomName: string,
  roomGender: "m" | "f",
  rng: ReturnType<typeof createRng>,
): string {
  const templates = [
    `O Caso ${ofArticle(roomGender)} ${roomName}`,
    `O Mistério de ${victimName}`,
    `Segredos ${inArticle(roomGender)} ${roomName}`,
  ];
  return rng.pick(templates);
}

function tiersFor(difficulty: "EASY" | "MEDIUM"): ClueTier[] {
  return difficulty === "EASY" ? [1] : [1, 2];
}

export function generateCase(opts: GenerateOptions = {}): GeneratedCase | null {
  const size = opts.size ?? 5;
  const difficulty = opts.difficulty ?? "EASY";
  const seed = opts.seed ?? randomSeed();
  const maxPlanAttempts = opts.maxPlanAttempts ?? 40;
  const clueRestarts = opts.clueRestarts ?? 8;
  const allowedTiers = tiersFor(difficulty);
  const solverMaxTier: ClueTier = allowedTiers.includes(2) ? 2 : 1;

  const rng = createRng(seed);

  for (let attempt = 0; attempt < maxPlanAttempts; attempt++) {
    const plan = generateFloorPlan(rng, size);
    if (!plan) continue;

    const placements = enumeratePlacements(plan, size - 1);
    if (!placements || placements.length < MIN_PLACEMENTS) continue;

    const solved = chooseSolution(rng, plan, placements);
    if (!solved) continue;
    const { board, victimCell, murdererIdx } = solved;

    const cast: Cast = pickCast(rng, size);
    const ctx: ClueEvalContext = { plan, suspects: cast.suspects, board };

    const fullPool = buildCluePool(rng, plan, cast, ctx);
    const pool = fullPool.filter((c) => allowedTiers.includes(c.tier));
    if (pool.length === 0) continue;

    const masks = pool.map((clue) => buildClueMask(clue, plan, cast.suspects, placements));
    if (countSolutions(masks) !== 1) continue; // this clue language can't pin this board

    const clues = selectClueSet(rng, pool, masks, clueRestarts);
    if (!clues) continue;

    const verdict = solveDeductively(plan, cast, clues, { maxTier: solverMaxTier });
    if (!verdict.solved) continue;
    if (verdict.board!.some((cell, i) => cell !== board[i])) {
      // The deductive rules are sound by construction (they only ever remove
      // cells inconsistent with a *true* clue), so this would mean a rule
      // implementation bug, not a bad puzzle. Fail loudly rather than ship it.
      throw new Error("solveDeductively converged on a board that does not match the true solution");
    }

    const murderer = cast.suspects[murdererIdx]!;
    const victimRoom = plan.rooms.find((r) => r.id === plan.cells[victimCell]!.roomId)!;

    const difficultyScore = 10 * (verdict.maxTierUsed || 1) + verdict.steps + (pool.length - clues.length);

    return {
      plan,
      cast,
      board,
      victimCell,
      murdererId: murderer.id,
      clues,
      difficulty,
      difficultyScore,
      trace: verdict.trace,
      seed,
      title: titleFor(cast.victim.name, victimRoom.name, victimRoom.gender, rng),
    };
  }

  return null;
}

export function generateCaseOrThrow(opts: GenerateOptions = {}): GeneratedCase {
  const result = generateCase(opts);
  if (!result) {
    throw new Error(`generateCase: exhausted attempts for options ${JSON.stringify(opts)}`);
  }
  return result;
}
