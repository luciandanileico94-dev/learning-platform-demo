import type { Lang, UserProfile } from "@app/shared";
import { isTelegram } from "../telegram";

export type NavKey =
  | "home" | "learn" | "battle" | "solo" | "league" | "review"
  | "shop" | "moldova" | "olympiad" | "charts" | "profile" | "avatar";

// key → emoji + trilingual label. Labels reuse the exact wording already used in App.tsx.
const NAV: { key: NavKey; icon: string; label: Record<Lang, string> }[] = [
  { key: "home", icon: "🏠", label: { ru: "Главная", ro: "Acasă", en: "Home" } },
  { key: "learn", icon: "📚", label: { ru: "Учить", ro: "Învață", en: "Learn" } },
  { key: "battle", icon: "⚔️", label: { ru: "Баттл", ro: "Battle", en: "Battle" } },
  { key: "solo", icon: "⚡", label: { ru: "Тайм-атака", ro: "Time-attack", en: "Time Attack" } },
  { key: "league", icon: "🏅", label: { ru: "Лига", ro: "Liga", en: "League" } },
  { key: "review", icon: "🔁", label: { ru: "Повторение", ro: "Recapitulare", en: "Review" } },
  { key: "shop", icon: "🛒", label: { ru: "Магазин", ro: "Magazin", en: "Shop" } },
  { key: "moldova", icon: "🇲🇩", label: { ru: "Молдова", ro: "Moldova", en: "Moldova" } },
  { key: "olympiad", icon: "🥇", label: { ru: "Олимпиады", ro: "Olimpiade", en: "Olympiads" } },
  { key: "charts", icon: "🏆", label: { ru: "Чарты", ro: "Clasament", en: "Leaderboard" } },
  { key: "profile", icon: "👤", label: { ru: "Профиль", ro: "Profil", en: "Profile" } },
  { key: "avatar", icon: "🎨", label: { ru: "Аватар", ro: "Avatar", en: "Avatar" } },
];

export function AppShell({
  lang, profile, active, onNav, onLang, children,
}: {
  lang: Lang;
  profile: UserProfile;
  active: NavKey;
  onNav: (key: NavKey) => void;
  onLang: (l: Lang) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={"shell" + (isTelegram ? " shell--tg" : "")}>
      <aside className="shell-nav">
        <div className="shell-brand">🎓 LEARNINGO</div>
        <nav className="shell-items">
          {NAV.map((item) => (
            <button
              key={item.key}
              className={"shell-item" + (item.key === active ? " is-active" : "")}
              onClick={() => onNav(item.key)}
            >
              <span className="shell-ico">{item.icon}</span>
              <span className="shell-label">{item.label[lang]}</span>
            </button>
          ))}
        </nav>
        <div className="shell-foot">
          🔥 {profile.streak} · ⭐ {profile.xp} · 🪙 {profile.coins ?? 0}
        </div>
      </aside>
      <main className="shell-main">
        {/* Always-present language switcher (every shell screen) */}
        <div className="lang-switch shell-langbar">
          {(["ru", "ro", "en"] as Lang[]).map((l) => (
            <button key={l} className={l === lang ? "active" : ""} onClick={() => onLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
