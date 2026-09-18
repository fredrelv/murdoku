import { Armchair, BedSingle, Clock, CookingPot, Flame, Image, LibraryBig, PlantPot, Piano } from "lucide-react";
import type { FurnitureId } from "@/engine/types";

const LUCIDE_ICON: Partial<Record<FurnitureId, typeof Armchair>> = {
  armchair: Armchair,
  bed: BedSingle,
  stove: CookingPot,
  bookshelf: LibraryBig,
  piano: Piano,
  plant: PlantPot,
  painting: Image,
  fireplace: Flame,
  clock: Clock,
};

/**
 * Furniture without a good Lucide match get a small hand-drawn glyph, kept
 * in the same stroke style (round caps/joins, no fill) so every icon on the
 * board reads as one consistent set regardless of source.
 */
function CustomIcon({ id, ...svgProps }: { id: FurnitureId } & React.SVGProps<SVGSVGElement>) {
  switch (id) {
    case "chair":
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
          <rect x="5" y="11" width="14" height="4.5" rx="1.2" />
          <path d="M6.5 15.5v4M17.5 15.5v4" />
        </svg>
      );
    case "stool":
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="7.5" rx="6" ry="2.3" />
          <path d="M6.8 9 5.5 19M17.2 9l1.3 10" />
        </svg>
      );
    case "rug":
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <rect x="6" y="9" width="12" height="6" rx="1.5" strokeDasharray="2.5 2.5" />
        </svg>
      );
    case "bench":
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 10h19" />
          <path d="M4.5 10v8M19.5 10v8" />
        </svg>
      );
    case "table":
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="8" rx="8" ry="3" />
          <path d="M6 9v8M18 9v8" />
        </svg>
      );
    default:
      return null;
  }
}

export function FurnitureIcon({ id, className }: { id: FurnitureId; className?: string }) {
  const Lucide = LUCIDE_ICON[id];
  if (Lucide) {
    return <Lucide className={className} strokeWidth={1.9} absoluteStrokeWidth />;
  }
  return <CustomIcon id={id} className={className} strokeWidth={1.9} />;
}
