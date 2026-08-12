import { useEffect, useRef, useState, lazy, Suspense } from "react";
import type { AnswerInput, ClientExercise, ClientLesson, Lang, Leaderboard as LeaderboardT, League as LeagueT, RandomFact as RandomFactT, ReviewDeck, SubjectReviewDeck, TeachItem, UserProfile } from "@app/shared";
import {
  api,
  type CoursesResponse,
  type DomainNode,
  type TrackNode,
  type ThemeNode,
  type Difficulty,
} from "./api";
import { t } from "./i18n";
import { isTelegram, getToken, setToken, BOT_USERNAME, getStartParam, openTgLink } from "./telegram";
import { Landing } from "./screens/Landing";
import { Welcome } from "./screens/Welcome";
import { Onboarding } from "./screens/Onboarding";
import { OnboardingWeb } from "./screens/OnboardingWeb";
import { Shop } from "./screens/Shop";
import { Battle } from "./screens/Battle";
import { Solo } from "./screens/Solo";
import { Profile } from "./screens/Profile";
import { Site } from "./screens/Site";
import MoldovaView from "./screens/MoldovaView";
import { OlympiadView } from "./screens/Olympiad";
import { AppShell, type NavKey } from "./screens/AppShell";
import { sfx, primeAudio } from "./sound";
// Avatar editor pulls in DiceBear (heavy) — load it only when opened.
const AvatarEditor = lazy(() =>
  import("./screens/Avatar").then((m) => ({ default: m.AvatarEditor })),
);

const LANGS: Lang[] = ["ru", "ro", "en"];
const DIFF_EMOJI: Record<Difficulty, string> = { easy: "🟢", medium: "🟡", hard: "🔴", ultra: "🟣" };
const TTS_LANG: Record<string, string> = {
  en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT",
  pt: "pt-PT", pl: "pl-PL", nl: "nl-NL", sv: "sv-SE", ru: "ru-RU",
  uk: "uk-UA", ro: "ro-RO",
};

// Onboarding interest id → substrings matched against track keys, for the "For you" zone.
const INTEREST_MATCH: Record<string, string[]> = {
  science: ["bio", "phys", "chem", "astro"],
  it: ["compsci", "cyber", "ai"],
  psychology: ["psy"],
  finance: ["fin", "biz", "business"],
  history: ["hist"],
  geography: ["geo", "countr"],
  art: ["art", "music", "cine"],
  math: ["math"],
  lifeskills: ["life"],
  languages: ["-a1", "-a2", "-b1", "-b2", "-c1", "-c2"],
};
/** Themes recommended from the user's interests — round-robin one per matching track, up to `max`. */
function recommendedThemes(domains: DomainNode[], interests: string[], max = 8): { th: ThemeNode; tr: TrackNode }[] {
  const subs = interests.flatMap((it) => INTEREST_MATCH[it] ?? []);
  if (subs.length === 0) return [];
  const tracks = domains.flatMap((d) => d.tracks).filter((tr) => subs.some((s) => tr.key.includes(s)));
  const out: { th: ThemeNode; tr: TrackNode }[] = [];
  for (let idx = 0; out.length < max; idx++) {
    let added = false;
    for (const tr of tracks) {
      if (tr.themes[idx]) { out.push({ th: tr.themes[idx], tr }); added = true; if (out.length >= max) break; }
    }
    if (!added) break;
  }
  return out;
}

type Status = "loading" | "login" | "ready" | "error";

// A single navigation entry. The stack (Frame[]) is the full nav history; Back = pop.
// Frames carry exactly the data their screen needs to render (no extra lookups):
// langGroup carries domain+group (its track list); picker carries the theme (its levels).
type LangGroup = { key: string; icon: string; tracks: TrackNode[] };
type Frame =
  | { t: "home" }
  | { t: "domain"; domain: DomainNode }
  | { t: "langGroup"; domain: DomainNode; group: LangGroup }
  | { t: "track"; track: TrackNode }
  | { t: "picker"; theme: ThemeNode }
  | { t: "lesson"; lessonId: string }
  | { t: "random" }
  | { t: "foryou" }
  | { t: "unfinished" }
  | { t: "battle" }
  | { t: "solo" }
  | { t: "charts" }
  | { t: "league" }
  | { t: "review" }
  | { t: "review-subjects" }
  | { t: "shop" }
  | { t: "moldova" }
  | { t: "olympiad" }
  | { t: "profile" }
  | { t: "avatar" }
  | { t: "landing" };

