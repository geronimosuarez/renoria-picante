import type { CuratedSite } from './types';

/**
 * Lista curada de sitios comunes con una categoría sugerida.
 * Es SOLO la semilla de sugerencias del onboarding: el usuario confirma o
 * ajusta cada una. No es un fallback de clasificación — `classify` solo mira
 * las reglas del usuario (`userRules`).
 */
export const CURATED_SITES: CuratedSite[] = [
  { pattern: 'github.com', suggested: 'productive' },
  { pattern: 'stackoverflow.com', suggested: 'productive' },
  { pattern: 'developer.mozilla.org', suggested: 'productive' },
  { pattern: 'docs.google.com', suggested: 'productive' },
  { pattern: 'notion.so', suggested: 'productive' },
  { pattern: 'linear.app', suggested: 'productive' },
  { pattern: 'figma.com', suggested: 'productive' },
  { pattern: 'chatgpt.com', suggested: 'productive' },
  { pattern: 'youtube.com', suggested: 'distracting' },
  { pattern: 'instagram.com', suggested: 'distracting' },
  { pattern: 'tiktok.com', suggested: 'distracting' },
  { pattern: 'x.com', suggested: 'distracting' },
  { pattern: 'twitter.com', suggested: 'distracting' },
  { pattern: 'facebook.com', suggested: 'distracting' },
  { pattern: 'reddit.com', suggested: 'distracting' },
  { pattern: 'netflix.com', suggested: 'distracting' },
];
