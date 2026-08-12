import { useState } from "react";
import type { Lang } from "@app/shared";
import { api } from "../api.js";

const T = {
  title:    { ru: "Олимпиады", ro: "Olimpiade", en: "Olympiads" },
  subtitle: { ru: "Соревнования по школьным предметам Молдовы", ro: "Concursuri pe discipline școlare din Moldova", en: "Academic competitions for Moldovan school subjects" },
  soon:     { ru: "Скоро запуск", ro: "Lansare în curând", en: "Coming Soon" },
  soonNote: { ru: "Следи за объявлениями — первая олимпиада запускается в 2026 году", ro: "Urmărește anunțurile — prima olimpiadă se lansează în 2026", en: "Stay tuned — the first olympiad launches in 2026" },

  howTitle: { ru: "Как это работает", ro: "Cum funcționează", en: "How it works" },
  steps: {
    ru: [
      ["🗓️", "Раз в 3 месяца", "Новая олимпиада по расписанию — каждый квартал"],
      ["📅", "Выходной день", "Соревнование проходит в один выходной день — удобно для всех"],
      ["🏛️", "Комнаты по предметам", "Отдельная комната на каждый предмет — математика, физика, химия и другие"],
      ["🎯", "Открытое участие", "Любой желающий может войти в комнату и соревноваться"],
      ["🏆", "Призы победителям", "Лучшие участники каждой олимпиады получают специальные призы"],
    ],
    ro: [
      ["🗓️", "O dată la 3 luni", "O nouă olimpiadă după program — în fiecare trimestru"],
      ["📅", "Zi de weekend", "Concursul are loc într-o zi de weekend — convenabil pentru toți"],
      ["🏛️", "Săli pe discipline", "O sală separată pentru fiecare disciplină — matematică, fizică, chimie și altele"],
      ["🎯", "Participare deschisă", "Oricine poate intra în sală și concura"],
      ["🏆", "Premii pentru câștigători", "Cei mai buni participanți la fiecare olimpiadă primesc premii speciale"],
    ],
    en: [
      ["🗓️", "Every 3 months", "A new olympiad on schedule — every quarter"],
      ["📅", "Weekend day", "The competition takes place on one weekend day — convenient for everyone"],
      ["🏛️", "Rooms by subject", "A separate room for each subject — math, physics, chemistry and more"],
      ["🎯", "Open participation", "Anyone can enter a room and compete"],
      ["🏆", "Prizes for winners", "The best participants in each olympiad receive special prizes"],
    ],
  },

  subjectsTitle: { ru: "Предметы (школьные)", ro: "Discipline (școlare)", en: "Subjects (school)" },
  subjectsNote:  { ru: "Классы 5–12 · Официальная программа Молдовы", ro: "Clasele 5–12 · Programa oficială a Moldovei", en: "Grades 5–12 · Official Moldovan curriculum" },
  uniTitle:      { ru: "Университеты", ro: "Universități", en: "Universities" },
  uniNote:       { ru: "Будет добавлено — UTM, USMF, UPSC и другие", ro: "Va fi adăugat — UTM, USMF, UPSC și altele", en: "Coming soon — UTM, USMF, UPSC and others" },

  prizesTitle: { ru: "Призы", ro: "Premii", en: "Prizes" },
  prizesNote:  { ru: "Призы будут объявлены отдельно перед каждой олимпиадой. Следи за обновлениями!", ro: "Premiile vor fi anunțate separat înaintea fiecărei olimpiade. Urmărește actualizările!", en: "Prizes will be announced separately before each olympiad. Stay tuned!" },

  notifyBtn:  { ru: "🔔 Уведомить меня", ro: "🔔 Notifică-mă", en: "🔔 Notify me" },
  notifyDone: { ru: "✅ Уведомление включено", ro: "✅ Notificare activată", en: "✅ Notification enabled" },

  back: { ru: "← Назад", ro: "← Înapoi", en: "← Back" },
};

const SCHOOL_SUBJECTS = [
  { icon: "📐", ru: "Математика",      ro: "Matematică",    en: "Mathematics" },
  { icon: "⚡", ru: "Физика",          ro: "Fizică",        en: "Physics" },
  { icon: "⚗️", ru: "Химия",           ro: "Chimie",        en: "Chemistry" },
  { icon: "🧬", ru: "Биология",        ro: "Biologie",      en: "Biology" },
  { icon: "📜", ru: "История",         ro: "Istorie",       en: "History" },
  { icon: "🌍", ru: "География",       ro: "Geografie",     en: "Geography" },
  { icon: "💻", ru: "Информатика",     ro: "Informatică",   en: "Informatics" },
  { icon: "📖", ru: "Литература",      ro: "Literatură",    en: "Literature" },
  { icon: "🗣️", ru: "Румынский язык",  ro: "Lb. română",    en: "Romanian" },
  { icon: "🌐", ru: "Английский язык", ro: "Lb. engleză",   en: "English" },
];

