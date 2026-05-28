import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { FONT_BODY, FONT_DISPLAY, INK, T } from './tokens';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { LetterTile } from './LetterTile';
import { CityCanvas } from './CityCanvas';
import { useCountUp } from './useCountUp';
import { PRESET_SITES, makeCustomSite } from './sites';
import type { OnboardingSite } from './sites';
import type { SiteCategory } from '../../core/types';

// Dirección 3 · "Living Map" — verdes de crecimiento, Bricolage Grotesque.
// Desliza cada sitio: derecha lo construye (productive), izquierda lo drena
// (distracting). Welcome → swipe deck → ciudad 3D con HUD de puntos.
//
// Modelo de datos (ver classifier-onboarding-design.md): el usuario solo
// elige productive/distracting; todo lo que no ordene queda neutral (sin
// regla). La salida es `Selections` keyeado por dominio.

type Bucket = 'productive' | 'distracting';
type Assign = Record<string, Bucket>;

/** Selecciones del onboarding keyeadas por dominio. */
export type Selections = Record<string, SiteCategory>;

// ── Nav ──────────────────────────────────────────────────────────────
function Nav({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '14px 16px',
        flex: '0 0 auto',
        position: 'relative',
        zIndex: 3,
      }}
    >
      {step > 0 && (
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
      )}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          background: T.greenDeep,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="leaf" size={14} stroke="#fff" />
      </div>
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 18,
          color: INK,
          letterSpacing: '-0.02em',
        }}
      >
        Renoria
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: i === step ? 16 : 7,
              height: 7,
              borderRadius: 4,
              background: i <= step ? T.greenDeep : 'oklch(1 0 0 / 0.45)',
              transition: 'all .3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step 0 · Welcome ──────────────────────────────────────────────────
function Pill({ icon, tint, bg, label }: { icon: IconName; tint: string; bg: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        background: bg,
        padding: '9px 13px',
        borderRadius: 12,
        fontSize: 12.5,
        fontWeight: 700,
        color: tint,
      }}
    >
      <Icon name={icon} size={16} stroke={tint} />
      {label}
    </div>
  );
}

function Welcome() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 28px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'oklch(1 0 0 / 0.5)',
          padding: '6px 12px',
          borderRadius: 999,
          alignSelf: 'flex-start',
          fontSize: 12,
          fontWeight: 800,
          color: T.greenDeep,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green }} />
        A CITY THAT GROWS WITH YOU
      </div>
      <h1
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 42,
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: INK,
          margin: '18px 0 0',
        }}
      >
        Grow Renoria,
        <br />
        one focused
        <br />
        hour at a time.
      </h1>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: 'oklch(0.4 0.04 158)',
          margin: '16px 0 0',
          maxWidth: 290,
        }}
      >
        Time on what matters makes your city flourish. Time lost to the feed lets it slip into ruin.
        Watch it live in your browser.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
        <Pill icon="leaf" tint={T.greenDeep} bg="oklch(0.88 0.09 150)" label="Productive → grows" />
        <Pill
          icon="crumble"
          tint="oklch(0.45 0.04 40)"
          bg="oklch(0.86 0.02 80)"
          label="Distracting → fades"
        />
      </div>
    </div>
  );
}

