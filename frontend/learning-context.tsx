import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { DemoProgress } from '../shared/contracts';
import { readProgress, STORAGE_KEY } from '../shared/store';

type ContextValue = { progress: DemoProgress; complete: () => void; reset: () => void };
const Context = createContext<ContextValue | null>(null);

export function LearningProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState(readProgress);
  const save = (next: DemoProgress) => { setProgress(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* no-op */ } };
  const value = useMemo(() => ({
    progress,
    complete: () => save({ xp: Math.max(progress.xp, 30), streak: Math.max(progress.streak, 3), lessonDone: true, lastCompletedAt: new Date().toISOString() }),
    reset: () => save({ xp: 0, streak: 0, lessonDone: false }),
  }), [progress]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLearningContext() {
  const value = useContext(Context);
  if (!value) throw new Error('Learning context missing');
  return value;
}
