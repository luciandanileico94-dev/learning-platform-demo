import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { courses, getCourseById, getCourseProgress, getLessonById, subjects } from '../shared/store';
import type { Course, Lesson } from '../shared/contracts';
import { LearningProvider, useLearningContext } from './learning-context';
import './styles.css';
import './qa-fixes.css';
import './catalog.css';

type Screen = 'home' | 'catalog' | 'course' | 'lesson' | 'done';

function Header({ onReset }: { onReset: () => void }) {
  const { progress } = useLearningContext();
  return <header className="topbar"><button className="logo" onClick={onReset} aria-label="Learningo, pagina principal"><span>✦</span> learningo</button><div className="stats"><span>⚡ {progress.xp} XP</span><span>🔥 {progress.streak} zile</span><button className="reset" onClick={onReset}>Resetează progresul</button></div></header>;
}

function CourseCard({ course, onOpen, progress }: { course: Course; onOpen: () => void; progress: ReturnType<typeof getCourseProgress> }) {
  const action = progress.completed ? 'Continuă' : 'Vezi cursul';
  return <article className="course-card"><div className="course-card-top"><span className="course-icon">{course.icon}</span><span className="course-level">{course.level}</span></div><h2>{course.title}</h2><p>{course.description}</p><div className="course-meta"><span>{course.lessons.length} lecții</span><span>{course.duration} min</span></div><div className="progress-line"><i style={{ width: `${progress.percent}%` }} /></div><div className="course-footer"><small>{progress.completed}/{progress.total} finalizate</small><button className="primary" aria-label={`${action}: ${course.title}`} onClick={onOpen}>{action} <span>→</span></button></div></article>;
}

function LessonRow({ lesson, done, onOpen }: { lesson: Lesson; done: boolean; onOpen: () => void }) {
  return <button className="lesson-row" onClick={onOpen}><span className="lesson-index">{done ? '✓' : lesson.order}</span><span className="lesson-copy"><strong>{lesson.title}</strong><small>{lesson.subtitle} · {lesson.duration} min</small></span><span className="lesson-state">{done ? 'Finalizată' : 'Deschide'} →</span></button>;
}

function DemoApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [subjectId, setSubjectId] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(courses[0].lessons[0].id);
  const [card, setCard] = useState(0);
  const [exercise, setExercise] = useState(0);
  const [feedback, setFeedback] = useState<'wrong' | 'right' | null>(null);
  const [numeric, setNumeric] = useState('');
  const [selectedStep, setSelectedStep] = useState<number[]>([]);
  const { progress, completeLesson, reset } = useLearningContext();
  const selectedCourse = getCourseById(selectedCourseId) ?? courses[0];
  const currentLesson = getLessonById(selectedLessonId) ?? selectedCourse.lessons[0];
  const currentCourse = useMemo(() => courses.find((course) => course.lessons.some((item) => item.id === currentLesson.id)) ?? selectedCourse, [currentLesson.id, selectedCourse]);
  const visibleCourses = subjectId === 'all' ? courses : courses.filter((course) => course.subjectId === subjectId);

  const resetLessonState = () => { setCard(0); setExercise(0); setFeedback(null); setNumeric(''); setSelectedStep([]); };
  const openCourse = (courseId: string) => { setSelectedCourseId(courseId); setScreen('course'); };
  const openLesson = (lessonId: string) => { setSelectedLessonId(lessonId); resetLessonState(); setScreen('lesson'); };
  const restart = () => { reset(); resetLessonState(); setScreen('home'); setSubjectId('all'); };
  const choose = (value: number | string) => {
    const answer = currentLesson.exercises[exercise].answer;
    const correct = currentLesson.exercises[exercise].kind === 'steps' ? selectedStep.join(',') === String(answer) : String(value).trim() === String(answer);
    setFeedback(correct ? 'right' : 'wrong');
  };
  const next = () => {
    if (exercise === currentLesson.exercises.length - 1) {
      completeLesson(currentLesson.id, currentLesson.xp);
      setScreen('done');
    } else {
      setExercise((value) => value + 1); setFeedback(null); setNumeric(''); setSelectedStep([]);
    }
  };
  const selectStep = (index: number) => { if (!selectedStep.includes(index)) setSelectedStep((items) => [...items, index]); };
  const currentExercise = currentLesson.exercises[exercise];
  const courseProgress = getCourseProgress(currentCourse, progress);

  return <div className="app"><Header onReset={restart} /><main>
    {screen === 'home' && <section className="welcome"><div className="kicker">LEARNINGO · ÎNVĂȚARE PERSONALĂ</div><h1>Învață prin pași mici.<br /><em>Înțelege pe bune.</em></h1><p>Descoperă lecții scurte, exersează în ritmul tău și urmărește progresul într-un singur loc.</p><button className="primary" onClick={() => setScreen('catalog')}>Vezi catalogul <span>→</span></button><div className="promise"><span>{progress.completedLessonIds.length}</span> lecții finalizate · {courses.length} cursuri · progres local</div></section>}

    {screen === 'catalog' && <section className="catalog-view"><div className="kicker">CATALOGUL TĂU</div><h1>Alege ce vrei<br /><em>să înveți.</em></h1><p className="lead">Cursuri scurte, organizate pe nivel și materie.</p><div className="catalog-filters"><button className={subjectId === 'all' ? 'filter-active' : ''} onClick={() => setSubjectId('all')}>Toate</button>{subjects.map((subject) => <button key={subject.id} className={subjectId === subject.id ? 'filter-active' : ''} onClick={() => setSubjectId(subject.id)}>{subject.icon} {subject.title}</button>)}</div><div className="course-grid">{visibleCourses.map((course) => <CourseCard key={course.id} course={course} progress={getCourseProgress(course, progress)} onOpen={() => openCourse(course.id)} />)}</div><button className="text-button" onClick={() => setScreen('home')}>← Înapoi acasă</button></section>}

    {screen === 'course' && <section className="course-view"><button className="text-button" onClick={() => setScreen('catalog')}>← Catalog</button><div className="course-hero"><span className="course-icon">{selectedCourse.icon}</span><div><div className="kicker">{selectedCourse.level} · {selectedCourse.lessons.length} LECȚII</div><h1>{selectedCourse.title}</h1><p>{selectedCourse.description}</p></div></div><div className="course-summary"><strong>{courseProgress.percent}%</strong><span>progres · {courseProgress.completed} din {courseProgress.total} lecții</span><div className="progress-line"><i style={{ width: `${courseProgress.percent}%` }} /></div></div><div className="section-heading"><div><div className="kicker">TRASEUL CURSULUI</div><h2>Lecțiile tale</h2></div></div><div className="lesson-list">{selectedCourse.lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} done={progress.completedLessonIds.includes(lesson.id)} onOpen={() => openLesson(lesson.id)} />)}</div></section>}

    {screen === 'lesson' && <section className="lesson-view"><div className="lesson-meta"><span>{currentCourse.title.toUpperCase()} · {currentLesson.subtitle.toUpperCase()}</span><span>{exercise + 1} / {currentLesson.exercises.length}</span></div><div className="bar"><i style={{ width: `${(exercise / currentLesson.exercises.length) * 100}%` }} /></div>{card < currentLesson.teachingCards.length ? <article className="teaching"><div className="card-number">0{card + 1}</div><div><div className="kicker">IDEA DE BAZĂ</div><h1>{currentLesson.teachingCards[card].title}</h1><p>{currentLesson.teachingCards[card].body}</p><button className="primary" onClick={() => setCard((value) => value + 1)}>{card === currentLesson.teachingCards.length - 1 ? 'Începe exercițiul' : 'Continuă'} <span>→</span></button></div></article> : <article className="exercise"><div className="kicker">EXERCIȚIUL {exercise + 1}</div><h1>{currentExercise.prompt}</h1>{currentExercise.kind === 'choice' && <div className="answer-grid">{currentExercise.options?.map((option, index) => <button key={option} disabled={feedback !== null} className={feedback && index === currentExercise.answer ? 'correct' : ''} onClick={() => choose(index)}><b>{String.fromCharCode(65 + index)}</b>{option}</button>)}</div>}{currentExercise.kind === 'numeric' && <form className="numeric-form" onSubmit={(event) => { event.preventDefault(); choose(numeric); }}><label htmlFor="answer">Răspunsul tău</label><input id="answer" inputMode="numeric" value={numeric} onChange={(event) => setNumeric(event.target.value)} autoFocus /><button className="primary" type="submit">Verifică <span>→</span></button></form>}{currentExercise.kind === 'steps' && <div className="answer-grid steps">{currentExercise.options?.map((option, index) => <button key={option} disabled={feedback !== null || selectedStep.includes(index)} className={selectedStep.includes(index) ? 'selected' : ''} onClick={() => selectStep(index)}><b>{selectedStep.includes(index) ? selectedStep.indexOf(index) + 1 : '•'}</b>{option}</button>)}<button className="primary check-steps" disabled={selectedStep.length !== currentExercise.options?.length} onClick={() => choose(0)}>Verifică ordinea <span>→</span></button></div>}{feedback && <div className={`feedback ${feedback}`} role="status"><strong>{feedback === 'right' ? 'Exact, ai prins ideea.' : 'Mai încearcă o dată.'}</strong><p>{feedback === 'right' ? currentExercise.explanation : 'Recitește explicația și încearcă din nou. Învățarea se construiește prin pași mici.'}</p>{feedback === 'wrong' ? <button className="retry" onClick={() => { setFeedback(null); setSelectedStep([]); }}>Încearcă din nou</button> : <button className="next" onClick={next}>{exercise === currentLesson.exercises.length - 1 ? 'Finalizează lecția' : 'Următorul exercițiu'} →</button>}</div>}</article>}</section>}

    {screen === 'done' && <section className="complete"><div className="confetti">✦</div><div className="kicker">LECȚIE FINALIZATĂ</div><h1>Ai făcut un pas<br /><em>care rămâne.</em></h1><p>{currentLesson.title} este bifată. Ai câștigat <strong>+{currentLesson.xp} XP</strong> și îți construiești progresul lecție cu lecție.</p><div className="completion-card"><span>⚡</span><div><strong>{progress.xp} XP</strong><small>progres local</small></div><span>🔥</span><div><strong>{progress.streak} zile</strong><small>serie activă</small></div><span>✓</span><div><strong>Lecție bifată</strong><small>salvată în browser</small></div></div><button className="secondary" onClick={() => setScreen('course')}>Înapoi la curs</button><button className="text-button" onClick={() => setScreen('catalog')}>Vezi catalogul</button></section>}
  </main></div>;
}

export function App() { return <LearningProvider><DemoApp /></LearningProvider>; }
if (document.getElementById('root')) createRoot(document.getElementById('root')!).render(<App />);
