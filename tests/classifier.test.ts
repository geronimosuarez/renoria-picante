import { describe, expect, it } from 'vitest';
import { classify, domainFromUrl } from '../core/classifier';
import type { CategoryRule } from '../core/types';

describe('domainFromUrl', () => {
  it('extrae el dominio sin www', () => {
    expect(domainFromUrl('https://www.github.com/foo/bar')).toBe('github.com');
  });
  it('devuelve "" para URLs no http(s)', () => {
    expect(domainFromUrl('chrome://extensions')).toBe('');
  });
  it('devuelve "" para texto inválido', () => {
    expect(domainFromUrl('no es una url')).toBe('');
  });
});

describe('classify (100% dirigido por el usuario)', () => {
  const rules: CategoryRule[] = [
    { pattern: 'github.com', category: 'productive' },
    { pattern: 'youtube.com', category: 'distracting' },
  ];

  it('match exacto', () => {
    expect(classify('github.com', rules)).toBe('productive');
  });
  it('match de subdominio', () => {
    expect(classify('gist.github.com', rules)).toBe('productive');
  });
  it('sin reglas → neutral (no hay defaults del sistema)', () => {
    expect(classify('github.com', [])).toBe('neutral');
  });
  it('sin match → neutral', () => {
    expect(classify('example.com', rules)).toBe('neutral');
  });
  it('dominio vacío → neutral', () => {
    expect(classify('', rules)).toBe('neutral');
  });
  it('gana el primer match', () => {
    const conflicting: CategoryRule[] = [
      { pattern: 'github.com', category: 'productive' },
      { pattern: 'github.com', category: 'distracting' },
    ];
    expect(classify('github.com', conflicting)).toBe('productive');
  });
});