export function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<CoursesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Navigation history. On the web (non-Telegram) we skip the mobile Landing hero and
  // drop straight into the catalog inside the desktop shell; Telegram keeps the hero.
  const [nav, setNav] = useState<Frame[]>(isTelegram ? [{ t: "landing" }] : [{ t: "home" }]);
  const [welcomed, setWelcomed] = useState(() => {
    try { return localStorage.getItem("learningo_welcomed") === "1"; } catch { return false; }
  });

  const push = (f: Frame) => setNav((s) => [...s, f]);
  const back = () => setNav((s) => (s.length > 1 ? s.slice(0, -1) : s));
  // Reset to a single Home (optionally + one section) so Back from a section returns to Home.
  const reset = (f?: Frame) => setNav(f && f.t !== "home" ? [{ t: "home" }, f] : [{ t: "home" }]);

  const load = () => api.courses().then((d) => { setData(d); setStatus("ready"); });

  useEffect(() => {
    const boot = async () => {
      try {
        if (isTelegram || getToken() || import.meta.env.VITE_DEMO_MODE === "fixture") {
          await api.auth();
          await load();
          // One-time referral capture from the Mini App start param (ref<inviterId>).
          try {
            const m = /^ref_?(\d+)$/.exec(getStartParam());
            if (m && !localStorage.getItem("learningo_ref_done")) {
              localStorage.setItem("learningo_ref_done", "1");
              const r = await api.ref(Number(m[1]));
              if (r.ok) await load(); // reflect the joined-bonus XP
            }
          } catch {}
        } else { await api.auth(); await load(); }
      } catch (e) {
        if (!isTelegram) {
          setToken("");
          setStatus("login");
        } else {
          setError(String(e));
          setStatus("error");
        }
      }
    };
    boot();
  }, []);

  if (status === "loading") return <div className="app center muted">…</div>;
  if (status === "error") return <div className="app center muted">⚠️ {error}</div>;
  if (status === "login") return <Site />;
  if (!data) return <div className="app center muted">…</div>;

  const lang = data.profile.lang;
  const changeLang = async (l: Lang) => { await api.setLang(l); load(); };
  const top = nav[nav.length - 1];

  // --- Gates: rendered BEFORE the stack, WITHOUT the shell ---
  if (!welcomed) {
    return (
      <Welcome
        lang={lang}
        onLang={changeLang}
        onDone={() => {
          try { localStorage.setItem("learningo_welcomed", "1"); } catch {}
          setWelcomed(true);
        }}
      />
    );
  }

  // Re-run onboarding for new users, and once for users from the old single-goal flow
  // (no `occupation` yet) so we collect their multi-goals + interests for personalization.
  if (!data.profile.onboarded || !data.profile.occupation) {
    return isTelegram
      ? <Onboarding lang={lang} onLang={changeLang} onDone={() => load()} />
      : <OnboardingWeb lang={lang} onLang={changeLang} onDone={() => load()} />;
  }

  const DOMAIN_ICON: Record<string, string> = { languages: "🗣️", ai: "🤖", professions: "👷", school: "🏫", countries: "🌎", skills: "🛠️" };
  const groupLangs = (dom: DomainNode) => {
    const g: Record<string, { key: string; icon: string; tracks: TrackNode[] }> = {};
    for (const tr of dom.tracks) {
      const key = tr.key.split("-")[0];
      (g[key] ??= { key, icon: tr.icon, tracks: [] }).tracks.push(tr);
    }
    return Object.values(g);
  };
  // School: group tracks by subject (general + per-grade), so the user picks a
  // subject first, then a grade. Grade keys use short prefixes (bio-g5), the
  // general track uses the full name (biology) — alias them to one bucket.
  const groupSchool = (dom: DomainNode) => {
    const alias: Record<string, string> = { bio: "biology", phys: "physics", chem: "chemistry" };
    const g: Record<string, { key: string; icon: string; tracks: TrackNode[] }> = {};
    for (const tr of dom.tracks) {
      const base = tr.key.replace(/-g\d+$/, "");
      const key = alias[base] ?? base;
      (g[key] ??= { key, icon: tr.icon, tracks: [] }).tracks.push(tr);
    }
    const gradeNum = (k: string) => { const m = k.match(/-g(\d+)$/); return m ? +m[1] : -1; };
    for (const grp of Object.values(g)) grp.tracks.sort((a, b) => gradeNum(a.key) - gradeNum(b.key));
    return Object.values(g);
  };
  const computeUnfinished = (domains: DomainNode[]): { th: ThemeNode; tr: TrackNode }[] => {
    const out: { th: ThemeNode; tr: TrackNode }[] = [];
    for (const dom of domains) for (const tr of dom.tracks) for (const th of tr.themes) {
      const done = th.levels.filter((l) => l.completed).length;
      if (done > 0 && done < th.levels.length) out.push({ th, tr });
    }
    return out;
  };
  const trackDone = (tr: TrackNode) =>
    tr.themes.reduce((n, th) => n + th.levels.filter((l) => l.completed).length, 0);

  // Sidebar / section navigation: reset the stack to [home] (+ the target section)
  // so Back from a section always returns to Home.
  const go = (key: NavKey) => {
    switch (key) {
      case "home":
      case "learn": reset(); break;
      case "battle": reset({ t: "battle" }); break;
      case "solo": reset({ t: "solo" }); break;
      case "league": reset({ t: "league" }); break;
      case "review": reset({ t: "review" }); break;
      case "shop": reset({ t: "shop" }); break;
      case "moldova": reset({ t: "moldova" }); break;
      case "olympiad": reset({ t: "olympiad" }); break;
      case "charts": reset({ t: "charts" }); break;
      case "profile": reset({ t: "profile" }); break;
      case "avatar": reset({ t: "avatar" }); break;
    }
  };
  // Highlight the matching sidebar item for the current (top) frame; catalog/home → "home".
  const active: NavKey =
    top.t === "shop" ? "shop" : top.t === "moldova" ? "moldova" : top.t === "charts" ? "charts"
    : top.t === "league" ? "league" : top.t === "review" ? "review" : top.t === "battle" ? "battle" : top.t === "solo" ? "solo"
    : top.t === "profile" ? "profile" : top.t === "avatar" ? "avatar"
    : top.t === "olympiad" ? "olympiad" : "home";

  // The catalog Home screen (Level 1: domain group buttons + "For you" + section CTAs).
  const homeScreen = (
    <div className="app">
      <Topbar profile={data.profile} />
      {(() => {
        const rec = recommendedThemes(data.domains, data.profile.interests ?? []);
        if (rec.length === 0) return null;
        return (
          <div className="card domain-card">
            <div className="lesson-row" onClick={() => push({ t: "foryou" })}>
              <div className="icon">✨</div>
              <div className="meta">
                <div className="name">{lang === "ru" ? "Темы для тебя" : lang === "ro" ? "Teme pentru tine" : "Picked for you"}</div>
                <div className="sub">{rec.length} {lang === "ru" ? "тем" : lang === "ro" ? "teme" : "topics"}</div>
              </div>
              <div className="check-badge">›</div>
            </div>
          </div>
        );
      })()}
      {(() => {
        const unfinished = computeUnfinished(data.domains);
        if (unfinished.length === 0) return null;
        return (
          <div className="card domain-card">
            <div className="lesson-row" onClick={() => push({ t: "unfinished" })}>
              <div className="icon">▶️</div>
              <div className="meta">
                <div className="name">{lang === "ru" ? "Закончи начатое" : lang === "ro" ? "Termină ce ai început" : "Finish what you started"}</div>
                <div className="sub">{unfinished.length} {lang === "ru" ? "тем" : lang === "ro" ? "teme" : "topics"}</div>
              </div>
              <div className="check-badge">›</div>
            </div>
          </div>
        );
      })()}
      {data.domains.map((dom: DomainNode) => (
        <div className="card domain-card" key={dom.domain}>
          <div className="lesson-row" onClick={() => push({ t: "domain", domain: dom })}>
            <div className="icon">{DOMAIN_ICON[dom.domain] ?? "📚"}</div>
            <div className="meta">
              <div className="name">{dom.title[lang]}</div>
              <div className="sub">
                {dom.domain === "languages"
                  ? `${groupLangs(dom).length} ${t("langsWord", lang)}`
                  : dom.domain === "countries"
                  ? `${dom.tracks.reduce((n, tr) => n + tr.themes.length, 0)} ${t("countriesWord", lang)}`
                  : `${dom.tracks.length} ${t(dom.domain === "school" ? "subjectsWord" : "skillsWord", lang)}`}
              </div>
            </div>
            <div className="check-badge">›</div>
          </div>
        </div>
      ))}
      <div className="home-actions">
        <button className="btn battle-cta" onClick={() => push({ t: "battle" })}>
          {t("battle", lang)}
        </button>
        <button className="btn solo-cta" onClick={() => push({ t: "solo" })}>
          {lang === "ru" ? "⚡ Тайм-атака" : lang === "ro" ? "⚡ Time-attack" : "⚡ Time Attack"}
        </button>
        <button className="btn ghost" onClick={() => push({ t: "charts" })}>
          {t("leaderboard", lang)}
        </button>
        <button className="btn ghost" onClick={() => push({ t: "league" })}>
          {lang === "ru" ? "🏅 Лига недели" : lang === "ro" ? "🏅 Liga săptămânii" : "🏅 Weekly League"}
        </button>
        {(() => {
          const now = Date.now();
          const srs = data.profile.srs ?? {};
          const wordsDue = Object.entries(srs).filter(([k, v]) => !k.startsWith("sbj:") && (v as { due: number }).due <= now).length;
          const sbjDue = Object.entries(srs).filter(([k, v]) => k.startsWith("sbj:") && (v as { due: number }).due <= now).length;
          return (
            <>
              <button className="btn ghost" onClick={() => push({ t: "review" })}>
                {lang === "ru" ? "🔁 Повторение слов" : lang === "ro" ? "🔁 Recapitulare cuvinte" : "🔁 Review words"}
                {wordsDue > 0 && <span className="review-due-badge">{wordsDue}</span>}
              </button>
              <button className="btn ghost" onClick={() => push({ t: "review-subjects" })}>
                {lang === "ru" ? "🧠 Повторение предметов" : lang === "ro" ? "🧠 Recapitulare subiecte" : "🧠 Review subjects"}
                {sbjDue > 0 && <span className="review-due-badge">{sbjDue}</span>}
              </button>
            </>
          );
        })()}
        <button className="btn ghost" onClick={() => push({ t: "shop" })}>
          {(lang === "ru" ? "🛒 Магазин" : lang === "ro" ? "🛒 Magazin" : "🛒 Shop") + ` · 🪙 ${data.profile.coins ?? 0}`}
        </button>
        <button className="btn ghost" onClick={() => push({ t: "moldova" })}>
          {lang === "ru" ? "🇲🇩 Молдова" : lang === "ro" ? "🇲🇩 Moldova" : "🇲🇩 Moldova"}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            const link = `https://t.me/${BOT_USERNAME}?startapp=ref${data.profile.telegramId}`;
            const text =
              lang === "ru" ? "Учись и играй вместе со мной в Learningo! 🎓"
              : lang === "ro" ? "Învață jucându-te cu mine pe Learningo! 🎓"
              : "Learn by playing with me on Learningo! 🎓";
            openTgLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
          }}
        >
          {(lang === "ru" ? "📣 Пригласить друга" : lang === "ro" ? "📣 Invită un prieten" : "📣 Invite a friend") +
            (data.profile.refs ? ` · ${data.profile.refs}` : "")}
        </button>
        <button className="btn ghost" onClick={() => push({ t: "profile" })}>
          {lang === "ru" ? "👤 Профиль" : lang === "ro" ? "👤 Profil" : "👤 Profile"}
        </button>
        <button className="btn ghost" onClick={() => push({ t: "avatar" })}>
          {lang === "ru" ? "🎨 Аватар" : lang === "ro" ? "🎨 Avatar" : "🎨 Avatar"}
        </button>
      </div>
      {isTelegram && <button className="btn ghost" onClick={() => reset({ t: "landing" })}>{t("toHome", lang)}</button>}
    </div>
  );

  // --- Full-screen frames: rendered WITHOUT the shell (early returns) ---
  if (top.t === "landing") {
    return (
      <Landing
        profile={data.profile}
        lang={lang}
        onLang={changeLang}
        onStart={() => setNav([{ t: "home" }])}
        onRandom={() => push({ t: "random" })}
      />
    );
  }
  if (top.t === "lesson") {
    return (
      <LessonView
        lessonId={top.lessonId}
        lang={lang}
        onLang={changeLang}
        onExit={() => { back(); load(); }}
      />
    );
  }

  // --- Everything else renders INSIDE the desktop sidebar shell ---
  const screen = (() => {
    switch (top.t) {
      case "home":
        return homeScreen;
      case "profile":
        return <Profile profile={data.profile} lang={lang} onBack={() => { back(); load(); }} />;
      case "avatar":
        return (
          <Suspense fallback={<div className="app center muted">…</div>}>
            <AvatarEditor lang={lang} onBack={back} />
          </Suspense>
        );
      case "random":
        return <RandomFact lang={lang} onExit={() => { back(); load(); }} />;
      case "foryou": {
        const rec = recommendedThemes(data.domains, data.profile.interests ?? []);
        return (
          <div className="app">
            <div className="prompt">✨ {lang === "ru" ? "Темы для тебя" : lang === "ro" ? "Teme pentru tine" : "Picked for you"}</div>
            {rec.map(({ th, tr }) => (
              <div className="card" key={tr.key + th.id}>
                <div className="lesson-row" onClick={() => push({ t: "picker", theme: th })}>
                  <div className="icon">{th.icon}</div>
                  <div className="meta"><div className="name">{th.title[lang]}</div><div className="sub">{tr.title[lang]}</div></div>
                  <div className="check-badge">›</div>
                </div>
              </div>
            ))}
            <div className="actions"><button className="btn ghost" onClick={back}>{t("back", lang)}</button></div>
          </div>
        );
      }
      case "unfinished": {
        const items = computeUnfinished(data.domains);
        return (
          <div className="app">
            <div className="prompt">▶️ {lang === "ru" ? "Закончи начатое" : lang === "ro" ? "Termină ce ai început" : "Finish what you started"}</div>
            {items.map(({ th, tr }) => {
              const done = th.levels.filter((l) => l.completed).length;
              return (
                <div className="card" key={"unf" + tr.key + th.id}>
                  <div className="lesson-row" onClick={() => push({ t: "picker", theme: th })}>
                    <div className="icon">{th.icon}</div>
                    <div className="meta"><div className="name">{th.title[lang]}</div><div className="sub">{tr.title[lang]} · {done}/{th.levels.length} ✓</div></div>
                    <div className="check-badge">›</div>
                  </div>
                </div>
              );
            })}
            <div className="actions"><button className="btn ghost" onClick={back}>{t("back", lang)}</button></div>
          </div>
        );
      }
      case "battle":
        return <Battle lang={lang} onExit={() => { back(); load(); }} />;
      case "solo":
        return <Solo lang={lang} onExit={() => { back(); load(); }} />;
      case "charts":
        return <Leaderboard lang={lang} onExit={back} />;
      case "league":
        return <LeagueView lang={lang} onExit={back} />;
      case "review":
        return <ReviewView lang={lang} onExit={() => { back(); load(); }} />;
      case "review-subjects":
        return <SubjectReviewView lang={lang} onExit={() => { back(); load(); }} />;
      case "shop":
        return <Shop lang={lang} onExit={() => { back(); load(); }} />;
      case "moldova":
        return <MoldovaView lang={lang} onBack={() => { back(); load(); }} />;
      case "olympiad":
        return <OlympiadView lang={lang} onBack={back} />;
      case "picker": {
        const theme = top.theme;
        return (
          <div className="app">
            <div className="prompt">{theme.icon} {theme.title[lang]}</div>
            <div className="unit-title">{t("chooseLevel", lang)}</div>
            {theme.levels.map((lvl) => (
              <div className="card" key={lvl.lessonId}>
                <div className="lesson-row" onClick={() => push({ t: "lesson", lessonId: lvl.lessonId })}>
                  <div className="icon">{DIFF_EMOJI[lvl.difficulty]}</div>
                  <div className="meta">
                    <div className="name">{t(lvl.difficulty, lang)}</div>
                    <div className="sub">{lvl.count} {t("tasks", lang)} {lvl.completed ? `· ${t("completed", lang)}` : ""}</div>
                  </div>
                  {lvl.completed && <div className="check-badge">✓</div>}
                </div>
              </div>
            ))}
            <div className="actions">
              <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
            </div>
          </div>
        );
      }
      case "track": {
        const track = top.track;
        return (
          <div className="app">
            <div className="prompt">{track.icon} {track.title[lang]}</div>
            {track.themes.map((th) => {
              const done = th.levels.filter((l) => l.completed).length;
              return (
                <div className="card" key={th.id}>
                  <div className="lesson-row" onClick={() => push({ t: "picker", theme: th })}>
                    <div className="icon">{th.icon}</div>
                    <div className="meta">
                      <div className="name">{th.title[lang]}</div>
                      <div className="sub">{done}/{th.levels.length} ✓</div>
                    </div>
                    <div className="check-badge">›</div>
                  </div>
                </div>
              );
            })}
            <div className="actions">
              <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
            </div>
          </div>
        );
      }
      case "domain": {
        const dom = top.domain;
        // Languages: an extra level — show the language-group list.
        if (dom.domain === "languages") {
          return (
            <div className="app">
              <div className="prompt">{DOMAIN_ICON.languages} {dom.title[lang]}</div>
              {groupLangs(dom).map((g) => (
                <div className="card" key={g.key}>
                  <div className="lesson-row" onClick={() => push({ t: "langGroup", domain: dom, group: g })}>
                    <div className="icon">{g.icon}</div>
                    <div className="meta">
                      <div className="name">{g.tracks[0].title[lang].split(" · ")[0]}</div>
                      <div className="sub">{g.tracks.length} {t("levels", lang)}</div>
                    </div>
                    <div className="check-badge">›</div>
                  </div>
                </div>
              ))}
              <div className="actions">
                <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
              </div>
            </div>
          );
        }
        // School: pick a subject first; subjects with grades drill into a grade list.
        if (dom.domain === "school") {
          const groups = groupSchool(dom);
          return (
            <div className="app">
              <div className="prompt">{DOMAIN_ICON[dom.domain] ?? "📚"} {dom.title[lang]}</div>
              {groups.map((g) => (
                <div className="card" key={g.key}>
                  <div
                    className="lesson-row"
                    onClick={() => g.tracks.length === 1
                      ? push({ t: "track", track: g.tracks[0] })
                      : push({ t: "langGroup", domain: dom, group: g })}
                  >
                    <div className="icon">{g.icon}</div>
                    <div className="meta">
                      <div className="name">{g.tracks[0].title[lang].split(" · ")[0]}</div>
                      <div className="sub">{g.tracks.length === 1
                        ? `${g.tracks[0].themes.length} ${lang === "ru" ? "тем" : lang === "ro" ? "teme" : "topics"}`
                        : `${g.tracks.length} ${lang === "ru" ? "классов" : lang === "ro" ? "clase" : "grades"}`}</div>
                    </div>
                    <div className="check-badge">›</div>
                  </div>
                </div>
              ))}
              <div className="actions">
                <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
              </div>
            </div>
          );
        }
        // Other domains: show the track list directly.
        return (
          <div className="app">
            <div className="prompt">{DOMAIN_ICON[dom.domain]} {dom.title[lang]}</div>
            {dom.tracks.map((tr) => (
              <div className="card" key={tr.key}>
                <div className="lesson-row" onClick={() => push({ t: "track", track: tr })}>
                  <div className="icon">{tr.icon}</div>
                  <div className="meta">
                    <div className="name">{tr.title[lang]}</div>
                    <div className="sub">{tr.themes.length} · {trackDone(tr)} ✓</div>
                  </div>
                  <div className="check-badge">›</div>
                </div>
              </div>
            ))}
            <div className="actions">
              <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
            </div>
          </div>
        );
      }
      case "langGroup": {
        const group = top.group;
        const heading = group.tracks[0].title[lang].split(" · ")[0];
        return (
          <div className="app">
            <div className="prompt">{group.icon} {heading}</div>
            {group.tracks.map((tr) => (
              <div className="card" key={tr.key}>
                <div className="lesson-row" onClick={() => push({ t: "track", track: tr })}>
                  <div className="icon">{tr.icon}</div>
                  <div className="meta">
                    <div className="name">{tr.title[lang]}</div>
                    <div className="sub">{tr.themes.length} · {trackDone(tr)} ✓</div>
                  </div>
                  <div className="check-badge">›</div>
                </div>
              </div>
            ))}
            <div className="actions">
              <button className="btn ghost" onClick={back}>{t("back", lang)}</button>
            </div>
          </div>
        );
      }
      // 'lesson' and 'landing' are full-screen — handled above as early returns,
      // so TypeScript has already narrowed them out of `top` here.
      default: {
        const _exhaustive: never = top;
        return _exhaustive;
      }
    }
  })();

  return (
    <AppShell lang={lang} profile={data.profile} active={active} onNav={go} onLang={changeLang}>
      {screen}
    </AppShell>
  );
}

