import type { Board, FloorPlan } from "../types";

/**
 * Enumerates every valid board: an assignment of `suspectCount` (= size - 1)
 * suspects to distinct seat cells such that no two share a row or column,
 * AND the single leftover row/column intersection is itself a seat cell
 * (that intersection becomes the victim's cell).
 *
 * Returns null if the search exceeds `cap` (defensive; size 5-6 never gets
 * close to this in practice).
 */
export function enumeratePlacements(
  plan: FloorPlan,
  suspectCount: number,
  cap = 500_000,
): Board[] | null {
  const { size, cells } = plan;
  const results: Board[] = [];
  const board: number[] = new Array(suspectCount).fill(-1);
  let usedRowMask = 0;
  let usedColMask = 0;
  let visited = 0;

  const isSeat = (row: number, col: number) => cells[row * size + col]!.isSeat;

  function leftoverIsSeat(): boolean {
    let leftoverRow = -1;
    for (let r = 0; r < size; r++) {
      if (!(usedRowMask & (1 << r))) {
        leftoverRow = r;
        break;
      }
    }
    let leftoverCol = -1;
    for (let c = 0; c < size; c++) {
      if (!(usedColMask & (1 << c))) {
        leftoverCol = c;
        break;
      }
    }
    if (leftoverRow === -1 || leftoverCol === -1) return false;
    return isSeat(leftoverRow, leftoverCol);
  }

  function dfs(suspectIdx: number): boolean {
    if (suspectIdx === suspectCount) {
      if (leftoverIsSeat()) {
        results.push(board.slice());
      }
      return results.length < cap;
    }
    for (let row = 0; row < size; row++) {
      if (usedRowMask & (1 << row)) continue;
      for (let col = 0; col < size; col++) {
        if (usedColMask & (1 << col)) continue;
        if (!isSeat(row, col)) continue;
        visited++;
        if (visited > cap * 4) return false;

        board[suspectIdx] = row * size + col;
        usedRowMask |= 1 << row;
        usedColMask |= 1 << col;

        const keepGoing = dfs(suspectIdx + 1);

        usedRowMask &= ~(1 << row);
        usedColMask &= ~(1 << col);
        board[suspectIdx] = -1;

        if (!keepGoing) return false;
      }
    }
    return true;
  }

  const completed = dfs(0);
  if (!completed) return null;
  return results;
}

export function leftoverCell(plan: FloorPlan, board: Board): number {
  const { size } = plan;
  let usedRowMask = 0;
  let usedColMask = 0;
  for (const cellIndex of board) {
    usedRowMask |= 1 << Math.floor(cellIndex / size);
    usedColMask |= 1 << cellIndex % size;
  }
  let leftoverRow = -1;
  for (let r = 0; r < size; r++) {
    if (!(usedRowMask & (1 << r))) {
      leftoverRow = r;
      break;
    }
  }
  let leftoverCol = -1;
  for (let c = 0; c < size; c++) {
    if (!(usedColMask & (1 << c))) {
      leftoverCol = c;
      break;
    }
  }
  return leftoverRow * size + leftoverCol;
}
