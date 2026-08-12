import { useState } from "react";
import type { Lang } from "@app/shared";
import { api } from "../api";

const L = (lang: Lang, ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);

const GOALS = [
  { id: "language", emoji: "🗣️", ru: "Языки", ro: "Limbi", en: "Languages" },
  { id: "school", emoji: "🏫", ru: "Школьные предметы", ro: "Materii școlare", en: "School subjects" },
  { id: "knowledge", emoji: "🧠", ru: "Общие знания", ro: "Cunoștințe generale", en: "General knowledge" },
  { id: "growth", emoji: "🌱", ru: "Саморазвитие", ro: "Dezvoltare personală", en: "Self-growth" },
  { id: "career", emoji: "💼", ru: "Карьера и профессия", ro: "Carieră și profesie", en: "Career & profession" },
];
const OCCUPATIONS = [
  { id: "student", emoji: "🎓", ru: "Школьник / студент", ro: "Elev / student", en: "Student" },
  { id: "working", emoji: "💼", ru: "Работаю", ro: "Lucrez", en: "Working" },
  { id: "teacher", emoji: "👨‍🏫", ru: "Преподаю", ro: "Predau", en: "I teach" },
  { id: "curious", emoji: "🔍", ru: "Просто интересно", ro: "Doar din curiozitate", en: "Just curious" },
];
// Interest ids drive the personalized "For you" zone (mapped to tracks in App.tsx).
const INTERESTS = [
  { id: "science", emoji: "🔬", ru: "Наука", ro: "Știință", en: "Science" },
  { id: "it", emoji: "💻", ru: "IT и технологии", ro: "IT și tehnologie", en: "IT & tech" },
  { id: "psychology", emoji: "🧠", ru: "Психология", ro: "Psihologie", en: "Psychology" },
  { id: "finance", emoji: "💰", ru: "Финансы и бизнес", ro: "Finanțe și business", en: "Finance & business" },
  { id: "history", emoji: "🏛️", ru: "История", ro: "Istorie", en: "History" },
  { id: "geography", emoji: "🌍", ru: "География и страны", ro: "Geografie și țări", en: "Geography & countries" },
  { id: "art", emoji: "🎨", ru: "Искусство, кино, музыка", ro: "Artă, film, muzică", en: "Art, film, music" },
  { id: "math", emoji: "➗", ru: "Математика", ro: "Matematică", en: "Mathematics" },
  { id: "lifeskills", emoji: "🛠️", ru: "Жизненные навыки", ro: "Abilități de viață", en: "Life skills" },
  { id: "languages", emoji: "🌐", ru: "Иностранные языки", ro: "Limbi străine", en: "Foreign languages" },
];
const LEVELS = [
  { id: "easy", emoji: "🟢", ru: "Новичок", ro: "Începător", en: "Beginner", sru: "Начну с азов", sro: "Pornesc de la bază", sen: "Start from the basics" },
  { id: "medium", emoji: "🟡", ru: "Кое-что знаю", ro: "Știu câte ceva", en: "Some knowledge", sru: "Средний уровень", sro: "Nivel mediu", sen: "Medium level" },
  { id: "hard", emoji: "🔴", ru: "Уверенно", ro: "Încrezător", en: "Confident", sru: "Сразу посложнее", sro: "Direct mai greu", sen: "Jump to harder" },
];

const STEPS = 4;

