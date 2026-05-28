import { useEffect, useState } from 'react';
import type { PersistedState } from '../../core/types';
import { loadState, subscribe, updateState } from '../../storage/storage';
import { buildUserRules } from '../../core/onboarding';
import { Onboarding } from '../../components/renoria/Onboarding';
import type { Selections } from '../../components/renoria/Onboarding';
import { Home } from './Home';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function App() {
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    loadState(today()).then(setState);
    return subscribe(setState);
  }, []);

  if (!state) return null;

  if (!state.onboarded) {
    const handleComplete = (selections: Selections) => {
      const userRules = buildUserRules(selections);
      updateState(today(), (s) => ({ ...s, userRules, onboarded: true })).then(setState);
    };
    return <Onboarding onComplete={handleComplete} />;
  }

  return <Home state={state} />;
}
