import type { Exercise } from './contracts';

export const lesson = {
  title: 'Ecuații liniare',
  subtitle: 'Clasa a VIII-a · Matematică',
  teachingCards: [
    { title: 'Izolează necunoscuta', body: 'O ecuație este ca o balanță: orice faci într-o parte, faci și în cealaltă. Pentru 3x + 5 = 20, scade 5 din ambele părți, apoi împarte la 3.' },
    { title: 'Verifică rezultatul', body: 'Înlocuiește x în ecuația inițială. Dacă 3 · 5 + 5 = 20, rezultatul este corect. Verificarea te ajută să găsești rapid o greșeală de calcul.' },
  ],
  exercises: [
    {
      kind: 'choice', prompt: 'Care este primul pas pentru 3x + 5 = 20?',
      options: ['Scad 5 din ambele părți', 'Împart direct la 3', 'Adun 5 la ambele părți'],
      answer: 0, explanation: 'Termenul +5 trebuie eliminat întâi. Scăzând 5 din ambele părți obții 3x = 15 și păstrezi balanța.',
    },
    {
      kind: 'numeric', prompt: 'Completează: 3x = 15, deci x =', answer: '5',
      explanation: 'Împarți ambele părți la 3: x = 15 ÷ 3 = 5.',
    },
    {
      kind: 'steps', prompt: 'Alege pașii în ordinea corectă pentru 2x - 4 = 10.',
      options: ['Adun 4 la ambele părți', 'Obțin 2x = 14', 'Împart la 2 și obțin x = 7'],
      answer: '0,1,2', explanation: 'Întâi inversezi scăderea cu +4, apoi simplifici la 2x = 14, iar la final împarți la 2. Ordinea păstrează echilibrul ecuației.',
    },
  ] satisfies Exercise[],
};

export const STORAGE_KEY = 'learningo-portfolio-demo';

export function readProgress(): import('./contracts').DemoProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { xp: 0, streak: 0, lessonDone: false, ...JSON.parse(raw) };
  } catch { /* storage can be unavailable in private browsing */ }
  return { xp: 0, streak: 0, lessonDone: false };
}
