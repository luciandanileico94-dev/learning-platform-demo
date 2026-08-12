export type DemoProgress = {
  xp: number;
  streak: number;
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