// ── Step 1 · Swipe deck ───────────────────────────────────────────────
function Card({
  site,
  dx,
  dragging,
  flying,
  onDown,
}: {
  site: OnboardingSite;
  dx: number;
  dragging: boolean;
  flying: number;
  onDown: (ev: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const t = flying ? flying * 520 : dx;
  const rot = t * 0.045;
  const hint: Bucket | null = t > 30 ? 'productive' : t < -30 ? 'distracting' : null;
  const good = hint === 'productive';
  const stampStyle: CSSProperties = {
    position: 'absolute',
    top: 22,
    padding: '7px 14px',
    borderRadius: 10,
    fontFamily: FONT_DISPLAY,
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: '0.04em',
    transform: `rotate(${good ? -12 : 12}deg)`,
    opacity: Math.min(1, Math.abs(t) / 90),
    color: good ? T.greenDeep : 'oklch(0.5 0.05 35)',
    border: `3px solid ${good ? T.greenDeep : 'oklch(0.5 0.05 35)'}`,
    [good ? 'left' : 'right']: 22,
  };
  return (
    <div
      onPointerDown={onDown}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 22,
        background: '#fff',
        cursor: 'grab',
        boxShadow: '0 18px 40px -10px oklch(0.4 0.08 150 / 0.4)',
        userSelect: 'none',
        touchAction: 'none',
        transform: `translateX(${t}px) rotate(${rot}deg)`,
        transition: dragging ? 'none' : 'transform .3s cubic-bezier(.2,.8,.2,1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
        }}
      >
        <LetterTile
          site={site}
          size={84}
          radius={22}
          style={{ fontSize: 34, boxShadow: '0 8px 20px oklch(0 0 0 / 0.18)' }}
        />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 24,
              color: INK,
              letterSpacing: '-0.02em',
            }}
          >
            {site.name}
          </div>
          <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 160)', marginTop: 3 }}>{site.host}</div>
        </div>
      </div>
      {hint && <div style={stampStyle}>{good ? 'BUILDS' : 'DRAINS'}</div>}
    </div>
  );
}

function deckBehind(i: number): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    borderRadius: 22,
    background: '#fff',
    opacity: 0.55,
    transform: `translateY(${i * 9}px) scale(${1 - i * 0.04})`,
    boxShadow: '0 8px 20px -8px oklch(0.4 0.08 150 / 0.3)',
  };
}

function Tally({ tint, bg, label, n }: { tint: string; bg: string; label: string; n: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: bg,
        borderRadius: 12,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: tint, lineHeight: 1 }}>
        {n}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: tint }}>{label}</span>
    </div>
  );
}

