import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { DemoProgress } from '../shared/contracts';
import { readProgress, STORAGE_KEY } from '../shared/store';

type ContextValue = { progress: DemoProgress; completeLesson: (lessonId: string, xp: number) => void; reset: () => void };
const Context = createContext<ContextValue | null>(null);

export function LearningProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState(readProgress);
  const save = (next: DemoProgress) => { setProgress(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* browser storage may be unavailable */ } };
  const value = useMemo(() => ({
    progress,
    completeLesson: (lessonId: string, xp: number) => {
      if (progress.completedLessonIds.includes(lessonId)) return;
      save({ ...progress, xp: progress.xp + xp, streak: Math.max(progress.streak, 3), completedLessonIds: [...progress.completedLessonIds, lessonId], lessonDone: true, lastCompletedAt: new Date().toISOString() });
    },
    reset: () => save({ xp: 0, streak: 0, completedLessonIds: [], lessonDone: false }),
  }), [progress]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLearningContext() {
  const value = useContext(Context);
  if (!value) throw new Error('Learning context missing');
  return value;
}
