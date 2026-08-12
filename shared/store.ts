import type { Course, Domain, Lesson, Level, Progress } from './contracts';

export const domains: Domain[] = [
  { id: 'clear-writing', name: 'Scriere clară', blurb: 'Idei limpezi, mesaje care se țin minte.', color: 'coral', topics: ['Structura ideii', 'Ton și ritm'] },
  { id: 'digital-thinking', name: 'Gândire digitală', blurb: 'Instrumente simple pentru decizii mai bune.', color: 'blue', topics: ['Modele mentale', 'Experimentare'] },
  { id: 'team-craft', name: 'Lucru în echipă', blurb: 'Colaborare atentă, feedback cu rost.', color: 'violet', topics: ['Feedback util', 'Ritualuri de echipă'] }
];

export const courses: Course[] = domains.flatMap((domain) => domain.topics.map((topic, i) => ({
  id: `${domain.id}-${i}`, domainId: domain.id, topic, level: i % 2 ? 'Intermediar' as Level : 'Începător' as Level,
  title: topic, lessonId: `${domain.id}-${i}-lesson`, duration: 8 + i * 2, completed: false
})));

const lessonTemplates: Record<string, { intro: string; questions: Array<{ prompt: string; options: string[]; answer: number; explanation: string }> }> = {
  'clear-writing-0': { intro: 'O idee bună devine ușor de folosit când îi vezi scheletul.', questions: [
    { prompt: 'Care este primul pas al unei idei clare?', options: ['Aleg un verb precis', 'Adaug cât mai multe detalii', 'Încep cu o concluzie vagă'], answer: 0, explanation: 'Un verb precis arată acțiunea și ține ideea în mișcare.' },
    { prompt: 'Ce face un exemplu util?', options: ['Repetă titlul', 'Arată ideea în context', 'Înlocuiește întrebarea'], answer: 1, explanation: 'Exemplul conectează ideea abstractă de o situație recognoscibilă.' },
    { prompt: 'Cum verifici un paragraf?', options: ['Îl citești cu voce tare', 'Îi numeri cuvintele', 'Îi schimbi toate fonturile'], answer: 0, explanation: 'Cititul cu voce tare scoate la iveală pauzele și formulările greoaie.' },
    { prompt: 'Ce merită eliminat?', options: ['Cuvintele care aduc sens', 'Repetițiile fără rol', 'Titlul'], answer: 1, explanation: 'Repetițiile fără rol consumă atenția fără să adauge informație.' },
    { prompt: 'Un titlu bun promite…', options: ['O direcție clară', 'O surpriză fără legătură', 'Toată lecția'], answer: 0, explanation: 'Titlul orientează cititorul fără să-i ia plăcerea de a descoperi.' }
  ] },
  'digital-thinking-0': { intro: 'În loc să ghicești, poți formula o presupunere și o poți testa.', questions: [
    { prompt: 'Ce este o ipoteză?', options: ['O presupunere verificabilă', 'Un rezultat garantat', 'O listă de sarcini'], answer: 0, explanation: 'Ipoteza devine utilă când poate fi verificată printr-un semnal observabil.' },
    { prompt: 'Ce alegi într-un experiment mic?', options: ['O singură schimbare', 'Toate schimbările deodată', 'Nicio măsurătoare'], answer: 0, explanation: 'O singură schimbare te ajută să înțelegi ce a influențat rezultatul.' },
    { prompt: 'Un semnal bun este…', options: ['Ușor de observat', 'Imposibil de măsurat', 'Întotdeauna pozitiv'], answer: 0, explanation: 'Semnalul observabil permite o decizie bazată pe dovezi.' },
    { prompt: 'După test, faci ce?', options: ['Ignori rezultatul', 'Înveți și ajustezi', 'Ștergi întrebarea'], answer: 1, explanation: 'Învățarea apare atunci când rezultatul schimbă următorul pas.' },
    { prompt: 'Decizia reversibilă este…', options: ['Ușor de schimbat', 'Secretă', 'Întotdeauna urgentă'], answer: 0, explanation: 'Pentru o decizie reversibilă poți testa rapid fără costuri mari.' }
  ] },
  'team-craft-0': { intro: 'Feedback-ul bun face munca următoare mai ușoară.', questions: [
    { prompt: 'Feedback-ul descrie mai întâi…', options: ['Observația concretă', 'Caracterul persoanei', 'O etichetă'], answer: 0, explanation: 'Observația concretă deschide o conversație despre muncă, nu despre identitate.' },
    { prompt: 'Întrebarea utilă este…', options: ['Cum ai vedea următorul pas?', 'De ce faci mereu asta?', 'Cine e de vină?'], answer: 0, explanation: 'Întrebarea despre următorul pas transformă feedback-ul în acțiune.' },
    { prompt: 'Un ritual de echipă are nevoie de…', options: ['Un scop clar', 'Cât mai multe reguli', 'O durată infinită'], answer: 0, explanation: 'Scopul clar ajută echipa să păstreze doar ritualurile care servesc munca.' },
    { prompt: 'Când asculți activ…', options: ['Reformulezi ce ai auzit', 'Pregătești replica', 'Închizi discuția'], answer: 0, explanation: 'Reformularea verifică înțelegerea înainte de a propune soluții.' },
    { prompt: 'O întâlnire se încheie cu…', options: ['Un pas următor', 'Mai multe teme nenumite', 'Tăcere'], answer: 0, explanation: 'Un pas următor vizibil leagă conversația de progres.' }
  ] }
};

export function getLesson(id: string): Lesson | undefined {
  const course = courses.find((item) => item.lessonId === id);
  if (!course) return undefined;
  const template = lessonTemplates[course.id] ?? lessonTemplates['clear-writing-0'];
  return { id, courseId: course.id, title: course.title, intro: template.intro, questions: template.questions.map((q, i) => ({ id: `${id}-q${i}`, prompt: q.prompt, options: q.options })) };
}

export function answerKey(lessonId: string, questionIndex: number): { answer: number; explanation: string } | undefined {
  const lesson = courses.find((c) => c.lessonId === lessonId);
  const template = lesson && lessonTemplates[lesson.id];
  const q = template?.questions[questionIndex];
  return q ? { answer: q.answer, explanation: q.explanation } : undefined;
}

export const progress: Progress = { completedCourseIds: [], total: courses.length };
