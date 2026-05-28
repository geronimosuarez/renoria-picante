import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createCity } from './createCity';

// Monta la ciudad three.js dentro de un div que llena su contenedor.
export function CityCanvas({
  ruinLevel = 0.18,
  seed = 7,
  style = {},
}: {
  ruinLevel?: number;
  seed?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inst: { dispose(): void } | undefined;
    try {
      inst = createCity(el, { ruinLevel, seed });
    } catch (err) {
      // Sin contexto WebGL (p.ej. en tests jsdom) la ciudad no se monta.
      console.warn('Renoria: no se pudo montar la ciudad 3D', err);
    }
    return () => inst?.dispose();
  }, [ruinLevel, seed]);

  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }} />;
}
