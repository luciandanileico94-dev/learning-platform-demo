import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AnswerResponse, Course, Domain, Lesson, Progress } from '../shared/contracts';
import { answerKey, courses as localCourses, domains as localDomains, getLesson } from '../shared/store';
import './styles.css';

type Catalog = { domains: Domain[]; courses: Course[] };
const localProgress: Progress = { completedCourseIds: [], total: 6 };
const api = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error('Nu am putut încărca datele.');
  return response.json() as Promise<T>;
};

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('Toate nivelurile');
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState(0);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(localProgress);
  const [error, setError] = useState('');

  useEffect(() => { api<Catalog>('/courses').then(setCatalog).catch(() => { setCatalog({ domains: localDomains, courses: localCourses }); setError('Modul local: API indisponibil, datele demo sunt folosite.'); }); }, []);
  const courses = useMemo(() => (catalog?.courses ?? []).filter((item) => (selectedDomain === 'all' || item.domainId === selectedDomain) && (selectedLevel === 'Toate nivelurile' || item.level === selectedLevel)), [catalog, selectedDomain, selectedLevel]);
  const choose = async (item: Course) => { setCourse(item); setQuestion(0); setAnswer(null); setScore(0); setDone(false); try { setLesson(await api<Lesson>(`/lessons/${item.lessonId}`)); } catch { setLesson(getLesson(item.lessonId) ?? null); } };
  const submit = async (optionIndex: number) => { if (!lesson || answer) return; try { setAnswer(await api<AnswerResponse>(`/lessons/${lesson.id}/answer`, { method: 'POST', body: JSON.stringify({ questionIndex: question, optionIndex }) })); } catch { const key = answerKey(lesson.id, question); if (key) setAnswer({ correct: key.answer === optionIndex, explanation: key.explanation, correctOption: key.answer, score: key.answer === optionIndex ? 1 : 0 }); } };
  const next = async () => { if (!lesson || !answer || !course) return; setScore((s) => s + answer.score); if (question < lesson.questions.length - 1) { setQuestion((n) => n + 1); setAnswer(null); } else { setDone(true); try { setProgress(await api<Progress>(`/courses/${course.id}/complete`, { method: 'POST' })); } catch { setProgress((p) => ({ ...p, completedCourseIds: p.completedCourseIds.includes(course.id) ? p.completedCourseIds : [...p.completedCourseIds, course.id] })); } } };
  const reset = () => { setCourse(null); setLesson(null); setDone(false); setAnswer(null); setQuestion(0); setScore(0); setSelectedDomain('all'); setSelectedLevel('Toate nivelurile'); };
  if (!catalog) return <main className="shell"><p className="eyebrow">ATELIER / ÎNVĂȚARE</p><h1>Idei mici.<br /><em>Progres real.</em></h1><p className="muted">Se pregătește catalogul…</p></main>;
  return <main className="shell">
    <header><div className="brand"><span className="mark">✳</span> Atelier de învățare</div><div className="progress"><span>PROGRES</span><strong>{progress.completedCourseIds.length}/{progress.total}</strong></div></header>
    {error && <div className="notice" role="status">{error}</div>}
    {!course && <><section className="hero"><p className="eyebrow">UN LOC PENTRU CURIOSITATE</p><h1>Învață ceva mic.<br /><em>Construiește ceva mare.</em></h1><p>Un catalog sintetic de lecții scurte pentru idei mai clare, experimente mai bune și echipe mai atente.</p></section><nav className="filters" aria-label="Filtre catalog"><div className="tabs">{[{id:'all',name:'Toate'}, ...catalog.domains].map((d) => <button className={selectedDomain === d.id ? 'active' : ''} onClick={() => setSelectedDomain(d.id)} key={d.id}>{d.name}</button>)}</div><label>NIVEL <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}><option>Toate nivelurile</option><option>Începător</option><option>Intermediar</option></select></label></nav><section className="cards" aria-label="Lecții disponibile">{courses.map((item) => <button className="card" key={item.id} onClick={() => choose(item)}><span className={`dot ${(catalog.domains.find((d) => d.id === item.domainId)?.color) ?? ''}`} /><span className="card-domain">{catalog.domains.find((d) => d.id === item.domainId)?.name}</span><h2>{item.title}</h2><p>{item.level} · {item.duration} min</p><span className="arrow">→</span>{progress.completedCourseIds.includes(item.id) && <span className="completed">Finalizat</span>}</button>)}</section></>}
    {course && lesson && !done && <section className="lesson"><button className="back" onClick={reset}>← Înapoi la catalog</button><p className="eyebrow">LECȚIA {question + 1} / {lesson.questions.length}</p><div className="lesson-heading"><h1>{lesson.title}</h1><p>{lesson.intro}</p></div><div className="question"><h2>{lesson.questions[question].prompt}</h2><div className="options">{lesson.questions[question].options.map((option, i) => <button className={answer ? i === answer.correctOption ? 'right' : 'dim' : ''} disabled={Boolean(answer)} onClick={() => submit(i)} key={option}>{option}</button>)}</div>{answer && <div className={`feedback ${answer.correct ? 'success' : 'try'}`} role="status"><strong>{answer.correct ? 'Exact.' : 'Aproape.'}</strong><span>{answer.explanation}</span><button onClick={next}>{question === lesson.questions.length - 1 ? 'Vezi rezultatul' : 'Următoarea întrebare'} →</button></div>}</div></section>}
    {course && done && <section className="result"><div className="result-icon">✦</div><p className="eyebrow">LECȚIE FINALIZATĂ</p><h1>Ai făcut loc<br /><em>unei idei noi.</em></h1><p>Ai răspuns corect la {score + (answer?.score ?? 0)} din {lesson?.questions.length ?? 0} întrebări.</p><button className="primary" onClick={reset}>Alege următoarea lecție →</button></section>}
  </main>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
