import { useEffect, useState } from 'react';
import type { PersistedState } from '../../core/types';
import { loadState, subscribe, updateState } from '../../storage/storage';
import { buildUserRules } from '../../core/onboarding';
import { purchase } from '../../core/market';
import type { MarketItemKey } from '../../core/market';
import { Onboarding } from '../../components/renoria/Onboarding';
import type { Selections } from '../../components/renoria/Onboarding';
import { Market } from '../../components/renoria/Market';
import { Home } from './Home';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type View = 'home' | 'market';

export function App() {
  const [state, setState] = useState<PersistedState | null>(null);
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    loadState(today()).then(setState);
    const unsubscribe = subscribe(setState);
    // Pedirle al SW que persista lo acumulado al abrir el popup y cada 5s, así
    // el balance guardado alcanza a la proyección en vivo (useLivePoints) y no
    // "se resetea" al cerrar/reabrir.
    // El SW puede estar dormido o sin listener todavía: el rechazo es benigno.
    const requestFlush = () => browser.runtime.sendMessage({ type: 'FLUSH' }).catch(() => {});
    requestFlush();
    const id = setInterval(requestFlush, 5000);
    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, []);

  if (!state) return null;

  if (!state.onboarded) {
    const handleComplete = (selections: Selections) => {
      const userRules = buildUserRules(selections);
      updateState(today(), (s) => ({ ...s, userRules, onboarded: true })).then(setState);
    };
    return <Onboarding onComplete={handleComplete} />;
  }

  if (view === 'market') {
    const handleBuy = (key: MarketItemKey) => {
      updateState(today(), (s) => purchase(s, key)).then(setState);
    };
    return (
      <Market
        state={state}
        onBuy={handleBuy}
        onBack={() => setView('home')}
        onViewCity={() => setView('home')}
      />
    );
  }

  return <Home state={state} onOpenMarket={() => setView('market')} />;
}
