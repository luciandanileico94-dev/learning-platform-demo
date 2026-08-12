import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { Progress } from '../shared/contracts';

type LearningContextValue = {
  isStatic: boolean;
  progress: Progress;
  markCourseCompleted: (courseId: string) => void;
  replaceProgress: (next: Progress) => void;
};

const initialProgress: Progress = { completedCourseIds: [], total: 6 };
const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState(initialProgress);
  const isStatic = import.meta.env.VITE_DEMO_MODE === 'static';
  const value = useMemo<LearningContextValue>(() => ({
    isStatic,
    progress,
    markCourseCompleted: (courseId) => setProgress((current) => current.completedCourseIds.includes(courseId)
      ? current
      : { ...current, completedCourseIds: [...current.completedCourseIds, courseId] }),
    replaceProgress: setProgress
  }), [isStatic, progress]);

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearningContext() {
  const context = useContext(LearningContext);
  if (!context) throw new Error('useLearningContext must be used inside LearningProvider');
  return context;
}
