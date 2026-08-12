export type DemoProgress = {
  xp: number;
  streak: number;
  completedLessonIds: string[];
  lessonDone: boolean;
  lastCompletedAt?: string;
};

export type Exercise = {
  kind: 'choice' | 'numeric' | 'steps';
  prompt: string;
  options?: string[];
  answer: number | string;
  explanation: string;
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  duration: number;
  xp: number;
  teachingCards: { title: string; body: string }[];
  exercises: Exercise[];
};

export type Course = {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  icon: string;
  lessons: Lesson[];
};

export type Subject = {
  id: string;
  title: string;
  icon: string;
};
