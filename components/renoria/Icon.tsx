import type { CSSProperties } from 'react';

// Iconos inline (portados de renoria-shared.jsx).
const PATHS = {
  leaf: 'M11 21C5 21 3 16 3 11c5 0 8 2 8 8M21 4C9 4 7 12 11 16c4 4 12 2 12-12',
  crumble: 'M3 21h18M6 21V9l4-3 4 3v12M6 13h8M14 21v-7l4-2  M9 9.5l-3 .5',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  check: 'M4 12l5 5L20 6',
  plus: 'M12 5v14M5 12h14',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3',
  chevL: 'M15 6l-6 6 6 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  stroke = 'currentColor',
  sw = 1.8,
  fill = 'none',
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
