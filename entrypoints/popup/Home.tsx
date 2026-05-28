import type { PersistedState } from '../../core/types';
import { FONT_BODY, FONT_DISPLAY, INK, T } from '../../components/renoria/tokens';
import { Icon } from '../../components/renoria/Icon';
import { CityCanvas } from '../../components/renoria/CityCanvas';
import { formatDuration } from '../../components/format';

// Vista principal del popup tras el onboarding. Reusa la ciudad three.js y
// muestra los puntos de la ciudad + el resumen de foco del día.
// (El detalle completo de stats es una iteración posterior — Task 8 del plan.)
export function Home({
  state,
  onOpenMarket,
}: {
  state: PersistedState;
  onOpenMarket: () => void;
}) {
  const { city, today } = state;
  const focus = today.productiveSeconds + today.distractingSeconds;
  const ruinLevel = focus > 0 ? Math.min(0.4, today.distractingSeconds / focus) : 0.1;
  const points = Math.floor(city.coins);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT_BODY,
        color: INK,
        background:
          'linear-gradient(180deg, oklch(0.84 0.08 150) 0%, oklch(0.62 0.1 152) 60%, oklch(0.42 0.08 158) 100%)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <CityCanvas buildings={city.buildings} ruinLevel={ruinLevel} seed={31} />
      </div>

      {/* header / points */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          margin: '12px 14px 0',
          padding: '12px 14px',
          borderRadius: 16,
          background: 'oklch(0.99 0.01 150 / 0.82)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px oklch(0.3 0.06 158 / 0.28)',
          border: '1px solid oklch(1 0 0 / 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'oklch(0.9 0.09 150)',
          }}
        >
          <Icon name="sparkle" size={20} stroke={T.greenDeep} fill={T.greenDeep} />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 30,
              color: INK,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {points.toLocaleString()}
            <span style={{ fontSize: 14, fontWeight: 700, color: T.greenDeep, marginLeft: 4 }}>
              pts
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'oklch(0.5 0.04 158)',
              marginTop: 3,
            }}
          >
            RENORIA POINTS
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            textAlign: 'right',
            fontSize: 11,
            fontWeight: 700,
            color: 'oklch(0.5 0.04 158)',
          }}
        >
          Level {city.level}
          <br />
          {city.buildings.length} buildings
        </div>
      </div>

      {/* footer / today summary */}
      <div
        style={{
          marginTop: 'auto',
          position: 'relative',
          zIndex: 3,
          padding: '60px 16px 16px',
          background: 'linear-gradient(180deg, transparent, oklch(0.32 0.06 158 / 0.72) 50%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: '#fff' }}>
            Today
          </div>
          <button
            onClick={onOpenMarket}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: '#fff',
              color: T.greenDeep,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: '0 6px 14px oklch(0.3 0.06 158 / 0.28)',
            }}
          >
            <Icon name="sparkle" size={15} stroke={T.greenDeep} fill={T.greenDeep} />
            Market
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Stat label="Focused" value={formatDuration(today.productiveSeconds)} tint={T.greenSoft} />
          <Stat
            label="Distracted"
            value={formatDuration(today.distractingSeconds)}
            tint="oklch(0.78 0.07 40)"
          />
          <Stat label="Neutral" value={formatDuration(today.neutralSeconds)} tint="oklch(0.85 0.01 200)" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'oklch(1 0 0 / 0.12)',
        borderRadius: 12,
        padding: '8px 10px',
        backdropFilter: 'blur(6px)',
        border: '1px solid oklch(1 0 0 / 0.14)',
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: tint }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.92 0.02 200)' }}>{label}</div>
    </div>
  );
}
