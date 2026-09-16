import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Requires a real Postgres (see tests/server/README.md). Skipped otherwise
// so `npm test` stays fast and infra-free everywhere else.
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("services (integration)", () => {
  let prisma: typeof import("@/server/db").prisma;
  let usersService: typeof import("@/server/services/users.service");
  let puzzlesService: typeof import("@/server/services/puzzles.service");
  let attemptsService: typeof import("@/server/services/attempts.service");

  beforeAll(async () => {
    ({ prisma } = await import("@/server/db"));
    usersService = await import("@/server/services/users.service");
    puzzlesService = await import("@/server/services/puzzles.service");
    attemptsService = await import("@/server/services/attempts.service");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a user with a temp password and enforces the last-admin guard", async () => {
    const admin = await usersService.createUser(
      { username: `admin-${Date.now()}`, role: "ADMIN" },
      "system",
    );
    expect(admin.tempPassword).toHaveLength(12);

    // The very first admin created here has no prior admins in a fresh DB,
    // so guard against deleting/demoting the only one.
    const soleAdminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (soleAdminCount === 1) {
      await expect(usersService.deleteUser(admin.user.id, "other-actor")).rejects.toThrow();
    }

    await prisma.user.delete({ where: { id: admin.user.id } }).catch(() => {});
  });

  it("full attempt lifecycle: create draft -> publish -> play -> accuse correctly", async () => {
    const { created } = await puzzlesService.generateBatch({ count: 1, size: 5, difficulty: "EASY" });
    expect(created).toHaveLength(1);
    const puzzleId = created[0]!.id;
    await puzzlesService.setPuzzleStatus(puzzleId, "PUBLISHED");

    const player = await usersService.createUser({ username: `player-${Date.now()}`, role: "PLAYER" }, "system");

    const playerView = await puzzlesService.getPlayerPuzzle(puzzleId);
    expect(playerView.suspects.length).toBeGreaterThan(0);

    const attempt = await attemptsService.getOrCreateAttempt(player.user.id, puzzleId);
    const detail = await puzzlesService.getAdminPuzzleDetail(puzzleId);
    const solutionBoard = detail.solution!.placements as unknown as number[];
    const cast = detail.cast as unknown as { suspects: { id: string }[] };
    const placements = cast.suspects.map((s, i) => ({ suspectId: s.id, cell: solutionBoard[i]! }));

    const result = await attemptsService.accuse(
      attempt.id,
      player.user.id,
      placements,
      detail.solution!.murdererId,
    );
    expect(result.correct).toBe(true);
    expect(result.status).toBe("SOLVED");

    await prisma.attempt.deleteMany({ where: { userId: player.user.id } });
    await prisma.user.delete({ where: { id: player.user.id } });
    await prisma.puzzle.delete({ where: { id: puzzleId } });
  });
});