export function OlympiadView({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [notified, setNotified] = useState(false);
  const [busy, setBusy] = useState(false);
  const l = (k: Record<Lang, string>) => k[lang] ?? k.en;
  const steps = T.steps[lang] ?? T.steps.en;

  const onNotify = async () => {
    if (notified || busy) return;
    setBusy(true);
    try {
      await api.olympiadNotify();
    } catch { /* ignore */ } finally {
      setNotified(true);
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 120px", color: "#e0e0ff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 8px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9aa0c3", cursor: "pointer", fontSize: 14 }}>
          {l(T.back)}
        </button>
      </div>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
        borderRadius: 20, padding: "32px 24px", marginBottom: 24, textAlign: "center",
        border: "1px solid #4c3d8f", position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#fff" }}>
          {l(T.title)}
        </h1>
        <p style={{ margin: "0 0 20px", color: "#c4b5fd", fontSize: 15 }}>
          {l(T.subtitle)}
        </p>
        <div style={{
          display: "inline-block", background: "#F59E0B", color: "#1a1a2e",
          borderRadius: 20, padding: "6px 18px", fontWeight: 700, fontSize: 13,
        }}>
          ⏳ {l(T.soon)}
        </div>
        <p style={{ margin: "12px 0 0", color: "#a78bfa", fontSize: 12 }}>
          {l(T.soonNote)}
        </p>
      </div>

      {/* How it works */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18, color: "#c4b5fd" }}>
          {l(T.howTitle)}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map(([icon, title, desc], i) => (
            <div key={i} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              background: "#16213e", borderRadius: 14, padding: "14px 16px",
              border: "1px solid #2a2a5a",
            }}>
              <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: "#e0e0ff", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#9aa0c3", lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* School subjects */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, color: "#c4b5fd" }}>
          {l(T.subjectsTitle)}
        </h2>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6b7280" }}>{l(T.subjectsNote)}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SCHOOL_SUBJECTS.map((s) => (
            <div key={s.en} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#16213e", borderRadius: 12, padding: "10px 14px",
              border: "1px solid #2a2a5a",
            }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 13, color: "#e0e0ff" }}>{s[lang] ?? s.en}</span>
            </div>
          ))}
        </div>
      </section>

      {/* University — coming soon */}
      <section style={{ marginBottom: 24 }}>
        <div style={{
          background: "#0f172a", borderRadius: 14, padding: "16px 18px",
          border: "1px dashed #2a2a5a", opacity: 0.7,
        }}>
          <div style={{ fontWeight: 700, color: "#9aa0c3", marginBottom: 4 }}>
            🎓 {l(T.uniTitle)}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{l(T.uniNote)}</div>
        </div>
      </section>

      {/* Prizes */}
      <section style={{ marginBottom: 24 }}>
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #1e1b4b 100%)",
          borderRadius: 14, padding: "18px",
          border: "1px solid #F59E0B44",
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🎁</div>
          <div style={{ fontWeight: 700, color: "#F59E0B", marginBottom: 6, fontSize: 16 }}>
            {l(T.prizesTitle)}
          </div>
          <div style={{ fontSize: 14, color: "#9aa0c3", lineHeight: 1.5 }}>
            {l(T.prizesNote)}
          </div>
        </div>
      </section>

      {/* Schedule preview */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          background: "#16213e", borderRadius: 14, padding: "16px 18px",
          border: "1px solid #2a2a5a",
        }}>
          <div style={{ fontWeight: 700, color: "#e0e0ff", marginBottom: 12, fontSize: 15 }}>
            📅 {lang === "ru" ? "Расписание олимпиад 2026" : lang === "ro" ? "Programul olimpiadelor 2026" : "Olympiad Schedule 2026"}
          </div>
          {[
            { q: "Q1", months: { ru: "Январь — Март", ro: "Ianuarie — Martie", en: "January — March" } },
            { q: "Q2", months: { ru: "Апрель — Июнь", ro: "Aprilie — Iunie", en: "April — June" } },
            { q: "Q3", months: { ru: "Июль — Сентябрь", ro: "Iulie — Septembrie", en: "July — September" } },
            { q: "Q4", months: { ru: "Октябрь — Декабрь", ro: "Octombrie — Decembrie", en: "October — December" } },
          ].map(({ q, months }) => (
            <div key={q} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid #1e2a4a",
            }}>
              <div style={{ color: "#9aa0c3", fontSize: 13 }}>
                <span style={{ color: "#6C5CE7", fontWeight: 700, marginRight: 8 }}>{q}</span>
                {months[lang] ?? months.en}
              </div>
              <div style={{
                background: "#1e2a4a", borderRadius: 8, padding: "3px 10px",
                fontSize: 11, color: "#6b7280",
              }}>
                {lang === "ru" ? "Дата TBD" : lang === "ro" ? "Dată TBD" : "Date TBD"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{ textAlign: "center", paddingBottom: 20 }}>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          {lang === "ru" ? "Бот уведомит тебя когда откроется регистрация" :
           lang === "ro" ? "Botul te va notifica când se deschide înregistrarea" :
           "The bot will notify you when registration opens"}
        </p>
        <div style={{
          display: "inline-block", background: "#4c3d8f", borderRadius: 14,
          padding: "12px 28px", fontWeight: 700, fontSize: 15, color: "#c4b5fd",
          cursor: "default", opacity: 0.7,
        }}>
          {l(T.notifyBtn)}
        </div>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>
          {lang === "ru" ? "Кнопка активируется при открытии регистрации" :
           lang === "ro" ? "Butonul se activează când se deschide înregistrarea" :
           "Button activates when registration opens"}
        </p>
      </div>
    </div>
  );
}
