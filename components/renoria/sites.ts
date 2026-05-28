import { CURATED_SITES } from '../../core/curated';

/** Sitio mostrado en el onboarding (curated seed + datos de presentación). */
export interface OnboardingSite {
  id: string;
  name: string;
  host: string; // = pattern del CuratedSite
  color: string; // fondo del tile (hex)
  glyph: string; // 1–3 letras como stand-in del favicon
}

// Metadata de presentación por dominio. El QUÉ sitios + sugerencia vive en
// core/curated.ts (modelo de datos); acá solo el cómo se ven.
const PRESENTATION: Record<string, { name: string; color: string; glyph: string }> = {
  'github.com': { name: 'GitHub', color: '#2b3137', glyph: 'GH' },
  'stackoverflow.com': { name: 'Stack Overflow', color: '#e8862c', glyph: 'SO' },
  'developer.mozilla.org': { name: 'MDN', color: '#2c2c2c', glyph: 'MDN' },
  'docs.google.com': { name: 'Google Docs', color: '#3b6cf0', glyph: 'D' },
  'notion.so': { name: 'Notion', color: '#1f1f1f', glyph: 'N' },
  'linear.app': { name: 'Linear', color: '#5b62d6', glyph: 'L' },
  'figma.com': { name: 'Figma', color: '#7c5cff', glyph: 'F' },
  'chatgpt.com': { name: 'ChatGPT', color: '#10a37f', glyph: 'AI' },
  'youtube.com': { name: 'YouTube', color: '#d33028', glyph: 'YT' },
  'instagram.com': { name: 'Instagram', color: '#c43089', glyph: 'IG' },
  'tiktok.com': { name: 'TikTok', color: '#1c1c20', glyph: 'TT' },
  'x.com': { name: 'X', color: '#26282b', glyph: 'X' },
  'twitter.com': { name: 'Twitter', color: '#1d9bf0', glyph: 'TW' },
  'facebook.com': { name: 'Facebook', color: '#2b6ad0', glyph: 'f' },
  'reddit.com': { name: 'Reddit', color: '#e0561f', glyph: 'R' },
  'netflix.com': { name: 'Netflix', color: '#b8252b', glyph: 'NF' },
};

function fallbackPresentation(pattern: string) {
  const base = pattern.replace(/^www\./, '').split('.')[0];
  return {
    name: base.replace(/^\w/, (c) => c.toUpperCase()),
    color: '#3f8a4f',
    glyph: (base[0] || '?').toUpperCase(),
  };
}

/** Sitios curados como aparecen en el onboarding (derivados de CURATED_SITES). */
export const PRESET_SITES: OnboardingSite[] = CURATED_SITES.map((c) => {
  const p = PRESENTATION[c.pattern] ?? fallbackPresentation(c.pattern);
  return { id: c.pattern, host: c.pattern, ...p };
});

const CUSTOM_PALETTE = ['#3f8a4f', '#7a8c3f', '#3f7a8c', '#8c5f3f', '#5f3f8c'];

/** Construye un OnboardingSite a partir de texto libre escrito por el usuario. */
export function makeCustomSite(raw: string, index: number): OnboardingSite | null {
  const name = raw.trim();
  if (!name) return null;
  const clean = name.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const host = clean.split('/')[0];
  if (!host) return null;
  return {
    id: 'c' + index + '-' + host,
    name: host.split('.')[0].replace(/^\w/, (c) => c.toUpperCase()),
    host,
    color: CUSTOM_PALETTE[index % CUSTOM_PALETTE.length],
    glyph: (clean[0] || '?').toUpperCase(),
  };
}
