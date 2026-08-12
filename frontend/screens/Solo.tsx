import { useEffect, useRef, useState } from "react";
import type { Lang, Localized } from "@app/shared";
import { api, type SoloQuestion } from "../api";
import { sfx, primeAudio, isMuted, toggleMuted } from "../sound";
import { haptics } from "../haptics";
import "./battle.css";
import "./solo.css";

const RUN_MS = 60000;
type Phase = "category" | "loading" | "play" | "done";
type L = Record<Lang, string>;

const CATS: { id: string; icon: string; label: L }[] = [
  { id: "mixed", icon: "🎲", label: { ru: "Микс — все темы", ro: "Mix — toate temele", en: "Mix — all topics" } },
  { id: "science", icon: "🔬", label: { ru: "Наука", ro: "Știință", en: "Science" } },
  { id: "history", icon: "🏛️", label: { ru: "История", ro: "Istorie", en: "History" } },
  { id: "society", icon: "🌍", label: { ru: "Общество", ro: "Societate", en: "Society" } },
  { id: "professions", icon: "💼", label: { ru: "Профессии", ro: "Profesii", en: "Professions" } },
  { id: "culture", icon: "🎭", label: { ru: "Культура и искусство", ro: "Cultură și artă", en: "Culture & arts" } },
  { id: "countries", icon: "🌎", label: { ru: "Страны мира", ro: "Țările lumii", en: "Countries" } },
];

const S: Record<string, L> = {
  title: { ru: "⚡ Тайм-атака", ro: "⚡ Time-attack", en: "⚡ Time Attack" },
  sub: { ru: "Сколько успеешь за 60 секунд?", ro: "Câte reușești în 60 de secunde?", en: "How many can you get in 60 seconds?" },
  chooseCat: { ru: "Выбери тему", ro: "Alege tema", en: "Pick a topic" },
  score: { ru: "Очки", ro: "Scor", en: "Score" },
  correct: { ru: "Правильных", ro: "Corecte", en: "Correct" },
  best: { ru: "Лучшая серия", ro: "Cea mai bună serie", en: "Best streak" },
  reward: { ru: "Награда", ro: "Recompensă", en: "Reward" },
  again: { ru: "🔁 Ещё раз", ro: "🔁 Din nou", en: "🔁 Again" },
  home: { ru: "На главную", ro: "Acasă", en: "Home" },
  done: { ru: "Время вышло!", ro: "Timpul a expirat!", en: "Time's up!" },
};

