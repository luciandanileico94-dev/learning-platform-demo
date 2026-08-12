import type { Course, DemoProgress, Exercise, Lesson, Subject } from './contracts';

const linearExercises: Exercise[] = [
  { kind: 'choice', prompt: 'Care este primul pas pentru 3x + 5 = 20?', options: ['Scad 5 din ambele părți', 'Împart direct la 3', 'Adun 5 la ambele părți'], answer: 0, explanation: 'Termenul +5 trebuie eliminat întâi. Scăzând 5 din ambele părți obții 3x = 15 și păstrezi balanța.' },
  { kind: 'numeric', prompt: 'Completează: 3x = 15, deci x =', answer: '5', explanation: 'Împarți ambele părți la 3: x = 15 ÷ 3 = 5.' },
  { kind: 'steps', prompt: 'Alege pașii în ordinea corectă pentru 2x - 4 = 10.', options: ['Adun 4 la ambele părți', 'Obțin 2x = 14', 'Împart la 2 și obțin x = 7'], answer: '0,1,2', explanation: 'Întâi inversezi scăderea cu +4, apoi simplifici la 2x = 14, iar la final împarți la 2.' },
];

const fractionExercises: Exercise[] = [
  { kind: 'choice', prompt: 'Care fracție este echivalentă cu 1/2?', options: ['2/4', '2/3', '3/4'], answer: 0, explanation: 'Înmulțind numărătorul și numitorul cu 2 obții 2/4, aceeași valoare.' },
  { kind: 'numeric', prompt: 'Cât este 1/2 + 1/2?', answer: '1', explanation: 'Două jumătăți formează un întreg: 1/2 + 1/2 = 1.' },
  { kind: 'steps', prompt: 'Alege pașii pentru 1/3 + 1/3.', options: ['Păstrez numitorul 3', 'Adun numărătorii: 1 + 1 = 2', 'Obțin 2/3'], answer: '0,1,2', explanation: 'Când numitorii sunt egali, îi păstrezi și aduni numărătorii.' },
];

const functionsExercises: Exercise[] = [
  { kind: 'choice', prompt: 'Dacă f(x) = x + 2, cât este f(3)?', options: ['5', '6', '1'], answer: 0, explanation: 'Înlocuiești x cu 3: f(3) = 3 + 2 = 5.' },
  { kind: 'numeric', prompt: 'Pentru f(x) = 2x, f(4) =', answer: '8', explanation: 'Înmulțești 2 cu 4 și obții 8.' },
  { kind: 'steps', prompt: 'Alege pașii pentru f(5) = 5 + 2.', options: ['Scriu formula f(x) = x + 2', 'Înlocuiesc x cu 5', 'Calculez 5 + 2 = 7'], answer: '0,1,2', explanation: 'Aplici formula, înlocuiești valoarea și calculezi rezultatul.' },
];

const lessonOf = (id: string, order: number, title: string, subtitle: string, exercises: Exercise[]): Lesson => ({
  id, order, title, subtitle, duration: 8, xp: 30, exercises,
  teachingCards: [
    { title: 'Construiește ideea', body: 'Învață conceptul printr-un exemplu simplu. Fiecare pas are un motiv și poate fi verificat.' },
    { title: 'Verifică în practică', body: 'Aplică ideea într-un exercițiu scurt. Dacă greșești, explicația rămâne aproape și poți încerca din nou.' },
  ],
});

export const subjects: Subject[] = [
  { id: 'math', title: 'Matematică', icon: '➗' },
  { id: 'science', title: 'Științe', icon: '◌' },
];

export const courses: Course[] = [
  { id: 'math-foundations', subjectId: 'math', title: 'Matematică pentru gimnaziu', description: 'Ecuații, fracții și funcții explicate prin pași clari și exerciții scurte.', level: 'CLASA A VIII-A', duration: 24, icon: '➗', lessons: [lessonOf('linear-equations', 1, 'Ecuații liniare', 'Ecuații și necunoscute', linearExercises), lessonOf('fractions-basics', 2, 'Fracții fără stres', 'Operații cu fracții', fractionExercises), lessonOf('functions-intro', 3, 'Introducere în funcții', 'Valori și formule', functionsExercises)] },
  { id: 'science-basics', subjectId: 'science', title: 'Științe: cum observăm lumea', description: 'Noțiuni introductive despre observație, măsurare și explicații bazate pe dovezi.', level: 'NIVEL INTRODUCTIV', duration: 16, icon: '◌', lessons: [lessonOf('science-observation', 1, 'Observă și notează', 'Metoda observației', linearExercises), lessonOf('science-measurement', 2, 'Măsurarea corectă', 'Unități și comparații', fractionExercises)] },
];

export const lesson = courses[0].lessons[0];
export const STORAGE_KEY = 'learningo-product-v1';
const emptyProgress = (): DemoProgress => ({ xp: 0, streak: 0, completedLessonIds: [], lessonDone: false });

export function readProgress(): DemoProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<DemoProgress>;
    const completedLessonIds = Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds.filter((id): id is string => typeof id === 'string') : [];
    return { ...emptyProgress(), ...parsed, completedLessonIds, lessonDone: Boolean(parsed.lessonDone || completedLessonIds.length) };
  } catch { return emptyProgress(); }
}

export function getCourseById(id: string) { return courses.find((course) => course.id === id); }
export function getLessonById(id: string) { return courses.flatMap((course) => course.lessons).find((item) => item.id === id); }
export function getCourseProgress(course: Course, progress: DemoProgress) {
  const completed = course.lessons.filter((item) => progress.completedLessonIds.includes(item.id)).length;
  return { completed, total: course.lessons.length, percent: course.lessons.length ? Math.round((completed / course.lessons.length) * 100) : 0 };
}
