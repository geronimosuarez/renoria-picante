import type { SiteCategory } from '../../core/types';

/** Sitio mostrado en el onboarding (datos de presentación: color + glifo). */
export interface OnboardingSite {
  id: string;
  name: string;
  host: string;
  color: string; // fondo del tile (hex)
  glyph: string; // 1–2 letras como stand-in del favicon
  hint: Exclude<SiteCategory, 'neutral'>; // bucket sugerido (el usuario decide)
}

// Presets curados (portados de renoria-shared.jsx). `hint` mapea el "build/ruin"
// del prototipo a las categorías reales productive/distracting.
export const PRESET_SITES: OnboardingSite[] = [
  { id: 'github', name: 'GitHub', host: 'github.com', color: '#2b3137', glyph: 'GH', hint: 'productive' },
  { id: 'notion', name: 'Notion', host: 'notion.so', color: '#1f1f1f', glyph: 'N', hint: 'productive' },
  { id: 'docs', name: 'Google Docs', host: 'docs.google.com', color: '#3b6cf0', glyph: 'D', hint: 'productive' },
  { id: 'figma', name: 'Figma', host: 'figma.com', color: '#7c5cff', glyph: 'F', hint: 'productive' },
  { id: 'linear', name: 'Linear', host: 'linear.app', color: '#5b62d6', glyph: 'L', hint: 'productive' },
  { id: 'stack', name: 'Stack Overflow', host: 'stackoverflow.com', color: '#e8862c', glyph: 'SO', hint: 'productive' },
  { id: 'gmail', name: 'Gmail', host: 'mail.google.com', color: '#d9442f', glyph: 'M', hint: 'productive' },
  { id: 'cal', name: 'Calendar', host: 'calendar.google.com', color: '#3b6cf0', glyph: 'C', hint: 'productive' },
  { id: 'wiki', name: 'Wikipedia', host: 'wikipedia.org', color: '#2c2c2c', glyph: 'W', hint: 'productive' },
  { id: 'tiktok', name: 'TikTok', host: 'tiktok.com', color: '#1c1c20', glyph: 'TT', hint: 'distracting' },
  { id: 'instagram', name: 'Instagram', host: 'instagram.com', color: '#c43089', glyph: 'IG', hint: 'distracting' },
  { id: 'youtube', name: 'YouTube', host: 'youtube.com', color: '#d33028', glyph: 'YT', hint: 'distracting' },
  { id: 'x', name: 'X', host: 'x.com', color: '#26282b', glyph: 'X', hint: 'distracting' },
  { id: 'reddit', name: 'Reddit', host: 'reddit.com', color: '#e0561f', glyph: 'R', hint: 'distracting' },
  { id: 'facebook', name: 'Facebook', host: 'facebook.com', color: '#2b6ad0', glyph: 'f', hint: 'distracting' },
  { id: 'netflix', name: 'Netflix', host: 'netflix.com', color: '#b8252b', glyph: 'NF', hint: 'distracting' },
  { id: 'twitch', name: 'Twitch', host: 'twitch.tv', color: '#7d49d6', glyph: 'TW', hint: 'distracting' },
];

const CUSTOM_PALETTE = ['#3f8a4f', '#7a8c3f', '#3f7a8c', '#8c5f3f', '#5f3f8c'];

/** Construye un OnboardingSite a partir de texto libre escrito por el usuario. */
export function makeCustomSite(raw: string, index: number): OnboardingSite | null {
  const name = raw.trim();
  if (!name) return null;
  const clean = name.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const host = clean.split('/')[0];
  return {
    id: 'c' + index + '-' + host,
    name: host.split('.')[0].replace(/^\w/, (c) => c.toUpperCase()),
    host,
    color: CUSTOM_PALETTE[index % CUSTOM_PALETTE.length],
    glyph: (clean[0] || '?').toUpperCase(),
    hint: 'productive',
  };
}