function Action({ kind, onClick }: { kind: Bucket; onClick: () => void }) {
  const good = kind === 'productive';
  const tint = good ? T.greenDeep : 'oklch(0.5 0.05 38)';
  return (
    <button
      onClick={onClick}
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: `2px solid ${tint}`,
        cursor: 'pointer',
        background: '#fff',
        color: tint,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 18px color-mix(in oklch, ${tint} 28%, transparent)`,
      }}
    >
      <Icon name={good ? 'leaf' : 'crumble'} size={26} stroke={tint} />
    </button>
  );
}

function Sort({
  sites,
  assign,
  last,
  onCommit,
  onUndo,
  onAddCustom,
}: {
  sites: OnboardingSite[];
  assign: Assign;
  last: string | null;
  onCommit: (id: string, kind: Bucket) => void;
  onUndo: () => void;
  onAddCustom: (raw: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [drag, setDrag] = useState({ dx: 0, dragging: false });
  const [flying, setFlying] = useState(0);
  const start = useRef(0);

  const pool = sites.filter((s) => !assign[s.id]);
  const done = sites.length - pool.length;
  const bCount = sites.filter((s) => assign[s.id] === 'productive').length;
  const rCount = sites.filter((s) => assign[s.id] === 'distracting').length;
  const current = pool[0];

  const commit = (kind: Bucket) => {
    if (!current || flying) return;
    setFlying(kind === 'productive' ? 1 : -1);
    setTimeout(() => {
      onCommit(current.id, kind);
      setFlying(0);
      setDrag({ dx: 0, dragging: false });
    }, 280);
  };

  const onDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (flying) return;
    start.current = ev.clientX;
    setDrag({ dx: 0, dragging: true });
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const move = (e2: PointerEvent) => setDrag({ dx: e2.clientX - start.current, dragging: true });
    const up = (e2: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const d = e2.clientX - start.current;
      if (Math.abs(d) > 78) commit(d > 0 ? 'productive' : 'distracting');
      else setDrag({ dx: 0, dragging: false });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const submitDraft = () => {
    onAddCustom(draft);
    setDraft('');
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* tallies */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 10px', flex: '0 0 auto' }}>
        <Tally tint={T.greenDeep} bg="oklch(0.9 0.08 150)" label="Building" n={bCount} />
        <div
          style={{
            flex: '0 0 auto',
            alignSelf: 'center',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: 'oklch(0.4 0.04 158)',
          }}
        >
          {done}/{sites.length}
        </div>
        <Tally tint="oklch(0.48 0.05 38)" bg="oklch(0.87 0.02 70)" label="Fading" n={rCount} />
      </div>
      {/* deck */}
      <div style={{ flex: 1, position: 'relative', margin: '2px 22px 6px', minHeight: 0 }}>
        {current ? (
          <>
            {pool[2] && <div style={deckBehind(2)} />}
            {pool[1] && <div style={deckBehind(1)} />}
            <Card
              key={current.id}
              site={current}
              dx={drag.dx}
              dragging={drag.dragging}
              flying={flying}
              onDown={onDown}
            />
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 22,
              background: 'oklch(1 0 0 / 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: T.greenDeep,
              textAlign: 'center',
              padding: 24,
            }}
          >
            <Icon name="check" size={34} stroke={T.greenDeep} />
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20 }}>
              Every site sorted!
            </div>
            <div style={{ fontSize: 13, color: 'oklch(0.45 0.04 158)' }}>
              Add more below, or meet your city.
            </div>
          </div>
        )}
      </div>
      {/* actions */}
      {current && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '2px 16px 8px',
            flex: '0 0 auto',
          }}
        >
          <Action kind="distracting" onClick={() => commit('distracting')} />
          <button
            onClick={onUndo}
            disabled={!last}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              cursor: last ? 'pointer' : 'default',
              background: 'oklch(1 0 0 / 0.5)',
              color: last ? INK : 'oklch(0.6 0.02 160)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: last ? 1 : 0.5,
            }}
          >
            <Icon name="undo" size={18} />
          </button>
          <Action kind="productive" onClick={() => commit('productive')} />
        </div>
      )}
      {/* add your own */}
      <div style={{ padding: '8px 16px 6px', flex: '0 0 auto', display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => ev.key === 'Enter' && submitDraft()}
          placeholder="Add a site to sort…"
          style={{
            flex: 1,
            background: 'oklch(1 0 0 / 0.6)',
            border: '1px solid oklch(0.55 0.06 150 / 0.3)',
            borderRadius: 11,
            padding: '9px 13px',
            color: INK,
            fontFamily: FONT_BODY,
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={submitDraft}
          style={{
            width: 38,
            borderRadius: 11,
            border: 'none',
            cursor: 'pointer',
            background: T.greenDeep,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="plus" size={18} stroke="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Step 2 · City peek + points HUD ───────────────────────────────────
function Peek({ sites, assign }: { sites: OnboardingSite[]; assign: Assign }) {
  const b = sites.filter((s) => assign[s.id] === 'productive').length;
  const r = sites.filter((s) => assign[s.id] === 'distracting').length;

  // ── PUNTOS ──────────────────────────────────────────────────────────
  // En la extensión real esto lo maneja el tiempo: minutos en sitios
  // productivos suman, minutos en sitios distractores restan. En el
  // onboarding sembramos un bono fundacional que escala con cuántos sitios
  // eligió hacer crecer. Reemplazar `points` por el valor real (CityState).
  const NEXT_LANDMARK = 100;
  const points = 20 + b * 6;
  const shown = useCountUp(points, 1100);
  const pct = Math.min(100, (points / NEXT_LANDMARK) * 100);

  return (
    <div style={{ flex: 1, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, oklch(0.84 0.08 150) 0%, oklch(0.62 0.1 152) 60%, oklch(0.42 0.08 158) 100%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0 }}>
        <CityCanvas ruinLevel={r > 0 ? Math.min(0.4, r / (b + r + 1)) : 0.1} seed={31} />
      </div>
      {/* points HUD */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          margin: '4px 14px 0',
          padding: '12px 14px',
          borderRadius: 16,
          background: 'oklch(0.99 0.01 150 / 0.82)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px oklch(0.3 0.06 158 / 0.28)',
          border: '1px solid oklch(1 0 0 / 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
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
                whiteSpace: 'nowrap',
              }}
            >
              {shown.toLocaleString()}
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
                whiteSpace: 'nowrap',
              }}
            >
              RENORIA POINTS
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              flex: '0 0 auto',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: T.greenDeep,
                background: 'oklch(0.9 0.09 150)',
                padding: '3px 7px',
                borderRadius: 7,
                whiteSpace: 'nowrap',
              }}
            >
              + focused time
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'oklch(0.5 0.05 36)',
                background: 'oklch(0.9 0.025 60)',
                padding: '3px 7px',
                borderRadius: 7,
                whiteSpace: 'nowrap',
              }}
            >
              − time lost
            </span>
          </div>
        </div>
        {/* progress to next landmark */}
        <div style={{ marginTop: 11 }}>
          <div
            style={{
              height: 7,
              borderRadius: 4,
              background: 'oklch(0.86 0.03 150)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: pct + '%',
                borderRadius: 4,
                background: `linear-gradient(90deg, ${T.green}, ${T.greenDeep})`,
                transition: 'width 1.1s cubic-bezier(.2,.8,.2,1)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 5,
              fontSize: 10.5,
              fontWeight: 700,
              color: 'oklch(0.5 0.04 158)',
            }}
          >
            <span>Founding bonus</span>
            <span>Next landmark · {NEXT_LANDMARK} pts</span>
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 'auto',
          position: 'relative',
          zIndex: 3,
          padding: '60px 22px 6px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, transparent, oklch(0.32 0.06 158 / 0.7) 55%)',
        }}
      >
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 26,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Renoria is alive
        </h2>
        <p style={{ fontSize: 13, color: '#fff', margin: '6px 0 0', lineHeight: 1.5 }}>
          {b} sites growing it · {r} held in check
        </p>
      </div>
    </div>
  );
}

// ── Host ──────────────────────────────────────────────────────────────
export function Onboarding({ onComplete }: { onComplete: (selections: Selections) => void }) {
  const [step, setStep] = useState(0);
  const [assign, setAssign] = useState<Assign>({});
  const [custom, setCustom] = useState<OnboardingSite[]>([]);
  const [last, setLast] = useState<string | null>(null);
  const customCount = useRef(0);

  const sites = [...PRESET_SITES, ...custom];

  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(2, s + 1));

  const commit = (id: string, kind: Bucket) => {
    setAssign((a) => ({ ...a, [id]: kind }));
    setLast(id);
  };
  const undo = () => {
    if (!last) return;
    setAssign((a) => {
      const copy = { ...a };
      delete copy[last];
      return copy;
    });
    setLast(null);
  };
  const addCustom = (raw: string) => {
    const site = makeCustomSite(raw, customCount.current++);
    if (site) setCustom((c) => [...c, site]);
  };

  const finish = () => {
    // Solo los sitios ordenados generan selección; los no ordenados (skipped)
    // quedan fuera → neutrales → sin regla.
    const selections: Selections = {};
    for (const s of sites) {
      const a = assign[s.id];
      if (a) selections[s.host] = a;
    }
    onComplete(selections);
  };

  const labels = ["Let's build", 'Meet my city', 'Enter Renoria'];

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
          'radial-gradient(120% 70% at 50% 0%, oklch(0.92 0.07 150) 0%, oklch(0.86 0.09 152) 50%, oklch(0.78 0.1 154) 100%)',
      }}
    >
      <Nav step={step} onBack={back} />
      {step === 0 && <Welcome />}
      {step === 1 && (
        <Sort
          sites={sites}
          assign={assign}
          last={last}
          onCommit={commit}
          onUndo={undo}
          onAddCustom={addCustom}
        />
      )}
      {step === 2 && <Peek sites={sites} assign={assign} />}
      <div style={{ padding: '10px 16px 16px', position: 'relative', zIndex: 4, flex: '0 0 auto' }}>
        <button
          onClick={() => (step < 2 ? next() : finish())}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            background: T.greenDeep,
            color: '#fff',
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 10px 24px oklch(0.62 0.11 152 / 0.45)',
          }}
        >
          {labels[step]}
          <Icon name={step === 2 ? 'sparkle' : 'arrowRight'} size={18} stroke="#fff" />
        </button>
      </div>
    </div>
  );
}