/** First-run onboarding: multi-goals → occupation → interests → starting level. Drives personalization. */
export function Onboarding({ lang, onLang, onDone }: { lang: Lang; onLang: (l: Lang) => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = async (level: string) => {
    setBusy(true);
    try { await api.onboard({ goals: goals.length ? goals : ["knowledge"], occupation, interests, startLevel: level }); } catch {}
    onDone();
  };

  return (
    <div className="app ob">
      <div className="lang-switch ob-lang">
        {(["ru", "ro", "en"] as Lang[]).map((l) => (
          <button key={l} className={l === lang ? "active" : ""} onClick={() => onLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
      <div className="ob-progress">
        {Array.from({ length: STEPS }).map((_, i) => <span key={i} className={step >= i ? "on" : ""} />)}
      </div>

      {step === 0 && (
        <>
          <div className="ob-hero">🎯</div>
          <div className="ob-title">{L(lang, "Что хочешь изучать?", "Ce vrei să înveți?", "What do you want to learn?")}</div>
          <div className="ob-sub">{L(lang, "Можно выбрать несколько", "Poți alege mai multe", "Pick one or more")}</div>
          <div className="ob-grid">
            {GOALS.map((g) => (
              <button key={g.id} className={`ob-card ${goals.includes(g.id) ? "sel" : ""}`} onClick={() => toggle(goals, setGoals, g.id)}>
                <div className="ob-emoji">{g.emoji}</div>
                <div className="ob-label">{L(lang, g.ru, g.ro, g.en)}</div>
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn" disabled={goals.length === 0} onClick={() => setStep(1)}>{L(lang, "Далее", "Mai departe", "Next")}</button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="ob-hero">🧑</div>
          <div className="ob-title">{L(lang, "Чем ты занимаешься?", "Cu ce te ocupi?", "What do you do?")}</div>
          <div className="ob-sub">{L(lang, "Подберём подходящие уроки", "Alegem lecții potrivite", "We'll tailor your lessons")}</div>
          <div className="ob-list">
            {OCCUPATIONS.map((o) => (
              <button key={o.id} className={`ob-row ${occupation === o.id ? "sel" : ""}`} disabled={busy} onClick={() => { setOccupation(o.id); setStep(2); }}>
                <div className="ob-emoji">{o.emoji}</div>
                <div className="ob-meta"><div className="ob-label">{L(lang, o.ru, o.ro, o.en)}</div></div>
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn ghost" onClick={() => setStep(0)}>{L(lang, "← Назад", "← Înapoi", "← Back")}</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="ob-hero">✨</div>
          <div className="ob-title">{L(lang, "Что тебе интересно?", "Ce te interesează?", "What interests you?")}</div>
          <div className="ob-sub">{L(lang, "Выбери темы — соберём зону «Для тебя»", "Alege teme — îți facem zona „Pentru tine”", "Pick topics — we'll build your “For you” zone")}</div>
          <div className="ob-chips">
            {INTERESTS.map((it) => (
              <button key={it.id} className={`ob-chip ${interests.includes(it.id) ? "sel" : ""}`} onClick={() => toggle(interests, setInterests, it.id)}>
                <span>{it.emoji}</span> {L(lang, it.ru, it.ro, it.en)}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn" onClick={() => setStep(3)}>{L(lang, "Далее", "Mai departe", "Next")}</button>
            <button className="btn ghost" onClick={() => setStep(1)}>{L(lang, "← Назад", "← Înapoi", "← Back")}</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="ob-hero">🎚️</div>
          <div className="ob-title">{L(lang, "Твой уровень?", "Nivelul tău?", "Your level?")}</div>
          <div className="ob-sub">{L(lang, "Подберём стартовую сложность", "Alegem dificultatea de start", "We'll set your starting difficulty")}</div>
          <div className="ob-list">
            {LEVELS.map((lv) => (
              <button key={lv.id} className="ob-row" disabled={busy} onClick={() => finish(lv.id)}>
                <div className="ob-emoji">{lv.emoji}</div>
                <div className="ob-meta">
                  <div className="ob-label">{L(lang, lv.ru, lv.ro, lv.en)}</div>
                  <div className="ob-rowsub">{L(lang, lv.sru, lv.sro, lv.sen)}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="btn ghost" onClick={() => setStep(2)} disabled={busy}>{L(lang, "← Назад", "← Înapoi", "← Back")}</button>
          </div>
        </>
      )}
    </div>
  );
}
