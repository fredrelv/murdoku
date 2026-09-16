import type { Rng } from "../rng";
import type { Cast, Person } from "../types";

const NAME_POOL = [
  "Emma",
  "Boris",
  "Clara",
  "Dmitri",
  "Inês",
  "Rafael",
  "Sofia",
  "Tomás",
  "Alice",
  "Henrique",
  "Marta",
  "Vasco",
];

const AVATAR_KEYS = ["fox", "owl", "cat", "raven", "wolf", "hare", "badger", "lynx", "crow", "deer", "heron", "otter"];

export function pickCast(rng: Rng, size: number): Cast {
  const shuffledNames = rng.shuffle(NAME_POOL);
  const shuffledAvatars = rng.shuffle(AVATAR_KEYS);
  const people: Person[] = Array.from({ length: size }, (_, i) => ({
    id: `p${i + 1}`,
    name: shuffledNames[i % shuffledNames.length]!,
    avatarKey: shuffledAvatars[i % shuffledAvatars.length]!,
  }));
  const victim = people[0]!;
  const suspects = people.slice(1);
  return { suspects, victim };
}