function LoginScreen({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    (window as unknown as { onTelegramAuth: (u: Record<string, unknown>) => void }).onTelegramAuth =
      async (user) => {
        try {
          const { token } = await api.telegramWidget(user);
          setToken(token);
          window.location.reload();
        } catch (e) {
          alert("Login failed: " + e);
        }
      };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", BOT_USERNAME);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    s.setAttribute("data-request-access", "write");
    ref.current?.appendChild(s);
  }, []);

  // Robust deep-link login: open bot, poll until confirmed.
  const startDeepLink = async () => {
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

  const btnLabel = lang === "ru" ? "Войти через Telegram" : lang === "ro" ? "Conectează-te cu Telegram" : "Log in with Telegram";
  const waitLabel = lang === "ru" ? "Подтверди в Telegram и вернись сюда…" : lang === "ro" ? "Confirmă în Telegram și revino…" : "Confirm in Telegram and come back…";

  return (
    <div className="app center">
      <div className="big">{t("loginTitle", lang)}</div>
      <div className="muted" style={{ margin: "12px 0 24px" }}>{t("loginHint", lang)}</div>
      <button className="btn" onClick={startDeepLink} disabled={waiting}>🚀 {btnLabel}</button>
      {waiting && <div className="muted" style={{ marginTop: 14 }}>{waitLabel}</div>}
      <div className="muted" style={{ margin: "24px 0 8px", fontSize: 13 }}>— или —</div>
      <div ref={ref} style={{ display: "flex", justifyContent: "center" }} />
    </div>
  );
}

