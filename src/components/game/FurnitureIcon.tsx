import type { FurnitureId } from "@/engine/types";

/**
 * Simple inline SVG glyphs, one per furniture type, drawn as solid filled
 * shapes (bolder/more "graphic" than a thin outline, and reads better at
 * small tile sizes). Used instead of emoji so rendering is crisp and
 * identical across browsers/Android WebView versions.
 */
export function FurnitureIcon({ id, className }: { id: FurnitureId; className?: string }) {
  const props = { viewBox: "0 0 24 24", className, fill: "currentColor" };

  switch (id) {
    case "chair":
      return (
        <svg {...props}>
          <rect x="6" y="4" width="12" height="9" rx="1.5" opacity={0.55} />
          <rect x="5" y="11" width="14" height="5" rx="1.5" />
          <rect x="5.5" y="16" width="2" height="4" rx="1" />
          <rect x="16.5" y="16" width="2" height="4" rx="1" />
        </svg>
      );
    case "armchair":
      return (
        <svg {...props}>
          <rect x="5" y="7" width="14" height="7" rx="2" opacity={0.55} />
          <rect x="3.5" y="10" width="3" height="7" rx="1.2" />
          <rect x="17.5" y="10" width="3" height="7" rx="1.2" />
          <rect x="5" y="13" width="14" height="5" rx="1.5" />
        </svg>
      );
    case "bed":
      return (
        <svg {...props}>
          <rect x="3" y="12" width="18" height="6" rx="1.5" />
          <rect x="4" y="8" width="7" height="5" rx="1.5" opacity={0.55} />
          <rect x="2.5" y="17" width="2" height="4" rx="1" />
          <rect x="19.5" y="17" width="2" height="4" rx="1" />
        </svg>
      );
    case "stool":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="7.5" rx="6.5" ry="2.8" />
          <rect x="6.4" y="9" width="2" height="10" rx="1" />
          <rect x="15.6" y="9" width="2" height="10" rx="1" />
        </svg>
      );
    case "rug":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" opacity={0.5} />
          <rect x="6.5" y="8.5" width="11" height="7" rx="1.5" opacity={0.85} />
        </svg>
      );
    case "bench":
      return (
        <svg {...props}>
          <rect x="2.5" y="8.5" width="19" height="3.2" rx="1.4" />
          <rect x="4.5" y="11.5" width="2" height="7" rx="1" />
          <rect x="17.5" y="11.5" width="2" height="7" rx="1" />
        </svg>
      );
    case "table":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="8" rx="8.5" ry="3.2" />
          <rect x="5.5" y="9" width="2" height="8" rx="1" opacity={0.7} />
          <rect x="16.5" y="9" width="2" height="8" rx="1" opacity={0.7} />
        </svg>
      );
    case "stove":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" opacity={0.4} />
          <circle cx="9" cy="9.5" r="2.1" />
          <circle cx="15" cy="9.5" r="2.1" />
          <circle cx="9" cy="15" r="2.1" />
          <circle cx="15" cy="15" r="2.1" />
        </svg>
      );
    case "bookshelf":
      return (
        <svg {...props}>
          <rect x="3" y="2.5" width="18" height="19" rx="1.5" opacity={0.35} />
          <rect x="4.5" y="4" width="3" height="6.5" />
          <rect x="8" y="4" width="2.2" height="6.5" opacity={0.75} />
          <rect x="10.7" y="4" width="3.2" height="6.5" />
          <rect x="14.5" y="4" width="2.2" height="6.5" opacity={0.75} />
          <rect x="4.5" y="13" width="7" height="6.5" opacity={0.75} />
          <rect x="12.2" y="13" width="7" height="6.5" />
        </svg>
      );
    case "piano":
      return (
        <svg {...props}>
          <path d="M4 6h11a4 4 0 0 1 4 4v3H4Z" opacity={0.6} />
          <rect x="4" y="13" width="16" height="7" rx="1.2" />
          <rect x="7.5" y="14.3" width="1.6" height="4.4" fill="#0c0a09" />
          <rect x="11.2" y="14.3" width="1.6" height="4.4" fill="#0c0a09" />
          <rect x="14.9" y="14.3" width="1.6" height="4.4" fill="#0c0a09" />
        </svg>
      );
    case "plant":
      return (
        <svg {...props}>
          <path d="M12 21v-7.5" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <path d="M12 13.5c0-4.5 3.3-6.8 6.8-6.8-1.1 4.5-3.5 6.8-6.8 6.8ZM12 13.5c0-3.8-2.7-6-6-6C6.7 11.3 9.1 13.5 12 13.5Z" />
          <path d="M7.5 21h9l-1.2-4.5h-6.6Z" opacity={0.7} />
        </svg>
      );
    case "painting":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="15" rx="1.5" opacity={0.35} />
          <rect x="4.5" y="4.5" width="15" height="12" rx="1" fill="#0c0a09" opacity={0.3} />
          <circle cx="9" cy="9" r="1.8" />
          <path d="M5 16l4.5-4 3.5 2.7 3-2.7 3.5 3.3v.7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
        </svg>
      );
    case "fireplace":
      return (
        <svg {...props}>
          <path d="M4 22V9a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 9v13Z" opacity={0.4} />
          <rect x="6.5" y="11" width="11" height="8" rx="1" fill="#0c0a09" opacity={0.4} />
          <path d="M12 18c2.3-1.1 2.9-2.9 1.7-4.6-.5 1.1-1.1 1.1-1.7.5.3-1.5-.2-2.3-1.1-2.9-.7 1.7-2.3 2.3-2.3 4.6a3.4 3.4 0 0 0 3.4 3.4Z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" opacity={0.4} />
          <circle cx="12" cy="12" r="7" fill="#0c0a09" opacity={0.35} />
          <path d="M12 7.5a1 1 0 0 1 1 1V12l2.6 1.5a1 1 0 1 1-1 1.7l-3.1-1.8a1 1 0 0 1-.5-.9V8.5a1 1 0 0 1 1-1Z" />
        </svg>
      );
  }
}
