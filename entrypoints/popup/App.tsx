import { useEffect, useState } from 'react';
import type { CategoryRule, PersistedState } from '../../core/types';
import { loadState, subscribe, updateState } from '../../storage/storage';
import { Onboarding } from '../../components/renoria/Onboarding';
import type { OnboardingResult } from '../../components/renoria/Onboarding';
import { Home } from './Home';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convierte la elección del onboarding en overrides de categoría del usuario. */
function rulesFromOnboarding(result: OnboardingResult): CategoryRule[] {
  return [
    ...result.productive.map((pattern): CategoryRule => ({ pattern, category: 'productive' })),
    ...result.distracting.map((pattern): CategoryRule => ({ pattern, category: 'distracting' })),
  ];
}

export function App() {
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    loadState(today()).then(setState);
    return subscribe(setState);
  }, []);

  if (!state) return null;

  if (!state.onboarded) {
    const handleComplete = (result: OnboardingResult) => {
      const userRules = rulesFromOnboarding(result);
      updateState(today(), (s) => ({ ...s, userRules, onboarded: true })).then(setState);
    };
    return <Onboarding onComplete={handleComplete} />;
  }

  return <Home state={state} />;
}
