import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { CityBuilding } from '../../core/types';
import { createCity } from './createCity';

// Monta la ciudad three.js dentro de un div que llena su contenedor.
export function CityCanvas({
  buildings = [{ type: 'house' }],
  ruinLevel = 0.18,
  seed = 7,
  style = {},
}: {
  buildings?: CityBuilding[];
  ruinLevel?: number;
  seed?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Re-montamos sólo cuando cambian los tipos de construcción (no su identidad).
  const sig = buildings.map((b) => b.type).join(',');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inst: { dispose(): void } | undefined;
    try {
      inst = createCity(el, { buildings, ruinLevel, seed });
    } catch (err) {
      // Sin contexto WebGL (p.ej. en tests jsdom) la ciudad no se monta.
      console.warn('Renoria: no se pudo montar la ciudad 3D', err);
    }
    return () => inst?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, ruinLevel, seed]);

  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }} />;
}
