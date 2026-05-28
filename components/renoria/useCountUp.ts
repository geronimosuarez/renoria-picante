import { useEffect, useState } from 'react';

/** Anima un número de 0 → target al montar / cuando target cambia. */
export function useCountUp(target: number, ms = 1000): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/**
 * Proyecta un balance que sube en vivo a `ratePerSecond` desde `base`, vía
 * requestAnimationFrame. Re-origina cuando `base` cambia (cada flush del SW
 * que persiste puntos) para re-sincronizar con el valor real. Con `rate` 0 se
 * queda quieto. Solo emite cuando cambia el entero mostrado, así no dispara
 * re-renders a 60fps (a 2/seg, ~2 updates por segundo).
 */
export function useLivePoints(base: number, ratePerSecond: number): number {
  const [value, setValue] = useState(base);
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const projected = base + ((t - t0) / 1000) * ratePerSecond;
      setValue((prev) => (Math.floor(projected) === Math.floor(prev) ? prev : projected));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base, ratePerSecond]);
  return value;
}
