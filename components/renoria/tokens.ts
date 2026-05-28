// Tokens de diseño de Renoria (portados de renoria-shared.jsx).
// Paleta en oklch para el look "golden-hour city builder".

export const T = {
  // twilight
  night900: 'oklch(0.19 0.045 260)',
  night800: 'oklch(0.25 0.05 259)',
  night700: 'oklch(0.32 0.052 257)',
  night600: 'oklch(0.41 0.05 255)',
  mist: 'oklch(0.78 0.025 250)',
  mistDim: 'oklch(0.66 0.03 252)',
  // gold
  gold: 'oklch(0.83 0.13 78)',
  goldSoft: 'oklch(0.88 0.10 82)',
  goldDeep: 'oklch(0.74 0.13 66)',
  // growth green
  green: 'oklch(0.74 0.12 150)',
  greenSoft: 'oklch(0.82 0.10 152)',
  greenDeep: 'oklch(0.62 0.11 152)',
  // ruin
  ruin: 'oklch(0.56 0.045 32)',
  ruinDim: 'oklch(0.48 0.025 28)',
  ash: 'oklch(0.52 0.012 260)',
} as const;

// Familias tipográficas (cargadas vía Google Fonts en index.html).
export const FONT_BODY = '"Nunito Sans", system-ui, sans-serif';
export const FONT_DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif';

// Tinta base de la dirección "Living Map".
export const INK = 'oklch(0.28 0.04 160)';