export function Solo({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("category");
  const [qs, setQs] = useState<SoloQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(RUN_MS);
  const [muted, setMuted] = useState(isMuted());
  const [xp, setXp] = useState(0);

  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const finishing = useRef(false);
  const alive = useRef(true);
  const correctRef = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearInterval(timer.current); };
  }, []);

  async function start(cat: string) {
    primeAudio();
    finishing.current = false;
    setPhase("loading");
    let data: { questions: SoloQuestion[] };
    try { data = await api.soloStart(cat); } catch { if (alive.current) setPhase("category"); return; }
    if (!alive.current) return;
    if (!data.questions.length) { setPhase("category"); return; }
    setQs(data.questions); setIdx(0); setCorrect(0); correctRef.current = 0;
    setCombo(0); setBestCombo(0); setChosen(null); setReveal(false); setTimeLeft(RUN_MS);
    setPhase("play");
    startedAt.current = Date.now();
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const left = Math.max(0, RUN_MS - (Date.now() - startedAt.current));
      setTimeLeft(left);
      if (left <= 0) void finish();
    }, 100);
  }

  function pick(i: number) {
    if (reveal || phase !== "play") return;
    const q = qs[idx];
    const ok = i === q.correctIndex;
    setChosen(i); setReveal(true);
    if (ok) {
      setCorrect((c) => c + 1); correctRef.current += 1;
      setCombo((c) => { const n = c + 1; setBestCombo((b) => Math.max(b, n)); return n; });
      sfx.correct(); haptics.success();
    } else {
      setCombo(0); sfx.wrong(); haptics.error();
    }
    window.setTimeout(() => {
      if (!alive.current || finishing.current) return;
      const next = idx + 1;
      if (next >= qs.length) void finish();
      else { setIdx(next); setChosen(null); setReveal(false); }
    }, ok ? 450 : 950);
  }

  async function finish() {
    if (finishing.current) return;
    finishing.current = true;
    clearInterval(timer.current);
    sfx.win(); haptics.success();
    let gained = 0;
    try { gained = (await api.soloClaim(correctRef.current)).xp; } catch { /* ignore */ }
    if (!alive.current) return;
    setXp(gained); setPhase("done");
  }

  const muteBtn = (
    <button className="bt-mute" aria-label="sound" onClick={() => setMuted(toggleMuted())}>{muted ? "🔇" : "🔊"}</button>
  );

  if (phase === "category") {
    return (
      <div className="app battle bt">
        {muteBtn}
        <div className="bt-cat">
          <div className="bt-cat-emoji">⚡</div>
          <h2 className="bt-cat-title">{S.title[lang]}</h2>
          <p className="bt-sub">{S.sub[lang]}</p>
          <div className="bt-cat-list">
            {CATS.map((c) => (
              <button key={c.id} className="bt-cat-btn" onClick={() => { primeAudio(); void start(c.id); }}>
                <span className="bt-cat-ic">{c.icon}</span>
                <span>{c.label[lang]}</span>
              </button>
            ))}
          </div>
          <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="app battle bt">
        <div className="bt-center"><div className="bt-radar"><span /><span /><span /><div className="bt-radar-core">⚡</div></div></div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="app battle bt">
        <div className="bt-result win">
          <div className="bt-confetti" aria-hidden="true">⚡</div>
          <h2 className="bt-result-title">{S.done[lang]}</h2>
          <div className="so-bigscore">{correct}</div>
          <p className="bt-result-sub">{S.correct[lang]}</p>
          <div className="so-stats">
            <div><span className="so-k">{S.best[lang]}</span><b>🔥 {bestCombo}</b></div>
            <div><span className="so-k">{S.reward[lang]}</span><b>+{xp} XP</b></div>
          </div>
          <button className="bt-btn primary big" onClick={() => setPhase("category")}>{S.again[lang]}</button>
          <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
        </div>
      </div>
    );
  }

  // play
  const q = qs[idx];
  if (!q) return null;
  const ringPct = Math.round((timeLeft / RUN_MS) * 100);
  const ringColor = timeLeft > 20000 ? "#22c55e" : timeLeft > 8000 ? "#ffcc33" : "#ff5b5b";
  return (
    <div className="app battle bt">
      {muteBtn}
      <div className="so-head">
        <div className="so-score">⚡ {correct}</div>
        {combo >= 2 && <span className={"bt-combo" + (combo >= 5 ? " hot" : "")} key={combo}>🔥 {combo}</span>}
        <div className="bt-ring" style={{ background: `conic-gradient(${ringColor} ${ringPct}%, rgba(255,255,255,.08) ${ringPct}%)` }}>
          <span>{Math.ceil(timeLeft / 1000)}</span>
        </div>
      </div>

      <div className="bt-qhead"><span className="bt-track">{q.icon} {q.track[lang]}</span></div>
      <div className="bt-question"><span className="bt-qlabel">⚡</span>{q.prompt[lang]}</div>

      <div className="bt-options answers">
        {q.options.map((o: Localized, i) => {
          let cls = "bt-opt";
          if (reveal) {
            if (i === q.correctIndex) cls += " correct";
            else if (i === chosen) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={i} className={cls} disabled={reveal} onClick={() => pick(i)}>
              <span className="bt-opt-txt">{o[lang]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
