import { useState } from "react";
import type { Lang } from "@app/shared";
import { api } from "../api";

const L = (lang: Lang, ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);
const LANGS: Lang[] = ["ru", "ro", "en"];

// Same option sets as the phone Onboarding.tsx — the payload sent to the backend is identical.
const GOALS = [
  { id: "language", ru: "Языки", ro: "Limbi", en: "Languages" },
  { id: "school", ru: "Школьные предметы", ro: "Materii școlare", en: "School subjects" },
  { id: "knowledge", ru: "Общие знания", ro: "Cunoștințe generale", en: "General knowledge" },
  { id: "growth", ru: "Саморазвитие", ro: "Dezvoltare personală", en: "Self-growth" },
  { id: "career", ru: "Карьера и профессия", ro: "Carieră și profesie", en: "Career & profession" },
];
const OCCUPATIONS = [
  { id: "student", ru: "Школьник / студент", ro: "Elev / student", en: "Student" },
  { id: "working", ru: "Работаю", ro: "Lucrez", en: "Working" },
  { id: "teacher", ru: "Преподаю", ro: "Predau", en: "I teach" },
  { id: "curious", ru: "Просто интересно", ro: "Doar din curiozitate", en: "Just curious" },
];
const INTERESTS = [
  { id: "science", ru: "Наука", ro: "Știință", en: "Science" },
  { id: "it", ru: "IT и технологии", ro: "IT și tehnologie", en: "IT & tech" },
  { id: "psychology", ru: "Психология", ro: "Psihologie", en: "Psychology" },
  { id: "finance", ru: "Финансы и бизнес", ro: "Finanțe și business", en: "Finance & business" },
  { id: "history", ru: "История", ro: "Istorie", en: "History" },
  { id: "geography", ru: "География и страны", ro: "Geografie și țări", en: "Geography & countries" },
  { id: "art", ru: "Искусство, кино, музыка", ro: "Artă, film, muzică", en: "Art, film, music" },
  { id: "math", ru: "Математика", ro: "Matematică", en: "Mathematics" },
  { id: "lifeskills", ru: "Жизненные навыки", ro: "Abilități de viață", en: "Life skills" },
  { id: "languages", ru: "Иностранные языки", ro: "Limbi străine", en: "Foreign languages" },
];
const LEVELS = [
  { id: "easy", ru: "Новичок", ro: "Începător", en: "Beginner", sru: "Начну с азов", sro: "Pornesc de la bază", sen: "Start from the basics" },
  { id: "medium", ru: "Кое-что знаю", ro: "Știu câte ceva", en: "Some knowledge", sru: "Средний уровень", sro: "Nivel mediu", sen: "Medium level" },
  { id: "hard", ru: "Уверенно", ro: "Încrezător", en: "Confident", sru: "Сразу посложнее", sro: "Direct mai greu", sen: "Jump to harder" },
];

const STEP_KEYS = ["goals", "occupation", "interests", "level"] as const;

/**
 * Professional web onboarding (non-Telegram). Same fields + same `api.onboard` payload
 * as the phone Onboarding — only the presentation differs (centered desktop card, no emoji).
 */
