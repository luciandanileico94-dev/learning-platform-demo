// Public marketing website (shown in a normal browser, outside Telegram).
// Playful/bright branding. Every CTA opens the Telegram deep-link login.
import { useState } from "react";
import type { Lang } from "@app/shared";
import { api } from "../api";
import { setToken } from "../telegram";
import "./site.css";

const LANGS: Lang[] = ["ru", "ro", "en"];

function detectLang(): Lang {
  const l = (navigator.language || "en").toLowerCase();
  if (l.startsWith("ru")) return "ru";
  if (l.startsWith("ro")) return "ro";
  return "en";
}

type L = Record<Lang, string>;
const S = {
  nav_about: { ru: "О проекте", ro: "Despre", en: "About" } as L,
  nav_subjects: { ru: "Предметы", ro: "Materii", en: "Subjects" } as L,
  nav_how: { ru: "Как это", ro: "Cum", en: "How it works" } as L,
  nav_why: { ru: "Почему мы", ro: "De ce noi", en: "Why us" } as L,
  login: { ru: "Войти через Telegram", ro: "Intră cu Telegram", en: "Log in with Telegram" } as L,
  heroTitle: { ru: "Учись чему угодно — играя", ro: "Învață orice — jucându-te", en: "Learn anything — by playing" } as L,
  heroSub: {
    ru: "Языки, школьные предметы и полезные навыки — короткими уроками с объяснениями. Зарабатывай опыт, держи серию и продвигайся по уровням.",
    ro: "Limbi, materii școlare și abilități utile — în lecții scurte cu explicații. Câștigă XP, ține seria și avansează pe niveluri.",
    en: "Languages, school subjects and useful skills — in short lessons with explanations. Earn XP, keep your streak and climb the levels.",
  } as L,
  cta: { ru: "🚀 Начать обучение", ro: "🚀 Începe să înveți", en: "🚀 Start learning" } as L,
  waiting: { ru: "Подтверди вход в Telegram и вернись сюда…", ro: "Confirmă în Telegram și revino…", en: "Confirm in Telegram and come back…" } as L,
  aboutTitle: { ru: "Что такое LEARNINGO", ro: "Ce este LEARNINGO", en: "What is LEARNINGO" } as L,
  aboutBody: {
    ru: "Это обучающая игра-агрегатор: один аккаунт — десятки предметов. Короткие уроки, понятный разбор «почему», уровни сложности от лёгкого до ультра. Работает в Telegram и в браузере — прогресс общий.",
    ro: "Un joc educativ-agregator: un cont — zeci de materii. Lecții scurte, explicații clare „de ce”, niveluri de la ușor la ultra. Funcționează în Telegram și în browser — progres comun.",
    en: "A gamified learning hub: one account, dozens of subjects. Short lessons, clear “why” explanations, difficulty from easy to ultra. Works in Telegram and the browser — shared progress.",
  } as L,
  subjectsTitle: { ru: "Предметы", ro: "Materii", en: "Subjects" } as L,
  subjectsSub: { ru: "Уже доступны — и список растёт", ro: "Deja disponibile — lista crește", en: "Available now — and growing" } as L,
  howTitle: { ru: "Как это работает", ro: "Cum funcționează", en: "How it works" } as L,
  whyTitle: { ru: "Почему LEARNINGO", ro: "De ce LEARNINGO", en: "Why LEARNINGO" } as L,
  ctaBand: { ru: "Готов начать? Это бесплатно.", ro: "Gata să începi? E gratis.", en: "Ready to start? It's free." } as L,
  footer: { ru: "Учись чему угодно, играя.", ro: "Învață orice, jucându-te.", en: "Learn anything, by playing." } as L,
};

const SUBJECTS: { e: string; t: L }[] = [
  { e: "🗣️", t: { ru: "Языки", ro: "Limbi", en: "Languages" } },
  { e: "➗", t: { ru: "Математика", ro: "Matematică", en: "Mathematics" } },
  { e: "🔬", t: { ru: "Физика", ro: "Fizică", en: "Physics" } },
  { e: "🧬", t: { ru: "Биология", ro: "Biologie", en: "Biology" } },
  { e: "⚗️", t: { ru: "Химия", ro: "Chimie", en: "Chemistry" } },
  { e: "🎬", t: { ru: "Кинематография", ro: "Cinematografie", en: "Cinematography" } },
  { e: "🩺", t: { ru: "Здоровье", ro: "Sănătate", en: "Health" } },
  { e: "🎵", t: { ru: "Музыка", ro: "Muzică", en: "Music" } },
  { e: "📜", t: { ru: "История", ro: "Istorie", en: "History" } },
  { e: "💰", t: { ru: "Финансы", ro: "Finanțe", en: "Finance" } },
];

