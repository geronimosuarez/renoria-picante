import type { CSSProperties } from 'react';
import type { OnboardingSite } from './sites';

// Stand-in del favicon: un tile redondeado con el color de marca + glifo.
export function LetterTile({
  site,
  size = 34,
  radius = 10,
  style = {},
}: {
  site: OnboardingSite;
  size?: number;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: '0 0 auto',
        background: site.color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Nunito Sans", sans-serif',
        fontWeight: 800,
        fontSize: size * (site.glyph.length > 1 ? 0.34 : 0.46),
        letterSpacing: '-0.01em',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
        ...style,
      }}
    >
      {site.glyph}
    </div>
  );
}
