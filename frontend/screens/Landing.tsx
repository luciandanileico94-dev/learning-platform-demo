import type { Lang, UserProfile } from "@app/shared";
import "./landing.css";

const LANGS: Lang[] = ["ru", "ro", "en"];
const SUBJECT_EMOJIS = ["🗣️", "➗", "🔬", "🧬", "⚗️", "🎬", "💻", "🏛️", "🌍", "🔭", "🧠", "💰"];

type LocalString = Record<Lang, string>;

const S: Record<string, LocalString> = {
  brand: {
    ru: "LEARNINGO",
    ro: "LEARNINGO",
    en: "LEARNINGO",
  },
  tagline: {
    ru: "Учись чему угодно — играя",
    ro: "Învață orice — jucându-te",
    en: "Learn anything — by playing",
  },
  intro: {
    ru: "Геймифицированное обучение по множеству предметов: языки, школьная программа и полезные навыки. Короткие уроки с понятными объяснениями, уровни сложности, опыт (XP) и серии дней (стрики) — всё, чтобы заниматься было интересно и не хотелось бросать.",
    ro: "Învățare gamificată pe multe materii: limbi străine, programa școlară și abilități utile. Lecții scurte cu explicații clare, niveluri de dificultate, puncte de experiență (XP) și serii zilnice (streak) — totul ca să-ți placă să înveți.",
    en: "Gamified learning across many subjects: languages, school topics and useful skills. Short lessons with clear explanations, difficulty levels, XP and streaks — everything to keep learning fun and habit-forming.",
  },
  xpLabel: { ru: "опыт", ro: "experiență", en: "XP" },
  streakLabel: { ru: "серия", ro: "serie", en: "streak" },
  subjectsCaption: {
    ru: "12 предметов уже доступны — скоро будет больше",
    ro: "12 materii disponibile acum — în curând mai multe",
    en: "12 subjects available now — more coming soon",
  },
  howTitle: {
    ru: "Как это работает",
    ro: "Cum funcționează",
    en: "How it works",
  },
  step1Title: {
    ru: "Выбери предмет",
    ro: "Alege materia",
    en: "Pick a subject",
  },
  step1Body: {
    ru: "Языки, школа или навыки — что хочешь изучать сегодня.",
    ro: "Limbi, școală sau abilități — ce vrei să înveți azi.",
    en: "Languages, school or skills — whatever you want to learn.",
  },
  step2Title: {
    ru: "Выбери сложность",
    ro: "Alege dificultatea",
    en: "Choose difficulty",
  },
  step2Body: {
    ru: "Лёгкий, средний или сложный — под твой уровень.",
    ro: "Ușor, mediu sau greu — pe nivelul tău.",
    en: "Easy, medium or hard — to match your level.",
  },
  step3Title: {
    ru: "Короткие уроки с «почему»",
    ro: "Lecții scurte cu „de ce”",
    en: "Short lessons with the “why”",
  },
  step3Body: {
    ru: "Не просто факты — понятные объяснения, почему это так.",
    ro: "Nu doar fapte — explicații clare despre de ce e așa.",
    en: "Not just facts — clear explanations of why it works.",
  },
  step4Title: {
    ru: "Зарабатывай XP и держи стрик",
    ro: "Câștigă XP și ține streak-ul",
    en: "Earn XP & keep your streak",
  },
  step4Body: {
    ru: "Каждый день занятий приближает к новым высотам.",
    ro: "Fiecare zi de învățare te apropie de noi recorduri.",
    en: "Every day of practice builds toward new milestones.",
  },
  cta: {
    ru: "🚀 Начнём учиться!",
    ro: "🚀 Hai să învățăm!",
    en: "🚀 Let's learn!",
  },
  randomCta: {
    ru: "🎲 Случайный факт",
    ro: "🎲 Fapt aleatoriu",
    en: "🎲 Random fact",
  },
  randomHint: {
    ru: "Нет времени на урок? Узнай один факт за минуту.",
    ro: "N-ai timp de o lecție? Află un fapt într-un minut.",
    en: "No time for a lesson? Learn one fact in a minute.",
  },
};

export function Landing({
  profile,
  lang,
  onLang,
  onStart,
  onRandom,
}: {
  profile: UserProfile;
  lang: Lang;
  onLang: (l: Lang) => void;
  onStart: () => void;
  onRandom?: () => void;
}) {
  const steps = [
    { emoji: "🎯", title: S.step1Title[lang], body: S.step1Body[lang] },
    { emoji: "🎚️", title: S.step2Title[lang], body: S.step2Body[lang] },
    { emoji: "📘", title: S.step3Title[lang], body: S.step3Body[lang] },
    { emoji: "⭐", title: S.step4Title[lang], body: S.step4Body[lang] },
  ];

  return (
    <div className="app landing lp">
      <header className="lp-top">
        <div className="lp-brand">🎓 {S.brand[lang]}</div>
        <div className="lp-lang" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={l === lang ? "active" : ""}
              onClick={() => onLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-emoji">🎓</div>
        <h1 className="lp-hero-title">{S.brand[lang]}</h1>
        <p className="lp-hero-tagline">{S.tagline[lang]}</p>
      </section>

      <div className="lp-stats">
        <div className="lp-stat xp">
          <span className="lp-stat-icon">⭐</span>
          <span className="lp-stat-value">{profile.xp}</span>
          <span className="lp-stat-label">{S.xpLabel[lang]}</span>
        </div>
        <div className="lp-stat streak">
          <span className="lp-stat-icon">🔥</span>
          <span className="lp-stat-value">{profile.streak}</span>
          <span className="lp-stat-label">{S.streakLabel[lang]}</span>
        </div>
      </div>

      <p className="lp-intro">{S.intro[lang]}</p>

      <div className="lp-subjects">
        <div className="lp-subjects-row">
          {SUBJECT_EMOJIS.map((e, i) => (
            <span className="lp-subject" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              {e}
            </span>
          ))}
        </div>
        <div className="lp-subjects-caption">{S.subjectsCaption[lang]}</div>
      </div>

      <h2 className="lp-section-title">{S.howTitle[lang]}</h2>
      <ol className="lp-steps">
        {steps.map((s, i) => (
          <li className="lp-step" key={i}>
            <span className="lp-step-num">{i + 1}</span>
            <span className="lp-step-emoji" aria-hidden="true">{s.emoji}</span>
            <span className="lp-step-text">
              <span className="lp-step-name">{s.title}</span>
              <span className="lp-step-body">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>

      {onRandom && (
        <>
          <button type="button" className="lp-cta lp-cta-secondary" onClick={onRandom}>
            {S.randomCta[lang]}
          </button>
          <p className="lp-random-hint">{S.randomHint[lang]}</p>
        </>
      )}

      <div className="lp-actions">
        <button type="button" className="lp-cta" onClick={onStart}>
          {S.cta[lang]}
        </button>
      </div>
    </div>
  );
}
