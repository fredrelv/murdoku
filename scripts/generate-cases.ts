/**
 * CLI: bulk-generate Murdoku cases outside of any Vercel request timeout.
 *
 * Usage:
 *   npm run generate:cases -- --count 20 --difficulty EASY --size 5 --persist
 *
 * Without --persist, cases are only printed as an ASCII preview (useful for
 * eyeballing quality/difficulty calibration). With --persist, cases are
 * written to the database as DRAFT puzzles via the same service the admin
 * "generate batch" API route uses.
 */
import "dotenv/config";
import { generateCase } from "../src/engine/generate/generateCase";
import type { GeneratedCase } from "../src/engine/types";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
  };
  return {
    count: Number(get("--count", "10")),
    difficulty: get("--difficulty", "EASY") as "EASY" | "MEDIUM",
    size: Number(get("--size", "5")),
    persist: args.includes("--persist"),
  };
}

function preview(result: GeneratedCase): string {
  const { plan, board } = result;
  const occupied = new Map<number, string>();
  result.cast.suspects.forEach((s, i) => occupied.set(board[i]!, s.name[0]!.toUpperCase()));
  occupied.set(result.victimCell, "†");

  const lines: string[] = [`\n=== ${result.title} (${result.difficulty}, seed=${result.seed}) ===`];
  for (let r = 0; r < plan.size; r++) {
    let row = "";
    for (let c = 0; c < plan.size; c++) {
      const idx = r * plan.size + c;
      const cell = plan.cells[idx]!;
      const mark = occupied.get(idx) ?? (cell.isSeat ? "." : "#");
      row += ` ${mark} `;
    }
    lines.push(row);
  }
  lines.push(`Clues (${result.clues.length}):`);
  result.clues.forEach((c, i) => lines.push(`  ${i + 1}. ${c.text}`));
  lines.push(`Murderer: ${result.cast.suspects.find((s) => s.id === result.murdererId)?.name}`);
  return lines.join("\n");
}

async function main() {
  const opts = parseArgs();
  console.log(`Generating ${opts.count} case(s), size=${opts.size}, difficulty=${opts.difficulty}...`);

  const results: GeneratedCase[] = [];
  for (let i = 0; i < opts.count; i++) {
    const result = generateCase({ size: opts.size, difficulty: opts.difficulty });
    if (!result) {
      console.warn(`  [${i + 1}/${opts.count}] generation failed (attempts exhausted)`);
      continue;
    }
    results.push(result);
    console.log(preview(result));
  }

  console.log(`\nGenerated ${results.length}/${opts.count} cases.`);

  if (opts.persist) {
    const { prisma } = await import("../src/server/db");
    let created = 0;
    for (const result of results) {
      const code = `CASE-${String((await prisma.puzzle.count()) + 1).padStart(4, "0")}`;
      await prisma.$transaction(async (tx) => {
        const p = await tx.puzzle.create({
          data: {
            code,
            title: result.title,
            size: result.plan.size,
            difficulty: result.difficulty,
            seed: result.seed,
            generatorVersion: 1,
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
      });
      created++;
    }
    console.log(`Persisted ${created} case(s) as DRAFT puzzles.`);
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
