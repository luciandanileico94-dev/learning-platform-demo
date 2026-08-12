export type Domain = { id: string; name: string; blurb: string; color: string; topics: string[] };
export type Level = 'Începător' | 'Intermediar';
export type Course = { id: string; domainId: string; topic: string; level: Level; title: string; lessonId: string; duration: number; completed: boolean };
export type Question = { id: string; prompt: string; options: string[] };
export type Lesson = { id: string; courseId: string; title: string; intro: string; questions: Question[] };
export type AnswerResponse = { correct: boolean; explanation: string; correctOption: number; score: number };
export type Progress = { completedCourseIds: string[]; total: number };
