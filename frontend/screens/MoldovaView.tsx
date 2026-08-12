import { useEffect, useMemo, useState } from "react";
import type { Lang } from "@app/shared";
import { getInitData, getToken } from "../telegram";

/**
 * 🇲🇩 Молдова — explore the official Moldovan curriculum (school grades I–XII,
 * plus a university placeholder). Self-contained screen; the host app mounts it
 * with { onBack, lang }. All data comes from /api/moldova/* (see endpoints below).
 *
 * Layout: «Список с фильтрами + раскрытие недели» —
 *   filters (grade / subject / profile) → vertical list of weeks (1..34) →
 *   tap a week to expand its lessons → tap a lesson to open the overlay with the
 *   verbatim official curriculum text.
 *
 * Endpoints used (backend must match these shapes):
 *   GET /api/moldova/tree?grade=<grade>&profile=<profile?>
 *       -> { grade, profiles?: string[], subjects: MoldovaSubject[] }
 *   GET /api/moldova/today?grade=<grade>
 *       -> { date: string, week: number | null, lessons: TodayLesson[] }
 *   GET /api/moldova/lesson/<key>
 *       -> { found: boolean, sourceText: string | null, content: LessonContent | null }
 */

// ---- API helper: same auth/fetch pattern as src/api.ts (call() isn't exported) ----
async function call<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-init-data": getInitData(),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method: "GET", headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}
const enc = encodeURIComponent;

// ---- Response shapes ----
interface MoldovaLesson {
  key: string;
  ro: string;
  en: string;
  module?: string;
  week?: number | null;
}
interface MoldovaSubject {
  name: { ro: string; en: string };
  lessons: MoldovaLesson[];
}
interface TreeResponse {
  grade: string;
  profiles?: string[];
  subjects: MoldovaSubject[];
}
interface TodayLesson {
  key: string;
  subject: string;
  ro: string;
  en: string;
}
interface TodayResponse {
  date: string;
  week: number | null;
  lessons: TodayLesson[];
}
const moldovaApi = {
  tree: (grade: string, profile?: string) =>
    call<TreeResponse>(`/moldova/tree?grade=${enc(grade)}${profile ? `&profile=${enc(profile)}` : ""}`),
  today: (grade: string) => call<TodayResponse>(`/moldova/today?grade=${enc(grade)}`),
};

// ---- i18n (ru/ro/en), same pattern as i18n.ts / Battle.tsx ----
type Tri = Record<Lang, string>;
const S: Record<string, Tri> = {
  title: { ru: "🇲🇩 Молдова", ro: "🇲🇩 Moldova", en: "🇲🇩 Moldova" },
  school: { ru: "Школа", ro: "Școală", en: "School" },
  university: { ru: "Университет", ro: "Universitate", en: "University" },
  soon: { ru: "Скоро", ro: "În curând", en: "Coming soon" },
  uniSoon: {
    ru: "Программы вузов появятся здесь скоро.",
    ro: "Programele universitare vor apărea aici în curând.",
    en: "University programs will appear here soon.",
  },
  grade: { ru: "Класс", ro: "Clasa", en: "Grade" },
  pickGrade: { ru: "Выбери класс", ro: "Alege clasa", en: "Pick a grade" },
  subject: { ru: "Предмет", ro: "Materia", en: "Subject" },
  allSubjects: { ru: "Все предметы", ro: "Toate materiile", en: "All subjects" },
  profile: { ru: "Профиль", ro: "Profil", en: "Profile" },
  week: { ru: "Неделя", ro: "Săptămâna", en: "Week" },
  now: { ru: "сейчас", ro: "acum", en: "now" },
  lessonsCount: { ru: "уроков", ro: "lecții", en: "lessons" },
  loading: { ru: "Загрузка…", ro: "Se încarcă…", en: "Loading…" },
  empty: {
    ru: "Пока нет данных для этого класса.",
    ro: "Încă nu sunt date pentru această clasă.",
    en: "No data yet for this grade.",
  },
  emptyFilter: {
    ru: "Нет уроков по этому фильтру.",
    ro: "Nu sunt lecții pentru acest filtru.",
    en: "No lessons for this filter.",
  },
  hint: {
    ru: "Выбери класс, чтобы увидеть недели и уроки.",
    ro: "Alege o clasă ca să vezi săptămânile și lecțiile.",
    en: "Pick a grade to see weeks and lessons.",
  },
  genSoon: {
    ru: "📚 Урок генерируется — контент скоро появится",
    ro: "📚 Lecția se generează — conținutul va apărea în curând",
    en: "📚 Lesson is being generated — content coming soon",
  },
  close: { ru: "Закрыть", ro: "Închide", en: "Close" },
  back: { ru: "← Назад", ro: "← Înapoi", en: "← Back" },
};
const tr = (k: keyof typeof S, lang: Lang) => S[k][lang];