export function OnboardingWeb({ lang, onLang, onDone }: { lang: Lang; onLang: (l: Lang) => void; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const finish = async () => {
    setBusy(true);
    try {
      await api.onboard({ goals: goals.length ? goals : ["knowledge"], occupation, interests, startLevel: level || "easy" });
    } catch {}
    onDone();
  };

  const canNext =
    step === 0 ? goals.length > 0 :
    step === 1 ? occupation !== "" :
    step === 2 ? true :
    level !== "";

  const next = () => { if (step < STEP_KEYS.length - 1) setStep(step + 1); else finish(); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const STEP_LABELS = [
    L(lang, "Цели", "Obiective", "Goals"),
    L(lang, "О тебе", "Despre tine", "About you"),
    L(lang, "Интересы", "Interese", "Interests"),
    L(lang, "Уровень", "Nivel", "Level"),
  ];

  return (
    <div className="obw-page">
      <div className="obw-card">
        <header className="obw-head">
          <div className="obw-brand">LEARNINGO</div>
          <div className="obw-langs">
            {LANGS.map((l) => (
              <button key={l} className={l === lang ? "active" : ""} onClick={() => onLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </header>

        <div className="obw-steps">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className={"obw-step" + (i === step ? " is-active" : i < step ? " is-done" : "")}>
              <span className="obw-step-num">{i < step ? "✓" : i + 1}</span>
              <span className="obw-step-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="obw-bar"><span style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }} /></div>

        <div className="obw-body">
          {step === 0 && (
            <>
              <h1 className="obw-title">{L(lang, "Что вы хотите изучать?", "Ce vrei să înveți?", "What do you want to learn?")}</h1>
              <p className="obw-sub">{L(lang, "Выберите одну или несколько целей.", "Alege unul sau mai multe obiective.", "Select one or more goals.")}</p>
              <div className="obw-options">
                {GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  return (
                    <button key={g.id} type="button" className={"obw-opt" + (on ? " is-sel" : "")} aria-pressed={on} onClick={() => toggle(goals, setGoals, g.id)}>
                      <span className="obw-check" aria-hidden>{on ? "✓" : ""}</span>
                      <span className="obw-opt-label">{L(lang, g.ru, g.ro, g.en)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="obw-title">{L(lang, "Чем вы занимаетесь?", "Cu ce te ocupi?", "What do you do?")}</h1>
              <p className="obw-sub">{L(lang, "Это поможет подобрать подходящие уроки.", "Ne ajută să alegem lecții potrivite.", "This helps us tailor your lessons.")}</p>
              <div className="obw-options">
                {OCCUPATIONS.map((o) => {
                  const on = occupation === o.id;
                  return (
                    <button key={o.id} type="button" className={"obw-opt" + (on ? " is-sel" : "")} aria-pressed={on} onClick={() => setOccupation(o.id)}>
                      <span className="obw-radio" aria-hidden>{on && <i />}</span>
                      <span className="obw-opt-label">{L(lang, o.ru, o.ro, o.en)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="obw-title">{L(lang, "Что вам интересно?", "Ce te interesează?", "What interests you?")}</h1>
              <p className="obw-sub">{L(lang, "По выбранным темам соберём раздел «Для вас». Можно пропустить.", "Pe baza temelor alese construim zona „Pentru tine”. Poți sări peste.", "We'll build your “For you” section from these. You can skip.")}</p>
              <div className="obw-chips">
                {INTERESTS.map((it) => {
                  const on = interests.includes(it.id);
                  return (
                    <button key={it.id} type="button" className={"obw-chip" + (on ? " is-sel" : "")} aria-pressed={on} onClick={() => toggle(interests, setInterests, it.id)}>
                      {L(lang, it.ru, it.ro, it.en)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="obw-title">{L(lang, "С какого уровня начать?", "De la ce nivel pornim?", "Where should we start?")}</h1>
              <p className="obw-sub">{L(lang, "Подберём стартовую сложность.", "Alegem dificultatea de start.", "We'll set your starting difficulty.")}</p>
              <div className="obw-options">
                {LEVELS.map((lv) => {
                  const on = level === lv.id;
                  return (
                    <button key={lv.id} type="button" className={"obw-opt obw-opt--row" + (on ? " is-sel" : "")} aria-pressed={on} onClick={() => setLevel(lv.id)}>
                      <span className="obw-radio" aria-hidden>{on && <i />}</span>
                      <span className="obw-opt-meta">
                        <span className="obw-opt-label">{L(lang, lv.ru, lv.ro, lv.en)}</span>
                        <span className="obw-opt-hint">{L(lang, lv.sru, lv.sro, lv.sen)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <footer className="obw-foot">
          <button className="btn ghost obw-back" disabled={step === 0 || busy} onClick={back}>
            {L(lang, "Назад", "Înapoi", "Back")}
          </button>
          <button className="btn obw-next" disabled={!canNext || busy} onClick={next}>
            {step === STEP_KEYS.length - 1 ? L(lang, "Готово", "Gata", "Finish") : L(lang, "Продолжить", "Continuă", "Continue")}
          </button>
        </footer>
      </div>
    </div>
  );
}
