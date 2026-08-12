import type { Lang } from "@app/shared";
import "./welcome.css";

const LANGS: Lang[] = ["ru", "ro", "en"];
type L = Record<Lang, string>;

const S: Record<string, L> = {
  brand: { ru: "LEARNINGO", ro: "LEARNINGO", en: "LEARNINGO" },
  tagline: {
    ru: "Учись, соревнуйся, побеждай",
    ro: "Învață, concurează, învinge",
    en: "Learn, compete, win",
  },
  c1name: { ru: "Учись и проверяй себя", ro: "Învață și verifică-te", en: "Learn & test yourself" },
  c1body: {
    ru: "Новые темы и проверка того, что ты уже знаешь — даже своей профессии.",
    ro: "Teme noi și un test al cunoștințelor tale — chiar și al profesiei tale.",
    en: "New topics and a check of what you already know — even your profession.",
  },
  c2name: { ru: "Глобальный рейтинг", ro: "Clasament global", en: "Global leaderboard" },
  c2body: {
    ru: "Один общий зачёт — соревнуйся со всеми игроками за вершину.",
    ro: "Un singur clasament — concurează cu toți jucătorii pentru vârf.",
    en: "One shared ladder — compete with every player for the top.",
  },
  c3name: { ru: "Дуэли 1 на 1", ro: "Dueluri 1 la 1", en: "1-on-1 duels" },
  c3body: {
    ru: "Сражайся знаниями с живыми соперниками в реальном времени.",
    ro: "Luptă cu cunoștințe împotriva unor adversari reali, în timp real.",
    en: "Battle live opponents with your knowledge in real time.",
  },
  cta: { ru: "🚀 Поехали!", ro: "🚀 Să începem!", en: "🚀 Let's go!" },
};

export function Welcome({
  lang,
  onLang,
  onDone,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  onDone: () => void;
}) {
  const cards = [
    { cls: "learn", emoji: "🧠", name: S.c1name[lang], body: S.c1body[lang] },
    { cls: "rank", emoji: "🏆", name: S.c2name[lang], body: S.c2body[lang] },
    { cls: "duel", emoji: "⚔️", name: S.c3name[lang], body: S.c3body[lang] },
  ];

  return (
    <div className="app welcome wc">
      <header className="wc-top">
        <div className="wc-brand">🎓 {S.brand[lang]}</div>
        <div className="wc-lang" role="group" aria-label="Language">
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

      <section className="wc-hero">
        <div className="wc-hero-glow" aria-hidden="true" />
        <div className="wc-hero-emoji">🎓</div>
        <h1 className="wc-hero-title">{S.brand[lang]}</h1>
        <p className="wc-hero-tagline">{S.tagline[lang]}</p>
      </section>

      <ul className="wc-cards">
        {cards.map((c, i) => (
          <li className={`wc-card ${c.cls}`} key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <span className="wc-card-icon" aria-hidden="true">{c.emoji}</span>
            <span className="wc-card-text">
              <span className="wc-card-name">{c.name}</span>
              <span className="wc-card-body">{c.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="wc-actions">
        <button type="button" className="wc-cta" onClick={onDone}>
          {S.cta[lang]}
        </button>
      </div>
    </div>
  );
}