function Topbar({ profile }: { profile: UserProfile }) {
  return (
    <div className="topbar">
      <div className="brand">{t("appTitle", profile.lang)}</div>
      <div className="stats">
        <div className="pill xp">⭐ {profile.xp}</div>
        <div className="pill streak">🔥 {profile.streak}</div>
      </div>
    </div>
  );
}

// Compact ru/ro/en switcher, reused in the topbar and inside lessons.
function LangSwitch({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  return (
    <div className="lang-switch">
      {LANGS.map((l) => (
        <button key={l} className={l === lang ? "active" : ""} onClick={() => onLang(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

// Shows the language-matched illustration (/media/<id>-<lang>.png) when it exists,
// falling back to the English base (/media/<id>.png).
function MediaImg({ image, lang, className, alt, emoji }: { image: string; lang: Lang; className: string; alt: string; emoji?: string }) {
  // Stage 0: localized variant (<id>-<lang>.png); 1: English base (<id>.png); 2: gave up.
  const [stage, setStage] = useState<0 | 1 | 2>(lang === "en" ? 1 : 0);
  useEffect(() => setStage(lang === "en" ? 1 : 0), [image, lang]);
  if (stage === 2) {
    // Photo not generated yet (e.g. a freshly-mapped word) → show the emoji, never a broken icon.
    return emoji ? <span className={`${className} media-emoji`} role="img" aria-label={alt}>{emoji}</span> : null;
  }
  const src = stage === 0 ? `/media/${image}-${lang}.png` : `/media/${image}.png`;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setStage((s) => (s + 1) as 0 | 1 | 2)} />;
}

// One option in a "picture" exercise: the word's photo, falling back to its text if the photo isn't generated yet.
function PicOption({ slug, label }: { slug: string; label: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [slug]);
  if (!slug || failed) return <span className="pic-fallback">{label}</span>;
  return <img src={`/media/${slug}.png`} alt={label} loading="lazy" onError={() => setFailed(true)} />;
}

function TeachBody({ item, lang }: { item: TeachItem; lang: Lang }) {
  if (item.sections?.length) {
    return (
      <>
        {item.sections.map((s, i) => (
          <div className="detail-section" key={i}>
            <h3 className="detail-h">{s.heading[lang]}</h3>
            <p className="detail-text">{s.body[lang]}</p>
          </div>
        ))}
      </>
    );
  }
  const text = (item.detail ?? item.body)?.[lang];
  return text ? <p className="detail-text">{text}</p> : null;
}

function TeachDetail({ item, lang, onClose }: { item: TeachItem; lang: Lang; onClose: () => void }) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-screen" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        {item.image && (
          <MediaImg image={item.image} lang={lang} className="detail-img" alt={item.title[lang]} emoji={item.emoji} />
        )}
        <div className="detail-body">
          <h2 className="detail-title">
            {item.emoji && <span>{item.emoji} </span>}
            {item.title[lang]}
          </h2>
          <TeachBody item={item} lang={lang} />
          {item.example && <p className="detail-ex muted">"{item.example}"</p>}
          <button className="btn" onClick={onClose}>{t("back", lang)}</button>
        </div>
      </div>
    </div>
  );
}

function initials(name: string) {
  return (name || "?").trim().slice(0, 2).toUpperCase();
}
const RANK_COLORS = ["#6C5CE7", "#FF6B6B", "#22C55E", "#f59e0b", "#0ea5e9", "#ec4899", "#14b8a6"];

function Leaderboard({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [data, setData] = useState<LeaderboardT | null>(null);
  const [sel, setSel] = useState<LeaderboardT["top"][number] | null>(null);
  useEffect(() => { api.leaderboard().then(setData).catch(() => setData(null)); }, []);

  if (!data) return <div className="app center muted">…</div>;

  const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`);
  const inTop = data.top.some((e) => e.me);

  return (
    <div className="app">
      <div className="prompt">{t("leaderboard", lang)}</div>
      <div className="lb-sub muted">
        {data.total} {t("players", lang)}
        {data.myRank != null && <> · {t("yourRank", lang)}: <b>#{data.myRank}</b></>}
      </div>
      <div className="lb-list">
        {data.top.map((e) => (
          <div className={"lb-row clickable" + (e.me ? " lb-me" : "") + (e.rank <= 3 ? " lb-top" : "")} key={e.rank} onClick={() => setSel(e)}>
            <div className="lb-rank">{medal(e.rank)}</div>
            <div className="lb-ava" style={{ background: RANK_COLORS[(e.rank - 1) % RANK_COLORS.length] }}>
              {initials(e.name)}
            </div>
            <div className="lb-name">
              {e.me ? t("you", lang) : e.name}
              {e.streak > 0 && <span className="lb-streak"> 🔥{e.streak}</span>}
            </div>
            <div className="lb-xp">⭐ {e.xp}</div>
          </div>
        ))}
      </div>
      {!inTop && data.myRank != null && (
        <div className="lb-row lb-me lb-floating">
          <div className="lb-rank">{data.myRank}</div>
          <div className="lb-ava" style={{ background: RANK_COLORS[0] }}>★</div>
          <div className="lb-name">{t("you", lang)}</div>
          <div className="lb-xp">⭐ {data.myXp}</div>
        </div>
      )}
      {sel && <PlayerCard p={sel} lang={lang} onClose={() => setSel(null)} />}
      <div className="actions">
        <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
      </div>
    </div>
  );
}

const TIER_ICON: Record<string, string> = { Diamond: "💎", Platinum: "🔷", Gold: "🥇", Silver: "🥈", Bronze: "🥉" };

// Public profile card shown when tapping a player in the leaderboard / league.
function PlayerCard({ p, lang, onClose }: { p: { name: string; xp?: number; weekXp?: number; streak?: number; lessons?: number; crowns?: number; tier?: string }; lang: Lang; onClose: () => void }) {
  const L = (ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);
  return (
    <div className="pc-backdrop" onClick={onClose}>
      <div className="pc-card" onClick={(e) => e.stopPropagation()}>
        <div className="pc-ava" style={{ background: RANK_COLORS[0] }}>{initials(p.name)}</div>
        <div className="pc-name">{p.name}{p.tier ? <span className="pc-tier"> · {TIER_ICON[p.tier] ?? ""} {p.tier}</span> : null}</div>
        <div className="pc-stats">
          <div><b>⭐ {p.weekXp ?? p.xp ?? 0}</b><span>{p.weekXp != null ? L("XP/нед", "XP/săpt", "Week XP") : "XP"}</span></div>
          <div><b>🔥 {p.streak ?? 0}</b><span>{L("Серия", "Serie", "Streak")}</span></div>
          <div><b>📚 {p.lessons ?? 0}</b><span>{L("Уроки", "Lecții", "Lessons")}</span></div>
          <div><b>👑 {p.crowns ?? 0}</b><span>{L("Короны", "Coroane", "Crowns")}</span></div>
        </div>
        <button className="btn ghost" onClick={onClose}>{t("back", lang)}</button>
      </div>
    </div>
  );
}

function LeagueView({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [data, setData] = useState<LeagueT | null>(null);
  const [sel, setSel] = useState<LeagueT["top"][number] | null>(null);
  const [leagueToast, setLeagueToast] = useState("");
  useEffect(() => { api.league().then(setData).catch(() => setData(null)); }, []);
  const L = {
    title: lang === "ru" ? "🏅 Лига недели" : lang === "ro" ? "🏅 Liga săptămânii" : "🏅 Weekly League",
    players: lang === "ru" ? "участников" : lang === "ro" ? "participanți" : "players",
    rank: lang === "ru" ? "Твоё место" : lang === "ro" ? "Locul tău" : "Your rank",
    empty: lang === "ru" ? "На этой неделе ещё никто не набрал XP. Будь первым!" : lang === "ro" ? "Nimeni n-a câștigat XP săptămâna asta. Fii primul!" : "No XP earned this week yet — be the first!",
    resets: lang === "ru" ? "Сброс в понедельник" : lang === "ro" ? "Resetare luni" : "Resets Monday",
    share: lang === "ru" ? "🔗 Поделиться результатом" : lang === "ro" ? "🔗 Distribuie rezultatul" : "🔗 Share result",
    copied: lang === "ru" ? "Ссылка скопирована!" : lang === "ro" ? "Link copiat!" : "Link copied!",
  };

  const onShareLeague = async () => {
    if (!data) return;
    const cardUrl = api.shareCardUrl("league", data.myWeekXp ?? 0, lang);
    const absUrl = `${window.location.origin}${cardUrl}`;
    const shareText =
      lang === "ru" ? `Мой XP за неделю в Learningo — ${data.myWeekXp ?? 0}!` :
      lang === "ro" ? `XP-ul meu săptămânal Learningo — ${data.myWeekXp ?? 0}!` :
      `My weekly XP in Learningo — ${data.myWeekXp ?? 0}!`;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      if (tg.openLink) tg.openLink(absUrl);
      else window.open(absUrl, "_blank");
    } else if (navigator.share) {
      try { await navigator.share({ url: absUrl, text: shareText }); } catch { /* dismissed */ }
    } else {
      try {
        await navigator.clipboard.writeText(absUrl);
        setLeagueToast(L.copied);
        setTimeout(() => setLeagueToast(""), 2500);
      } catch { setLeagueToast(absUrl); }
    }
  };

  if (!data) return <div className="app center muted">…</div>;
  const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`);
  const inTop = data.top.some((e) => e.me);
  return (
    <div className="app">
      <div className="prompt">{L.title}</div>
      <div className="lb-sub muted">
        {data.total} {L.players}
        {data.myTier && <> · <b>{TIER_ICON[data.myTier] ?? ""} {data.myTier}</b></>}
        {data.myRank != null && <> · {L.rank}: <b>#{data.myRank}</b></>}
        {" · "}{L.resets}
      </div>
      {data.top.length === 0 ? (
        <div className="lb-sub muted" style={{ marginTop: 24 }}>{L.empty}</div>
      ) : (
        <div className="lb-list">
          {data.top.map((e) => (
            <div className={"lb-row clickable" + (e.me ? " lb-me" : "") + (e.rank <= 3 ? " lb-top" : "")} key={e.rank} onClick={() => setSel(e)}>
              <div className="lb-rank">{medal(e.rank)}</div>
              <div className="lb-ava" style={{ background: RANK_COLORS[(e.rank - 1) % RANK_COLORS.length] }}>{initials(e.name)}</div>
              <div className="lb-name">{e.me ? t("you", lang) : e.name} <span className="lb-streak">{TIER_ICON[e.tier] ?? ""}</span></div>
              <div className="lb-xp">⭐ {e.weekXp}</div>
            </div>
          ))}
        </div>
      )}
      {!inTop && data.myRank != null && (
        <div className="lb-row lb-me lb-floating">
          <div className="lb-rank">{data.myRank}</div>
          <div className="lb-ava" style={{ background: RANK_COLORS[0] }}>★</div>
          <div className="lb-name">{t("you", lang)}</div>
          <div className="lb-xp">⭐ {data.myWeekXp}</div>
        </div>
      )}
      {sel && <PlayerCard p={sel} lang={lang} onClose={() => setSel(null)} />}
      {leagueToast && <div className="profile-toast">{leagueToast}</div>}
      <div className="actions">
        <button className="btn ghost" onClick={onShareLeague}>{L.share}</button>
        <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
      </div>
    </div>
  );
}

// Spaced-repetition vocabulary review: pick the foreign word for each translation.
function ReviewView({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [deck, setDeck] = useState<ReviewDeck | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => { api.review().then(setDeck).catch(() => setDeck({ items: [], due: 0 })); }, []);
  const L = (ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);
  const title = L("🔁 Повторение", "🔁 Recapitulare", "🔁 Review");

  if (!deck) return <div className="app center muted">…</div>;

  if (deck.items.length === 0) {
    return (
      <div className="app">
        <div className="prompt">{title}</div>
        <div className="lb-sub muted" style={{ marginTop: 24 }}>
          {L(
            "Пока нечего повторять — пройди несколько языковых уроков, и выученные слова появятся здесь для закрепления.",
            "Încă nimic de recapitulat — fă câteva lecții de limbă și cuvintele învățate vor apărea aici.",
            "Nothing to review yet — complete a few language lessons and the words you learn will show up here.",
          )}
        </div>
        <div className="actions"><button className="btn ghost" onClick={onExit}>{t("back", lang)}</button></div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="app center">
        <div className="rv-done">🎉</div>
        <div className="prompt">{L("Готово!", "Gata!", "Done!")}</div>
        <div className="lb-sub muted">{correct} / {deck.items.length} {L("верно", "corecte", "correct")}</div>
        <div className="actions"><button className="btn primary" onClick={onExit}>{t("back", lang)}</button></div>
      </div>
    );
  }

  const item = deck.items[idx];
  const answered = picked !== null;
  const last = idx + 1 >= deck.items.length;
  const advance = () => { if (last) setDone(true); else { setIdx(idx + 1); setPicked(null); } };
  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    const ok = i === item.answer;
    if (ok) setCorrect((c) => c + 1);
    api.reviewAnswer(item.key, ok).catch(() => {});
  };

  return (
    <div className="app">
      <div className="prompt">{title}</div>
      <div className="rv-progress muted">{idx + 1} / {deck.items.length}</div>
      <div className="rv-card">
        {item.emoji && <div className="rv-emoji">{item.emoji}</div>}
        <div className="rv-prompt">{item.prompt}</div>
      </div>
      <div className="rv-opts">
        {item.options.map((opt, i) => {
          let cls = "rv-opt";
          if (answered) cls += i === item.answer ? " ok" : i === picked ? " bad" : " dim";
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>{opt}</button>
          );
        })}
      </div>
      <div className="actions">
        {answered ? (
          <button className="btn primary" onClick={advance}>
            {last ? L("Завершить", "Termină", "Finish") : L("Дальше", "Mai departe", "Next")}
          </button>
        ) : (
          <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
        )}
      </div>
    </div>
  );
}

function SubjectReviewView({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [deck, setDeck] = useState<SubjectReviewDeck | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [showExpl, setShowExpl] = useState(false);
  useEffect(() => { api.reviewSubjects().then(setDeck).catch(() => setDeck({ items: [], due: 0 })); }, []);
  const L = (ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);

  if (!deck) return <div className="app center muted">…</div>;

  if (deck.items.length === 0) {
    return (
      <div className="app">
        <div className="prompt">🧠 {L("Повторение предметов", "Recapitulare subiecte", "Review subjects")}</div>
        <div className="lb-sub muted" style={{ marginTop: 24 }}>
          {L(
            "Пока нечего повторять — ответь неправильно на несколько вопросов в уроках по предметам, и они появятся здесь.",
            "Nimic de recapitulat — răspunde greșit la câteva întrebări din lecțiile de subiecte și vor apărea aici.",
            "Nothing to review yet — answer a few subject lesson questions incorrectly and they will show up here.",
          )}
        </div>
        <div className="actions"><button className="btn ghost" onClick={onExit}>{t("back", lang)}</button></div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="app center">
        <div className="rv-done">🎉</div>
        <div className="prompt">{L("Готово!", "Gata!", "Done!")}</div>
        <div className="lb-sub muted">{correct} / {deck.items.length} {L("верно", "corecte", "correct")}</div>
        <div className="actions"><button className="btn primary" onClick={onExit}>{t("back", lang)}</button></div>
      </div>
    );
  }

  const item = deck.items[idx];
  const answered = picked !== null;
  const last = idx + 1 >= deck.items.length;
  const advance = () => { if (last) setDone(true); else { setIdx(idx + 1); setPicked(null); setShowExpl(false); } };
  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    const ok = i === item.answerIndex;
    if (ok) setCorrect((c) => c + 1);
    api.reviewSubjectsAnswer(item.key, ok).catch(() => {});
  };

  const prompt = item.prompt[lang] || item.prompt.en;
  const expl = item.explanation?.[lang] || item.explanation?.en;

  return (
    <div className="app">
      <div className="prompt">🧠 {L("Повторение предметов", "Recapitulare subiecte", "Review subjects")}</div>
      <div className="rv-progress muted">{idx + 1} / {deck.items.length}</div>
      <div className="rv-card">
        <div className="rv-prompt">{prompt}</div>
      </div>
      <div className="rv-opts">
        {item.options.map((opt, i) => {
          let cls = "rv-opt";
          if (answered) cls += i === item.answerIndex ? " ok" : i === picked ? " bad" : " dim";
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>
              {opt[lang] || opt.en}
            </button>
          );
        })}
      </div>
      {answered && expl && (
        <div className="rv-expl muted" style={{ padding: "8px 16px", fontSize: 13, lineHeight: 1.4 }}>
          {showExpl ? expl : <button className="btn ghost" style={{ fontSize: 12, padding: "2px 8px" }} onClick={() => setShowExpl(true)}>{L("Почему?", "De ce?", "Why?")}</button>}
        </div>
      )}
      <div className="actions">
        {answered ? (
          <button className="btn primary" onClick={advance}>
            {last ? L("Завершить", "Termină", "Finish") : L("Дальше", "Mai departe", "Next")}
          </button>
        ) : (
          <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
        )}
      </div>
    </div>
  );
}

function RandomFact({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [fact, setFact] = useState<RandomFactT | null>(null);
  const [phase, setPhase] = useState<"teach" | "quiz" | "done">("teach");
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setPhase("teach");
    setIdx(0);
    api.randomFact().then((f) => { setFact(f); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading || !fact) return <div className="app center muted">…</div>;

  if (phase === "teach") {
    return (
      <div className="app">
        <div className="prompt">🎲 {t("randomFact", lang)}</div>
        <div className="fact-theme">{fact.themeTitle[lang]}</div>
        <div className="card fact-card">
          {fact.teach.image && (
            <MediaImg image={fact.teach.image} lang={lang} className="detail-img" alt={fact.teach.title[lang]} emoji={fact.teach.emoji} />
          )}
          <div className="detail-body">
            <h2 className="detail-title">
              {fact.teach.emoji && <span>{fact.teach.emoji} </span>}
              {fact.teach.title[lang]}
            </h2>
            <TeachBody item={fact.teach} lang={lang} />
            {fact.teach.example && <p className="detail-ex muted">"{fact.teach.example}"</p>}
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setPhase(fact.exercises.length ? "quiz" : "done")}>
            {t("checkYourself", lang)}
          </button>
          <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const ex = fact.exercises[idx];
    return (
      <div className="app">
        <div className="progress"><span style={{ width: `${(idx / fact.exercises.length) * 100}%` }} /></div>
        <ExerciseStep
          key={ex.id}
          lessonId={fact.lessonId}
          ex={ex}
          lang={lang}
          seed={fact.seed}
          onAdvance={() => { if (idx + 1 < fact.exercises.length) setIdx(idx + 1); else setPhase("done"); }}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="app center">
      <div className="big">{t("factDone", lang)}</div>
      <div className="actions">
        <button className="btn" onClick={load}>{t("anotherFact", lang)}</button>
        <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
      </div>
    </div>
  );
}

function LessonView({ lessonId, lang, onLang, onExit }: { lessonId: string; lang: Lang; onLang: (l: Lang) => void; onExit: () => void }) {
  const [lesson, setLesson] = useState<ClientLesson | null>(null);
  const [phase, setPhase] = useState<"teach" | "exercise">("teach");
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [detail, setDetail] = useState<TeachItem | null>(null);

  const tlang = lessonId.split("-")[0]; // "en" | "de" — target language for TTS
  const speakWord = (word: string) => {
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = TTS_LANG[tlang] ?? "en-US";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* TTS unsupported */ }
  };

  useEffect(() => {
    api.lesson(lessonId).then((l) => { setLesson(l); setPhase(l.teach.length ? "teach" : "exercise"); });
  }, [lessonId]);

  if (!lesson) return <div className="app center muted">…</div>;

  if (done) {
    return (
      <div className="app center lesson-done">
        <div className="confetti" aria-hidden="true">
          {["🎉", "🎊", "✨", "⭐", "🎉", "🎊", "✨", "⭐"].map((c, i) => (
            <span key={i} style={{ "--d": `${i * 0.13}s`, "--x": `${(i - 3.5) * 18}px` } as React.CSSProperties}>{c}</span>
          ))}
        </div>
        <div className="done-trophy">🏆</div>
        <div className="big">{t("lessonDone", lang)}</div>
        <button className="btn" onClick={onExit}>{t("back", lang)}</button>
      </div>
    );
  }

  if (phase === "teach") {
    return (
      <div className="app">
        <div className="lesson-langbar"><LangSwitch lang={lang} onLang={onLang} /></div>
        <div className="prompt">📖 {t(lesson.kind === "subject" ? "learnTitleSubj" : "learnTitle", lang)}</div>
        {lesson.teach.map((item, i) => {
          const rich = !!(item.image || item.detail);
          return (
            <div
              className={"card teach-card" + (rich ? " teach-card--rich" : "")}
              key={i}
              onClick={rich ? () => setDetail(item) : undefined}
              role={rich ? "button" : undefined}
              tabIndex={rich ? 0 : undefined}
            >
              {lesson.teach.length > 1 && <span className="teach-step">{i + 1}/{lesson.teach.length}</span>}
              {item.image && (
                <MediaImg image={item.image} lang={lang} className="teach-thumb" alt="" />
              )}
              <div className="teach-row">
                <div className="teach-emoji">{item.emoji ?? "•"}</div>
                <div className="teach-content">
                  <div className="teach-word-line">
                    <span className="teach-term">{item.title[lang]}</span>
                    {item.audioWord && (
                      <button
                        className="tts-btn"
                        title="Произношение"
                        onClick={(e) => { e.stopPropagation(); speakWord(item.audioWord!); }}
                      >🔊</button>
                    )}
                  </div>
                  {(() => { const ph = item.phonetic && (lang === "ru" ? item.phonetic.ru : lang === "ro" ? item.phonetic.ro : item.phonetic.ipa); return ph ? <div className="teach-phonetic">{ph}</div> : null; })()}
                  {item.body && <div className="teach-tr">{item.body[lang]}</div>}
                  {item.example && <div className="teach-ex">💬 {item.example}</div>}
                </div>
              </div>
              {rich && <div className="teach-more">{t("tapForMore", lang)} →</div>}
            </div>
          );
        })}
        <div className="actions">
          <button className="btn" onClick={() => setPhase("exercise")}>{t("continue", lang)}</button>
          <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
        </div>
        {detail && <TeachDetail item={detail} lang={lang} onClose={() => setDetail(null)} />}
      </div>
    );
  }

  const advance = async () => {
    if (idx + 1 < lesson.exercises.length) setIdx(idx + 1);
    else { await api.complete(lessonId, lesson.seed); primeAudio(); sfx.celebrate(); setDone(true); }
  };

  return (
    <div className="app">
      <div className="lesson-langbar"><LangSwitch lang={lang} onLang={onLang} /></div>
      <div className="progress"><span style={{ width: `${(idx / lesson.exercises.length) * 100}%` }} /></div>
      <ExerciseStep
        key={lesson.exercises[idx].id}
        lessonId={lessonId}
        ex={lesson.exercises[idx]}
        lang={lang}
        seed={lesson.seed}
        onAdvance={advance}
        onExit={onExit}
      />
    </div>
  );
}

function ExerciseStep({
  lessonId, ex, lang, seed, onAdvance, onExit,
}: {
  lessonId: string; ex: ClientExercise; lang: Lang; seed?: number; onAdvance: () => void; onExit: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [built, setBuilt] = useState<string[]>([]);
  const [selWord, setSelWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<{ word: string; emoji: string }[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.answer>> | null>(null);

  const tlang = lessonId.split("-")[0]; // "en" | "de" | … (target language for TTS)
  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = TTS_LANG[tlang] ?? "en-US";
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* TTS unsupported */ }
  };
  // auto-play once for audio exercises
  useEffect(() => {
    if (ex.type === "listen" || ex.type === "dictation" || ex.type === "flashcards") speak(ex.audioWord ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  const pickOpt = ex.type === "choice" || ex.type === "cloze" || ex.type === "oddoneout";
  const isPicture = ex.type === "picture";
  const pickIdx = ex.type === "mcq" || ex.type === "listen" || ex.type === "truefalse";
  const isFlash = ex.type === "flashcards";
  const typeIn = ex.type === "translate" || ex.type === "dictation";

  let response: AnswerInput = "";
  let ready = false;
  if (pickOpt || isPicture) { response = selected; ready = !!selected; }
  else if (pickIdx || isFlash) { response = selIdx ?? -1; ready = selIdx !== null; }
  else if (typeIn) { response = typed; ready = typed.trim().length > 0; }
  else if (ex.type === "order") { response = built.map((b) => b.split("#")[0]).join(" "); ready = built.length === (ex.tokens ?? []).length; }
  else if (ex.type === "match") { response = matched; ready = matched.length === (ex.words ?? []).length; }

  const check = async () => setResult(await api.answer(lessonId, ex.id, response, seed));

  return (
    <>
      <div className="prompt">{ex.prompt[lang]}</div>

      {(ex.type === "listen" || ex.type === "dictation") && (
        <button className="btn ghost audio-btn" onClick={() => speak(ex.audioWord ?? "")}>{t("playAudio", lang)}</button>
      )}

      {pickOpt && ex.options!.map((opt) => {
        let cls = "option";
        if (result) { if (opt === result.correctAnswer) cls += " correct"; else if (opt === selected) cls += " wrong"; }
        else if (opt === selected) cls += " selected";
        return <button key={opt} className={cls} disabled={!!result} onClick={() => setSelected(opt)}>{opt}</button>;
      })}

      {isPicture && (
        <div className="pic-grid">
          {ex.options!.map((opt, i) => {
            let cls = "pic-opt";
            if (result) { if (opt === result.correctAnswer) cls += " correct"; else if (opt === selected) cls += " wrong"; }
            else if (opt === selected) cls += " selected";
            return (
              <button key={opt} className={cls} disabled={!!result} onClick={() => setSelected(opt)}>
                <PicOption slug={ex.photos?.[i] ?? ""} label={opt} />
              </button>
            );
          })}
        </div>
      )}

      {pickIdx && ex.optionsLoc!.map((opt, i) => {
        let cls = "option";
        if (result) { if (i === result.correctIndex) cls += " correct"; else if (i === selIdx) cls += " wrong"; }
        else if (i === selIdx) cls += " selected";
        return <button key={i} className={cls} disabled={!!result} onClick={() => setSelIdx(i)}>{opt[lang]}</button>;
      })}

      {isFlash && (
        <div className="flashcard">
          <button type="button" className="flash-face" onClick={() => speak(ex.audioWord ?? "")}>
            <span className="flash-word">{ex.audioWord}</span>
            <span className="flash-hint">🔊</span>
          </button>
          {!flipped ? (
            <button className="btn" disabled={!!result} onClick={() => setFlipped(true)}>{t("flip", lang)}</button>
          ) : (
            <>
              <div className="flash-back">{ex.reveal?.[lang]}</div>
              {ex.optionsLoc!.map((opt, i) => {
                let cls = "option";
                if (result) { if (i === result.correctIndex) cls += " correct"; else if (i === selIdx) cls += " wrong"; }
                else if (i === selIdx) cls += " selected";
                return <button key={i} className={cls} disabled={!!result} onClick={() => setSelIdx(i)}>{opt[lang]}</button>;
              })}
            </>
          )}
        </div>
      )}

      {typeIn && (
        <input className="answer" placeholder={t("typeAnswer", lang)} value={typed} disabled={!!result} onChange={(e) => setTyped(e.target.value)} />
      )}

      {ex.type === "order" && (
        <>
          <div className="muted" style={{ marginBottom: 8 }}>{t("tapToBuild", lang)}</div>
          <div className="built">
            {built.map((b) => (
              <button key={b} className="token" disabled={!!result} onClick={() => setBuilt(built.filter((x) => x !== b))}>{b.split("#")[0]}</button>
            ))}
          </div>
          <div className="tokenbar">
            {(ex.tokens ?? []).map((tk, i) => {
              const id = `${tk}#${i}`;
              if (built.includes(id)) return null;
              return <button key={id} className="token ghosttoken" disabled={!!result} onClick={() => setBuilt([...built, id])}>{tk}</button>;
            })}
          </div>
        </>
      )}

      {ex.type === "match" && (
        <div className="match-grid">
          <div className="match-col">
            {(ex.words ?? []).map((wd) => {
              const used = matched.some((m) => m.word === wd);
              return <button key={wd} className={`chip ${selWord === wd ? "selected" : ""} ${used ? "used" : ""}`} disabled={used || !!result} onClick={() => setSelWord(wd)}>{wd}</button>;
            })}
          </div>
          <div className="match-col">
            {(ex.emojis ?? []).map((em) => {
              const used = matched.some((m) => m.emoji === em);
              return <button key={em} className={`chip emoji ${used ? "used" : ""}`} disabled={used || !!result} onClick={() => { if (selWord) { setMatched([...matched, { word: selWord, emoji: em }]); setSelWord(null); } }}>{em}</button>;
            })}
          </div>
        </div>
      )}

      {result && (
        <div className={`feedback ${result.correct ? "ok" : "bad"}`}>
          <div className="head">
            {result.correct ? `✅ ${t("correct", lang)} +${result.xpAwarded}⭐` : `❌ ${t("wrong", lang)}`}
          </div>
          {!result.correct && ex.type !== "flashcards" && (
            <div style={{ marginBottom: 6 }}>
              → {ex.type === "mcq" && result.correctIndex != null ? ex.optionsLoc![result.correctIndex][lang] : result.correctAnswer}
            </div>
          )}
          <div className="muted">{result.explanation[lang]}</div>
        </div>
      )}

      <div className="actions">
        {!result ? (
          <button className="btn" disabled={!ready} onClick={check}>{t("check", lang)}</button>
        ) : (
          <button className="btn" onClick={onAdvance}>{t("next", lang)}</button>
        )}
        <button className="btn ghost" onClick={onExit}>{t("back", lang)}</button>
      </div>
    </>
  );
}
