import type { FurnitureId } from "@/engine/types";

/**
 * Simple inline SVG glyphs, one per furniture type. Used instead of emoji so
 * rendering is crisp and identical across browsers/Android WebView versions
 * (emoji glyphs vary a lot between OEM font sets).
 */
export function FurnitureIcon({ id, className }: { id: FurnitureId; className?: string }) {
  const props = { viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (id) {
    case "chair":
      return (
        <svg {...props}>
          <path d="M6 11V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
          <rect x="5" y="11" width="14" height="5" rx="1" />
          <path d="M6 16v3M18 16v3" />
        </svg>
      );
    case "armchair":
      return (
        <svg {...props}>
          <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
          <path d="M4 12h2v5h12v-5h2v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          <path d="M6 18v2M18 18v2" />
        </svg>
      );
    case "bed":
      return (
        <svg {...props}>
          <path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
          <path d="M3 16h18" />
          <rect x="4" y="10" width="6" height="4" rx="1" />
          <path d="M3 19v2M21 19v2" />
        </svg>
      );
    case "stool":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="8" rx="6" ry="2.5" />
          <path d="M7.5 9.5 6 19M16.5 9.5 18 19" />
        </svg>
      );
    case "rug":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <rect x="6" y="9" width="12" height="6" rx="1" />
        </svg>
      );
    case "bench":
      return (
        <svg {...props}>
          <rect x="3" y="9" width="18" height="3" rx="1" />
          <path d="M5 12v6M19 12v6" />
        </svg>
      );
    case "table":
      return (
        <svg {...props}>
          <ellipse cx="12" cy="9" rx="8" ry="3" />
          <path d="M6 10v7M18 10v7" />
        </svg>
      );
    case "stove":
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="15" rx="1.5" />
          <circle cx="9" cy="10" r="1.8" />
          <circle cx="15" cy="10" r="1.8" />
          <circle cx="9" cy="15.5" r="1.8" />
          <circle cx="15" cy="15.5" r="1.8" />
        </svg>
      );
    case "bookshelf":
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M4 9h16M4 15h16" />
          <path d="M8 3v6M13 3v6M8 15v6M17 9v6" />
        </svg>
      );
    case "piano":
      return (
        <svg {...props}>
          <path d="M4 8h13a3 3 0 0 1 3 3v2H4z" />
          <rect x="4" y="13" width="16" height="6" rx="1" />
          <path d="M8 13v6M12 13v6M16 13v6" />
        </svg>
      );
    case "plant":
      return (
        <svg {...props}>
          <path d="M12 21v-9" />
          <path d="M12 12c0-4 3-6 6-6-1 4-3 6-6 6ZM12 12c0-3.5-2.5-5.5-5.5-5.5C7.2 10 9.5 12 12 12Z" />
          <path d="M8 21h8l-1-4H9z" />
        </svg>
      );
    case "painting":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="14" rx="1" />
          <circle cx="9" cy="9" r="1.6" />
          <path d="M4 15l5-4 4 3 3-3 4 4" />
        </svg>
      );
    case "fireplace":
      return (
        <svg {...props}>
          <path d="M5 21V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12" />
          <path d="M12 18c2-1 2.5-2.5 1.5-4-.5 1-1 1-1.5.5.3-1.3-.2-2-1-2.5-.6 1.5-2 2-2 4a3 3 0 0 0 3 3Z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
  }
}
