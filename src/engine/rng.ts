/**
 * Deterministic seeded RNG (xmur3 hash -> mulberry32 generator).
 * Every generation path must go through this so a stored seed reproduces
 * an identical case. Never use Math.random() inside src/engine.
 */

export interface Rng {
  next(): number; // [0, 1)
  int(maxExclusive: number): number; // [0, maxExclusive)
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): Rng {
  const seedFn = xmur3(seed);
  const next = mulberry32(seedFn());

  return {
    next,
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) throw new Error("maxExclusive must be > 0");
      return Math.floor(next() * maxExclusive);
    },
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new Error("cannot pick from empty array");
      return arr[this.int(arr.length)] as T;
    },
    shuffle<T>(arr: readonly T[]): T[] {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
  };
}

export function randomSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: still deterministic-shaped (not used in src/engine call paths).
  return `s${Date.now().toString(36)}${Date.now().toString(36)}`;
}