const GRADES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const TOTAL_WEEKS = 34;
const ALL = "__all__"; // sentinel for "all subjects" in the <select>

type Tab = "school" | "university";

// A lesson flattened out of the tree, carrying its subject + resolved week.
interface FlatLesson extends MoldovaLesson {
  subjectRo: string;
  subjectEn: string;
}

export default function MoldovaView({ onBack, lang }: { onBack: () => void; lang: Lang }) {
  const [tab, setTab] = useState<Tab>("school");
  const [grade, setGrade] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>(ALL); // name.ro or ALL

  const [tree, setTree] = useState<TreeResponse | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<MoldovaLesson | null>(null);

  // Load tree + today whenever grade/profile changes.
  useEffect(() => {
    if (!grade) return;
    let alive = true;
    setLoading(true);
    setTree(null);
    setToday(null);
    setOpenWeek(null);
    setSubjectFilter(ALL);
    Promise.all([
      moldovaApi.tree(grade, profile ?? undefined).catch(() => null),
      moldovaApi.today(grade).catch(() => null),
    ]).then(([t, td]) => {
      if (!alive) return;
      setTree(t);
      setToday(td);
      // Default the profile selector to the first profile the backend reports.
      if (t?.profiles?.length && profile == null) setProfile(t.profiles[0]);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [grade, profile]);

  const currentWeek = today?.week ?? null;

  // Flatten every lesson across subjects, tagging it with its subject + week.
  const flatLessons = useMemo<FlatLesson[]>(() => {
    if (!tree) return [];
    const out: FlatLesson[] = [];
    for (const subj of tree.subjects) {
      for (const l of subj.lessons) {
        out.push({ ...l, subjectRo: subj.name.ro, subjectEn: subj.name.en });
      }
    }
    return out;
  }, [tree]);

  // Apply the subject filter, then group by week → Map<week, FlatLesson[]>.
  const weeks = useMemo(() => {
    const filtered =
      subjectFilter === ALL ? flatLessons : flatLessons.filter((l) => l.subjectRo === subjectFilter);
    const byWeek = new Map<number, FlatLesson[]>();
    for (const l of filtered) {
      if (l.week == null) continue;
      const arr = byWeek.get(l.week);
      if (arr) arr.push(l);
      else byWeek.set(l.week, [l]);
    }
    // Materialise weeks 1..TOTAL_WEEKS in order, hiding empties.
    const rows: { week: number; lessons: FlatLesson[] }[] = [];
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const arr = byWeek.get(w);
      if (arr && arr.length) rows.push({ week: w, lessons: arr });
    }
    return rows;
  }, [flatLessons, subjectFilter]);

  const openLesson = (lesson: MoldovaLesson) => {
    setActiveLesson(lesson);
  };

  const closeLesson = () => {
    setActiveLesson(null);
  };

  const subjLabel = (s: MoldovaSubject) =>
    s.name.ro + (s.name.en && s.name.en !== s.name.ro ? ` · ${s.name.en}` : "");

  return (
    <div className="app">
      <div className="lesson-langbar">
        <button className="btn ghost mv-back" onClick={onBack}>
          {tr("back", lang)}
        </button>
      </div>
      <div className="prompt">{tr("title", lang)}</div>

      {/* School / University toggle */}
      <div className="mv-tabs">
        <button
          className={"mv-tab" + (tab === "school" ? " active" : "")}
          onClick={() => setTab("school")}
        >
          {tr("school", lang)}
        </button>
        <button
          className={"mv-tab" + (tab === "university" ? " active" : "")}
          onClick={() => setTab("university")}
        >
          {tr("university", lang)}
        </button>
      </div>

      {tab === "university" ? (
        <div className="card mv-soon">
          <div className="mv-soon-emoji">🎓</div>
          <div className="mv-soon-tag">{tr("soon", lang)}</div>
          <div className="muted">{tr("uniSoon", lang)}</div>
        </div>
      ) : (
        <>
          {/* ---- Filters: sticky near the top ---- */}
          <div className="mv-filters">
            {/* Класс — chips I–XII */}
            <div className="mv-filter-label">{tr("grade", lang)}</div>
            <div className="mv-grades">
              {GRADES.map((g) => (
                <button
                  key={g}
                  className={"mv-grade" + (g === grade ? " active" : "")}
                  onClick={() => {
                    setGrade(g);
                    setProfile(null);
                  }}
                >
                  {g}
                </button>
              ))}
            </div>

            {grade && (
              <>
                {/* Предмет — dropdown (value = name.ro) */}
                <div className="mv-filter-label">{tr("subject", lang)}</div>
                <div className="mv-select-wrap">
                  <select
                    className="mv-select"
                    value={subjectFilter}
                    onChange={(e) => {
                      setSubjectFilter(e.target.value);
                      setOpenWeek(null);
                    }}
                    disabled={!tree || tree.subjects.length === 0}
                  >
                    <option value={ALL}>{tr("allSubjects", lang)}</option>
                    {tree?.subjects.map((s) => (
                      <option key={s.name.ro} value={s.name.ro}>
                        {subjLabel(s)}
                      </option>
                    ))}
                  </select>
                  <span className="mv-select-caret">▾</span>
                </div>

                {/* Профиль — Real / Umanist, only when backend reports profiles */}
                {tree?.profiles && tree.profiles.length > 0 && (
                  <div className="mv-profiles">
                    <span className="mv-filter-label mv-profiles-label">{tr("profile", lang)}</span>
                    {tree.profiles.map((p) => (
                      <button
                        key={p}
                        className={"mv-chip" + (p === profile ? " active" : "")}
                        onClick={() => setProfile(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ---- Week list ---- */}
          {!grade ? (
            <div className="card muted mv-hint">{tr("hint", lang)}</div>
          ) : loading && !tree ? (
            <div className="card muted">{tr("loading", lang)}</div>
          ) : !tree || tree.subjects.length === 0 ? (
            <div className="card muted">{tr("empty", lang)}</div>
          ) : weeks.length === 0 ? (
            <div className="card muted">{tr("emptyFilter", lang)}</div>
          ) : (
            <div className="mv-weeks">
              {weeks.map(({ week, lessons }) => {
                const isOpen = openWeek === week;
                const isNow = currentWeek === week;
                return (
                  <div key={week} className={"card mv-week-card" + (isNow ? " now" : "")}>
                    <button
                      className="mv-week-head"
                      onClick={() => setOpenWeek(isOpen ? null : week)}
                      aria-expanded={isOpen}
                    >
                      <span className="mv-week-title">
                        {tr("week", lang)} {week}
                        {isNow && <span className="mv-week-now">· {tr("now", lang)}</span>}
                      </span>
                      <span className="mv-week-meta">
                        <span className="mv-week-count">
                          {lessons.length} {tr("lessonsCount", lang)}
                        </span>
                        <span className={"mv-caret" + (isOpen ? " open" : "")}>▸</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mv-lesson-list">
                        {lessons.map((l) => (
                          <button key={l.key} className="mv-lesson" onClick={() => openLesson(l)}>
                            <span className="mv-lesson-subj">
                              {lang === "en" ? l.subjectEn : l.subjectRo}
                            </span>
                            <span className="mv-lesson-ro">{l.ro}</span>
                            {l.en && l.en !== l.ro && <span className="mv-lesson-en">{l.en}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---- Lesson detail overlay ---- */}
      {activeLesson && (
        <div className="detail-overlay" onClick={closeLesson}>
          <div className="detail-screen mv-detail" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={closeLesson} aria-label={tr("close", lang)}>
              ✕
            </button>
            <div className="detail-body">
              <div className="mv-detail-emoji">📚</div>
              <h2 className="detail-title">{activeLesson.ro}</h2>
              {activeLesson.en && activeLesson.en !== activeLesson.ro && (
                <p className="mv-detail-en">{activeLesson.en}</p>
              )}
              {activeLesson.module && <p className="mv-detail-module">{activeLesson.module}</p>}

              {/* Source text is admin-only (verification); learners see the generated lesson. */}
              <div className="card mv-gen">{tr("genSoon", lang)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped styles — kept inline so this screen stays self-contained (no edits to styles.css). */}
      <style>{`
        .mv-back { width: auto; margin: 0; padding: 7px 14px; font-size: 14px; }
        .mv-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
        .mv-tab {
          flex: 1; padding: 11px; border-radius: 12px; cursor: pointer;
          background: var(--card2); color: var(--muted);
          border: 1.5px solid transparent; font-size: 15px; font-weight: 700;
          transition: color .15s ease, border-color .15s ease, background .15s ease;
        }
        .mv-tab.active { color: var(--text); border-color: var(--accent); background: rgba(91,140,255,.12); }

        .mv-soon { text-align: center; padding: 30px 18px; }
        .mv-soon-emoji { font-size: 46px; line-height: 1; margin-bottom: 10px; }
        .mv-soon-tag {
          display: inline-block; font-size: 13px; font-weight: 800; color: var(--accent);
          background: rgba(91,140,255,.12); padding: 4px 14px; border-radius: 999px; margin-bottom: 12px;
        }

        /* Filters block — sticky just under the header area. */
        .mv-filters {
          position: sticky; top: 0; z-index: 5;
          background: var(--bg, #0e1116);
          padding: 4px 0 10px; margin-bottom: 6px;
          border-bottom: 1px solid var(--card2);
        }
        .mv-filter-label {
          font-size: 12px; font-weight: 700; color: var(--muted);
          text-transform: uppercase; letter-spacing: .4px; margin: 10px 0 6px;
        }
        .mv-filters .mv-filter-label:first-child { margin-top: 0; }

        .mv-grades { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7px; }
        .mv-grade {
          padding: 11px 0; border-radius: 11px; cursor: pointer; font-size: 14px; font-weight: 800;
          background: var(--card); color: var(--text); border: 1.5px solid var(--card2);
          transition: border-color .15s ease, background .15s ease, transform .12s ease;
        }
        .mv-grade:active { transform: scale(.95); }
        .mv-grade.active { border-color: var(--accent); background: rgba(91,140,255,.14); }

        .mv-select-wrap { position: relative; }
        .mv-select {
          -webkit-appearance: none; appearance: none;
          width: 100%; padding: 12px 38px 12px 14px; border-radius: 12px; cursor: pointer;
          background: var(--card); color: var(--text); border: 1.5px solid var(--card2);
          font-size: 15px; font-weight: 600; line-height: 1.2;
        }
        .mv-select:focus { outline: none; border-color: var(--accent); }
        .mv-select:disabled { opacity: .5; cursor: default; }
        .mv-select-caret {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          pointer-events: none; color: var(--muted); font-size: 12px;
        }

        .mv-profiles { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .mv-profiles-label { margin: 0 2px 0 0; }
        .mv-chip {
          padding: 7px 14px; border-radius: 999px; cursor: pointer; font-size: 13px; font-weight: 700;
          background: var(--card); color: var(--text); border: 1.5px solid var(--card2);
        }
        .mv-chip.active { border-color: var(--accent); background: rgba(91,140,255,.14); }

        .mv-hint { text-align: center; padding: 22px 16px; }

        /* Week list */
        .mv-weeks { display: flex; flex-direction: column; gap: 8px; }
        .mv-week-card { padding: 0; overflow: hidden; }
        .mv-week-card.now { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
        .mv-week-head {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
          background: transparent; color: var(--text); border: none; cursor: pointer;
          padding: 14px 16px; font-size: 15px; font-weight: 700; text-align: left;
        }
        .mv-week-title { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; }
        .mv-week-now { font-size: 12px; font-weight: 800; color: var(--accent); }
        .mv-week-meta { display: flex; align-items: center; gap: 10px; flex: none; }
        .mv-week-count {
          font-size: 12px; font-weight: 600; color: var(--muted); font-variant-numeric: tabular-nums;
        }
        .mv-caret { display: inline-block; transition: transform .18s ease; font-size: 12px; color: var(--muted); }
        .mv-caret.open { transform: rotate(90deg); }

        .mv-lesson-list { display: flex; flex-direction: column; gap: 8px; padding: 0 12px 12px; }
        .mv-lesson {
          display: flex; flex-direction: column; gap: 2px; text-align: left; cursor: pointer;
          background: var(--card2); color: var(--text);
          border: 1.5px solid transparent; border-radius: 12px; padding: 11px 14px;
          transition: border-color .15s ease, transform .12s ease;
        }
        .mv-lesson:active { transform: scale(.99); }
        .mv-lesson:hover { border-color: var(--accent); }
        .mv-lesson-subj {
          font-size: 11px; font-weight: 800; letter-spacing: .3px; text-transform: uppercase; color: var(--accent);
        }
        .mv-lesson-ro { font-size: 15px; font-weight: 600; line-height: 1.3; }
        .mv-lesson-en { font-size: 12px; color: var(--muted); }

        .mv-detail { max-width: 560px; }
        .mv-detail-emoji { font-size: 44px; line-height: 1; margin-bottom: 6px; }
        .mv-detail-en { font-size: 15px; color: var(--muted); margin: -6px 0 10px; }
        .mv-detail-module { font-size: 13px; color: var(--accent); font-weight: 600; margin: 0 0 14px; }

        .mv-source-block {
          background: var(--card2); border: 1.5px solid var(--card2); border-radius: 12px;
          padding: 14px 16px; margin: 0 0 12px;
        }
        .mv-source-head {
          font-size: 13px; font-weight: 800; color: var(--accent); margin-bottom: 8px;
        }
        .mv-source-text {
          white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: var(--text);
          word-break: break-word;
        }
        .mv-gen { font-size: 15px; line-height: 1.5; background: var(--card2); margin: 0; }
      `}</style>
    </div>
  );
}