const STEPS: { e: string; t: L }[] = [
  { e: "🎯", t: { ru: "Выбери предмет", ro: "Alege o materie", en: "Pick a subject" } },
  { e: "🎚️", t: { ru: "Выбери сложность: лёгкий → ультра", ro: "Alege dificultatea: ușor → ultra", en: "Choose difficulty: easy → ultra" } },
  { e: "📘", t: { ru: "Проходи короткие уроки с объяснениями", ro: "Parcurge lecții scurte cu explicații", en: "Take short lessons with explanations" } },
  { e: "⭐", t: { ru: "Зарабатывай XP и держи 🔥 серию", ro: "Câștigă XP și ține 🔥 seria", en: "Earn XP and keep your 🔥 streak" } },
];

const WHY: { e: string; t: L; d: L }[] = [
  { e: "🎮", t: { ru: "Игровой формат", ro: "Format de joc", en: "Gamified" }, d: { ru: "XP, серии, уровни и daily challenge.", ro: "XP, serii, niveluri și daily challenge.", en: "XP, streaks, levels and daily challenges." } },
  { e: "💡", t: { ru: "Понятные объяснения", ro: "Explicații clare", en: "Real explanations" }, d: { ru: "После каждого ответа — почему так.", ro: "După fiecare răspuns — de ce.", en: "After every answer — the why." } },
  { e: "🌍", t: { ru: "Три языка", ro: "Trei limbi", en: "Three languages" }, d: { ru: "Русский, română, English.", ro: "Rusă, română, engleză.", en: "Russian, Romanian, English." } },
  { e: "🆓", t: { ru: "Бесплатный старт", ro: "Start gratuit", en: "Free to start" }, d: { ru: "Заходи через Telegram и учись.", ro: "Intră cu Telegram și învață.", en: "Log in with Telegram and learn." } },
];

export function Site() {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [waiting, setWaiting] = useState(false);

  const login = async () => {
    setWaiting(true);
    try {
      const { code, botUrl } = await api.webStart();
      window.open(botUrl, "_blank");
      const started = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - started > 5 * 60 * 1000) { clearInterval(poll); setWaiting(false); return; }
        try {
          const r = await api.webPoll(code);
          if (r.token) { clearInterval(poll); setToken(r.token); window.location.reload(); }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (e) {
      setWaiting(false);
      alert("Login failed: " + e);
    }
  };

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-logo">🎓 LEARNINGO</div>
        <nav className="site-nav">
          <a href="#about">{S.nav_about[lang]}</a>
          <a href="#subjects">{S.nav_subjects[lang]}</a>
          <a href="#how">{S.nav_how[lang]}</a>
          <a href="#why">{S.nav_why[lang]}</a>
        </nav>
        <div className="site-actions">
          <div className="site-lang">
            {LANGS.map((l) => (
              <button key={l} className={l === lang ? "on" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <button className="site-btn primary sm" onClick={login}>{S.login[lang]}</button>
        </div>
      </header>

      <section className="site-hero">
        <div className="hero-copy">
          <h1>{S.heroTitle[lang]}</h1>
          <p>{S.heroSub[lang]}</p>
          <button className="site-btn primary lg" onClick={login}>{S.cta[lang]}</button>
          {waiting && <div className="site-waiting">{S.waiting[lang]}</div>}
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="blob b1">🗣️</div>
          <div className="blob b2">➗</div>
          <div className="blob b3">🔬</div>
          <div className="blob b4">🎬</div>
          <div className="blob b5">🧬</div>
        </div>
      </section>

      <section id="about" className="site-section">
        <h2>{S.aboutTitle[lang]}</h2>
        <p className="lead">{S.aboutBody[lang]}</p>
      </section>

      <section id="subjects" className="site-section">
        <h2>{S.subjectsTitle[lang]}</h2>
        <p className="muted">{S.subjectsSub[lang]}</p>
        <div className="subj-grid">
          {SUBJECTS.map((s, i) => (
            <div className="subj-card" key={i}>
              <span className="subj-e">{s.e}</span>
              <span>{s.t[lang]}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="site-section">
        <h2>{S.howTitle[lang]}</h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-n">{i + 1}</div>
              <div className="step-e">{s.e}</div>
              <div>{s.t[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="site-section">
        <h2>{S.whyTitle[lang]}</h2>
        <div className="why-grid">
          {WHY.map((wy, i) => (
            <div className="why-card" key={i}>
              <span className="why-e">{wy.e}</span>
              <div className="why-t">{wy.t[lang]}</div>
              <div className="why-d">{wy.d[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="site-cta">
        <h2>{S.ctaBand[lang]}</h2>
        <button className="site-btn primary lg" onClick={login}>{S.cta[lang]}</button>
        {waiting && <div className="site-waiting">{S.waiting[lang]}</div>}
      </section>

      <footer className="site-footer">🎓 LEARNINGO · {S.footer[lang]}</footer>
    </div>
  );
}
