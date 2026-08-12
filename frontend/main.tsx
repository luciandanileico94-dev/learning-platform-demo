import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { lesson } from '../shared/store';
import { LearningProvider, useLearningContext } from './learning-context';
import './styles.css';

type Screen = 'home' | 'school' | 'subject' | 'grade' | 'lesson' | 'done';

function Header({ onReset }: { onReset: () => void }) {
  const { progress } = useLearningContext();
  return <header className="topbar"><button className="logo" onClick={onReset} aria-label="Learningo, pagina principal"><span>✦</span> learningo</button><div className="stats"><span>⚡ {progress.xp} XP</span><span>🔥 {progress.streak} zile</span><button className="reset" onClick={onReset}>Resetează demo</button></div></header>;
}

function DemoApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [card, setCard] = useState(0);
  const [exercise, setExercise] = useState(0);
  const [feedback, setFeedback] = useState<'wrong' | 'right' | null>(null);
  const [numeric, setNumeric] = useState('');
  const [selectedStep, setSelectedStep] = useState<number[]>([]);
  const { progress, complete, reset } = useLearningContext();
  const current = lesson.exercises[exercise];

  const restart = () => { reset(); setScreen('home'); setCard(0); setExercise(0); setFeedback(null); setNumeric(''); setSelectedStep([]); };
  const choose = (value: number | string) => {
    const correct = current.kind === 'steps' ? selectedStep.join(',') === String(current.answer) : String(value).trim() === String(current.answer);
    setFeedback(correct ? 'right' : 'wrong');
  };
  const next = () => { if (exercise === lesson.exercises.length - 1) { complete(); setScreen('done'); } else { setExercise((n) => n + 1); setFeedback(null); setNumeric(''); setSelectedStep([]); } };
  const selectStep = (index: number) => { if (!selectedStep.includes(index)) setSelectedStep((items) => [...items, index]); };

  return <div className="app"><Header onReset={restart} />
    <main>
      {screen === 'home' && <section className="welcome"><div className="kicker">DEMO DE PORTOFOLIU</div><h1>Învață prin pași mici.<br /><em>Înțelege pe bune.</em></h1><p>O experiență Learningo de un minut, construită pentru curiozitate, claritate și progres vizibil.</p><button className="primary" onClick={() => setScreen('school')}>Începe demo-ul <span>→</span></button><div className="promise"><span>3</span> interacțiuni · explicații la fiecare răspuns · fără cont</div></section>}
      {screen !== 'home' && screen !== 'lesson' && screen !== 'done' && <section className="picker"><div className="kicker">PAS {screen === 'school' ? '1' : screen === 'subject' ? '2' : '3'} DIN 4</div><h1>{screen === 'school' ? 'Unde vrei să înveți?' : screen === 'subject' ? 'Alege materia' : 'Alege clasa'}</h1><p className="lead">Facem traseul scurt și potrivit pentru tine.</p><div className="choices">{screen === 'school' && <button onClick={() => setScreen('subject')}><span>🏫</span><strong>Școală</strong><small>Materii pentru gimnaziu</small></button>}{screen === 'subject' && <button onClick={() => setScreen('grade')}><span>➗</span><strong>Matematică</strong><small>Calculează cu mai multă încredere</small></button>}{screen === 'grade' && <button onClick={() => { setScreen('lesson'); setCard(0); }}><span>8</span><strong>Clasa a VIII-a</strong><small>Ecuații și funcții</small></button>}</div><button className="text-button" onClick={() => setScreen(screen === 'school' ? 'home' : screen === 'subject' ? 'school' : 'subject')}>← Înapoi</button></section>}
      {screen === 'lesson' && <section className="lesson-view"><div className="lesson-meta"><span>MATEMATICĂ · CLASA A VIII-A</span><span>{exercise + 1} / 3</span></div><div className="bar"><i style={{ width: `${((exercise) / 3) * 100}%` }} /></div>{card < 2 ? <article className="teaching"><div className="card-number">0{card + 1}</div><div><div className="kicker">IDEA DE BAZĂ</div><h1>{lesson.teachingCards[card].title}</h1><p>{lesson.teachingCards[card].body}</p><button className="primary" onClick={() => setCard((n) => n + 1)}>{card === 0 ? 'Continuă' : 'Verifică ce ai înțeles'} <span>→</span></button></div></article> : <article className="exercise"><div className="kicker">EXERCIȚIUL {exercise + 1}</div><h1>{current.prompt}</h1>{current.kind === 'choice' && <div className="answer-grid">{current.options?.map((option, i) => <button key={option} disabled={feedback !== null} className={feedback && i === current.answer ? 'correct' : ''} onClick={() => choose(i)}><b>{String.fromCharCode(65 + i)}</b>{option}</button>)}</div>}{current.kind === 'numeric' && <form className="numeric-form" onSubmit={(e) => { e.preventDefault(); choose(numeric); }}><label htmlFor="answer">Răspunsul tău</label><input id="answer" inputMode="numeric" value={numeric} onChange={(e) => setNumeric(e.target.value)} autoFocus /><button className="primary" type="submit">Verifică <span>→</span></button></form>}{current.kind === 'steps' && <div className="answer-grid steps">{current.options?.map((option, i) => <button key={option} disabled={feedback !== null || selectedStep.includes(i)} className={selectedStep.includes(i) ? 'selected' : ''} onClick={() => selectStep(i)}><b>{selectedStep.includes(i) ? selectedStep.indexOf(i) + 1 : '•'}</b>{option}</button>)}<button className="primary check-steps" disabled={selectedStep.length !== 3} onClick={() => choose(0)}>Verifică ordinea <span>→</span></button></div>}{feedback && <div className={`feedback ${feedback}`} role="status"><strong>{feedback === 'right' ? 'Exact, ai prins ideea.' : 'Mai încearcă o dată.'}</strong><p>{feedback === 'right' ? current.explanation : `Ordinea corectă pornește cu: ${current.kind === 'steps' ? 'adunarea lui 4 la ambele părți.' : 'operația care elimină termenul cunoscut.'}`}</p>{feedback === 'wrong' ? <button className="retry" onClick={() => { setFeedback(null); setSelectedStep([]); }}>Încearcă din nou</button> : <button className="next" onClick={next}>{exercise === 2 ? 'Finalizează lecția' : 'Următorul exercițiu'} →</button>}</div>}</article>}</section>}
      {screen === 'done' && <section className="complete"><div className="confetti">✦</div><div className="kicker">LECȚIE FINALIZATĂ</div><h1>Ai făcut un pas<br /><em>care rămâne.</em></h1><p>Ecuații liniare este bifată. Ai câștigat <strong>+30 XP</strong> și ai activat o serie de <strong>3 zile</strong>.</p><div className="completion-card"><span>⚡</span><div><strong>{progress.xp} XP</strong><small>progres local</small></div><span>🔥</span><div><strong>{progress.streak} zile</strong><small>serie activă</small></div><span>✓</span><div><strong>Lecție bifată</strong><small>salvată în browser</small></div></div><button className="secondary" onClick={() => setScreen('home')}>Vezi din nou traseul</button></section>}
    </main>
  </div>;
}

export function App() { return <LearningProvider><DemoApp /></LearningProvider>; }
if (document.getElementById('root')) createRoot(document.getElementById('root')!).render(<App />);
