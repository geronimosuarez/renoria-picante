import { useState } from 'react';
import type { PersistedState } from '../../core/types';
import type { MarketItem, MarketItemKey } from '../../core/market';
import { MARKET_ITEMS, costOf, ownedCount } from '../../core/market';
import { FONT_BODY, FONT_DISPLAY, INK, T } from './tokens';
import { Icon } from './Icon';

// Mercado de Renoria (lenguaje visual "Living Map"): gastá tus Renoria Points
// para construir estructuras. Portado de renoria-market.jsx; sólo presentación.
// El balance es real (`city.growthPoints`) y comprar persiste vía `onBuy`.

const MUTED = 'oklch(0.5 0.035 158)';
const CREAM = '#f3deb1';
const CREAM2 = '#ecd3a4';
const GOLD = '#ffc24d';
const CLAY = '#c2703f';

// ── Ilustraciones de preview (formas simples) ────────────────────────
function Ground({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 120 96" width="100%" height="100%">
      <ellipse cx={60} cy={82} rx={50} ry={12} fill="#1f5a36" opacity={0.35} />
      {children}
    </svg>
  );
}

const PREVIEW: Record<MarketItemKey, () => React.ReactElement> = {
  house: () => (
    <Ground>
      <rect x={38} y={46} width={44} height={36} rx={4} fill={CREAM} />
      <path d="M32 48 L60 26 L88 48 Z" fill={CLAY} />
      <rect x={54} y={60} width={13} height={22} rx={2} fill="#9a5230" />
      <rect x={44} y={54} width={9} height={9} rx={1.5} fill={GOLD} />
      <rect x={68} y={54} width={9} height={9} rx={1.5} fill={GOLD} />
    </Ground>
  ),
  building: () => (
    <Ground>
      <rect x={36} y={18} width={28} height={64} rx={4} fill={CREAM2} />
      <rect x={62} y={36} width={24} height={46} rx={4} fill={CREAM} />
      <g fill={GOLD}>
        <rect x={42} y={26} width={7} height={8} rx={1.5} />
        <rect x={52} y={26} width={7} height={8} rx={1.5} />
        <rect x={42} y={40} width={7} height={8} rx={1.5} />
        <rect x={52} y={40} width={7} height={8} rx={1.5} />
        <rect x={42} y={54} width={7} height={8} rx={1.5} />
        <rect x={52} y={54} width={7} height={8} rx={1.5} />
        <rect x={68} y={44} width={6} height={7} rx={1.5} />
        <rect x={76} y={44} width={6} height={7} rx={1.5} />
        <rect x={68} y={58} width={6} height={7} rx={1.5} />
        <rect x={76} y={58} width={6} height={7} rx={1.5} />
      </g>
    </Ground>
  ),
};

function Balance({ pts }: { pts: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        background: 'oklch(0.99 0.01 150 / 0.85)',
        borderRadius: 999,
        padding: '6px 12px 6px 8px',
        boxShadow: '0 4px 12px oklch(0.3 0.06 158 / 0.18)',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'oklch(0.9 0.09 150)',
        }}
      >
        <Icon name="sparkle" size={15} stroke={T.greenDeep} fill={T.greenDeep} />
      </div>
      {/* key={pts} reinicia la animación de pulso en cada cambio de balance */}
      <span
        key={pts}
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 17,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          display: 'inline-block',
          animation: 'bpulse .4s ease',
        }}
      >
        {pts.toLocaleString()}
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, color: T.greenDeep, marginLeft: -2 }}>pts</span>
    </div>
  );
}

function Card({
  item,
  owned,
  pts,
  onBuy,
  justBuilt,
}: {
  item: MarketItem;
  owned: number;
  pts: number;
  onBuy: () => void;
  justBuilt: boolean;
}) {
  const cost = costOf(item.base, owned);
  const afford = pts >= cost;
  const Preview = PREVIEW[item.key];
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid oklch(0.85 0.03 150)',
        boxShadow: '0 6px 16px -10px oklch(0.3 0.06 158 / 0.4)',
        position: 'relative',
      }}
    >
      {owned > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            background: T.greenDeep,
            color: '#fff',
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 999,
          }}
        >
          {'×' + owned}
        </div>
      )}
      {justBuilt && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            background: GOLD,
            color: '#3a2a10',
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 10.5,
            padding: '3px 8px',
            borderRadius: 999,
            animation: 'pop .4s ease',
          }}
        >
          Built!
        </div>
      )}
      <div
        style={{
          height: 88,
          background: 'linear-gradient(180deg, oklch(0.93 0.06 150), oklch(0.88 0.07 150))',
          padding: 8,
        }}
      >
        <Preview />
      </div>
      <div
        style={{
          padding: '10px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 16,
            color: INK,
            letterSpacing: '-0.01em',
          }}
        >
          {item.name}
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.3 }}>{item.flavor}</div>
        <button
          onClick={afford ? onBuy : undefined}
          disabled={!afford}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '9px',
            borderRadius: 11,
            border: 'none',
            cursor: afford ? 'pointer' : 'default',
            background: afford ? T.greenDeep : 'oklch(0.9 0.02 150)',
            color: afford ? '#fff' : MUTED,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 13.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: afford ? '0 6px 14px oklch(0.62 0.11 152 / 0.4)' : 'none',
          }}
        >
          {afford ? (
            <>
              <Icon name="sparkle" size={14} stroke="#fff" fill="#fff" />
              <span>{cost}</span>
            </>
          ) : (
            <>
              <Icon name="lock" size={13} stroke={MUTED} sw={2} />
              <span>{`${(cost - pts).toLocaleString()} more`}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Market({
  state,
  onBuy,
  onBack,
  onViewCity,
}: {
  state: PersistedState;
  onBuy: (key: MarketItemKey) => void;
  onBack: () => void;
  onViewCity: () => void;
}) {
  const [built, setBuilt] = useState<MarketItemKey | null>(null);
  const pts = Math.round(state.city.growthPoints);
  const total = state.city.buildings.length;

  const buy = (item: MarketItem) => {
    const cost = costOf(item.base, ownedCount(state.city.buildings, item.key));
    if (pts < cost) return;
    onBuy(item.key);
    setBuilt(item.key);
    setTimeout(() => setBuilt((b) => (b === item.key ? null : b)), 900);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT_BODY,
        color: INK,
        background:
          'radial-gradient(120% 70% at 50% 0%, oklch(0.92 0.07 150) 0%, oklch(0.85 0.09 152) 55%, oklch(0.77 0.1 154) 100%)',
      }}
    >
      {/* top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '14px 16px 8px',
          flex: '0 0 auto',
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: 'oklch(1 0 0 / 0.55)',
            color: T.greenDeep,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chevL" size={18} stroke={T.greenDeep} />
        </button>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 19,
            color: INK,
            letterSpacing: '-0.02em',
          }}
        >
          Market
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Balance pts={pts} />
        </div>
      </div>

      <p
        style={{
          margin: '0 16px 12px',
          fontSize: 13,
          color: 'oklch(0.4 0.04 158)',
          lineHeight: 1.4,
        }}
      >
        Spend your focus. Every structure makes Renoria a little more alive.
      </p>

      {/* grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          alignContent: 'start',
        }}
      >
        {MARKET_ITEMS.map((it) => (
          <Card
            key={it.key}
            item={it}
            owned={ownedCount(state.city.buildings, it.key)}
            pts={pts}
            onBuy={() => buy(it)}
            justBuilt={built === it.key}
          />
        ))}
      </div>

      {/* footer */}
      <div
        style={{
          flex: '0 0 auto',
          padding: '12px 16px 16px',
          borderTop: '1px solid oklch(1 0 0 / 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'oklch(1 0 0 / 0.25)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 15, color: INK }}>
            {total === 0 ? 'Your city awaits' : `${total} structure${total > 1 ? 's' : ''} in Renoria`}
          </div>
          <div style={{ fontSize: 11.5, color: MUTED }}>
            {pts < 45 ? 'Stay focused to earn more points' : 'Tap a structure to build it'}
          </div>
        </div>
        <button
          onClick={onViewCity}
          style={{
            padding: '11px 16px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: '#fff',
            color: T.greenDeep,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 13.5,
            boxShadow: '0 6px 14px oklch(0.3 0.06 158 / 0.18)',
          }}
        >
          View city
        </button>
      </div>

      <style>
        {'@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes bpulse{0%{transform:scale(1.25);color:' +
          T.greenDeep +
          '}100%{transform:scale(1)}}'}
      </style>
    </div>
  );
}
