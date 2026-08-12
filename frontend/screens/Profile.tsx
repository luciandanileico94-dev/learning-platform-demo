import { useEffect, useState, useCallback } from "react";
import type { Lang, UserProfile } from "@app/shared";
import { api } from "../api";
import "./profile.css";

// ── Daily-challenge API shape (mirror of backend gamification.DailyState) ──
interface Quest {
  id: string;
  goal: number;
  progress: number;
  done: boolean;
  rewarded: boolean;
}
interface DailyState {
  quests?: Quest[];
  goalXp: number;
  earnedToday: number;
  done: boolean;
  claimed: boolean;
  claimable: boolean;
  reward: number;
  weeklyQuestStreak?: number;
  weeklyStreakReady?: boolean;
}

const QEMOJI: Record<string, string> = {
  xp: "⭐",
  lessons: "📚",
  duels: "⚔️",
  review: "🔁",
  battle_xp: "🥊",
  streak: "🔥",
};
const QLABEL: Record<string, Record<Lang, string>> = {
  xp: { ru: "Заработай XP сегодня", ro: "Câștigă XP azi", en: "Earn XP today" },
  lessons: { ru: "Пройди уроки", ro: "Termină lecții", en: "Complete lessons" },
  duels: { ru: "Сыграй дуэль", ro: "Joacă un duel", en: "Play a duel" },
  review: { ru: "Повтори карточки", ro: "Revizuiește carduri", en: "Review flashcards" },
  battle_xp: { ru: "XP в битвах", ro: "XP în batalii", en: "Battle XP" },
  streak: { ru: "Активная серия", ro: "Serie activă", en: "Active streak" },
};

// ── Local strings (do NOT touch global i18n) ──
type Key =
  | "title"
  | "xp"
  | "streak"
  | "lessons"
  | "daily"
  | "dailyDone"
  | "dailyClaimed"
  | "dailyProgress"
  | "claim"
  | "claimed"
  | "claimQuest"
  | "questRewarded"
  | "back"
  | "achievements"
  | "freeze"
  | "mastery"
  | "share"
  | "copied"
  | "weeklyStreak"
  | "weeklyBonus";

const STR: Record<Lang, Record<Key, string>> = {
  ru: {
    title: "Профиль",
    xp: "Опыт",
    streak: "Серия",
    lessons: "Уроки",
    daily: "Задание дня",
    dailyDone: "Цель достигнута! Забери награду.",
    dailyClaimed: "Награда получена. Возвращайся завтра!",
    dailyProgress: "Заработай 50 XP сегодня",
    claim: "Забрать +",
    claimed: "Получено",
    claimQuest: "+10 🪙",
    questRewarded: "✓",
    back: "Назад",
    achievements: "Достижения",
    freeze: "заморозки — спасают серию при пропуске дня",
    mastery: "уровней освоено (короны)",
    share: "🔗 Поделиться",
    copied: "Ссылка скопирована!",
    weeklyStreak: "Неделя:",
    weeklyBonus: "🎉 Бонус недели: +200 XP +100 🪙",
  },
  ro: {
    title: "Profil",
    xp: "XP",
    streak: "Serie",
    lessons: "Lecții",
    daily: "Provocarea zilei",
    dailyDone: "Obiectiv atins! Revendică recompensa.",
    dailyClaimed: "Recompensă primită. Revino mâine!",
    dailyProgress: "Câștigă 50 XP azi",
    claim: "Revendică +",
    claimed: "Primit",
    claimQuest: "+10 🪙",
    questRewarded: "✓",
    back: "Înapoi",
    achievements: "Realizări",
    freeze: "înghețări — salvează seria la o zi pierdută",
    mastery: "niveluri stăpânite (coroane)",
    share: "🔗 Distribuie",
    copied: "Link copiat!",
    weeklyStreak: "Săptămână:",
    weeklyBonus: "🎉 Bonus săptămânal: +200 XP +100 🪙",
  },
  en: {
    title: "Profile",
    xp: "XP",
    streak: "Streak",
    lessons: "Lessons",
    daily: "Daily Challenge",
    dailyDone: "Goal reached! Claim your reward.",
    dailyClaimed: "Reward claimed. Come back tomorrow!",
    dailyProgress: "Earn 50 XP today",
    claim: "Claim +",
    claimed: "Claimed",
    claimQuest: "+10 🪙",
    questRewarded: "✓",
    back: "Back",
    achievements: "Achievements",
    freeze: "freezes — save your streak on a missed day",
    mastery: "levels mastered (crowns)",
    share: "🔗 Share",
    copied: "Link copied!",
    weeklyStreak: "Week:",
    weeklyBonus: "🎉 Weekly bonus: +200 XP +100 🪙",
  },
};

// ── Achievements derived purely from the profile the client already has ──
const BADGES: { emoji: string; label: Record<Lang, string>; earned: (p: UserProfile) => boolean }[] = [
  { emoji: "🌱", label: { ru: "Первый урок", ro: "Prima lecție", en: "First lesson" }, earned: (p) => p.completedLessons.length >= 1 },
  { emoji: "📚", label: { ru: "10 уроков", ro: "10 lecții", en: "10 lessons" }, earned: (p) => p.completedLessons.length >= 10 },
  { emoji: "🎓", label: { ru: "50 уроков", ro: "50 lecții", en: "50 lessons" }, earned: (p) => p.completedLessons.length >= 50 },
  { emoji: "🔥", label: { ru: "Серия 3", ro: "Serie 3", en: "3-day streak" }, earned: (p) => p.streak >= 3 },
  { emoji: "🔥", label: { ru: "Серия 7", ro: "Serie 7", en: "7-day streak" }, earned: (p) => p.streak >= 7 },
  { emoji: "🏆", label: { ru: "Серия 30", ro: "Serie 30", en: "30-day streak" }, earned: (p) => p.streak >= 30 },
  { emoji: "⭐", label: { ru: "100 XP", ro: "100 XP", en: "100 XP" }, earned: (p) => p.xp >= 100 },
  { emoji: "💎", label: { ru: "1000 XP", ro: "1000 XP", en: "1000 XP" }, earned: (p) => p.xp >= 1000 },
  { emoji: "👑", label: { ru: "5000 XP", ro: "5000 XP", en: "5000 XP" }, earned: (p) => p.xp >= 5000 },
];

// ── Local fetch helper (mirrors api.ts: x-init-data + optional Bearer token) ──
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const initData = window.Telegram?.WebApp?.initData ?? "";
  headers["x-init-data"] = initData;
  const token = localStorage.getItem("session_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function fetchDaily(): Promise<DailyState> {
  const res = await fetch("/api/daily", { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET /api/daily -> ${res.status}`);
  return (await res.json()) as DailyState;
}

async function claimDaily(): Promise<DailyState> {
  const res = await fetch("/api/daily/claim", { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(`POST /api/daily/claim -> ${res.status}`);
  return (await res.json()) as DailyState;
}

async function claimQuestReward(questId: string): Promise<DailyState> {
  const res = await fetch("/api/daily/claim-quest", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ questId }),
  });
  if (!res.ok) throw new Error(`POST /api/daily/claim-quest -> ${res.status}`);
  return (await res.json()) as DailyState;
}

export function Profile({
  profile,
  lang,
  onBack,
}: {
  profile: UserProfile;
  lang: Lang;
  onBack: () => void;
}) {
  const s = STR[lang];
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [busy, setBusy] = useState(false);
  const [questBusy, setQuestBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const onShare = useCallback(async () => {
    const cardUrl = api.shareCardUrl("streak", profile.streak, lang);
    const absUrl = `${window.location.origin}${cardUrl}`;
    const shareText =
      lang === "ru" ? `Мой стрик в Learningo — ${profile.streak} дней!` :
      lang === "ro" ? `Seria mea Learningo — ${profile.streak} zile!` :
      `My Learningo streak — ${profile.streak} days!`;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Telegram Mini App: open the card image URL so the user can forward it
      if (tg.openLink) tg.openLink(absUrl);
      else window.open(absUrl, "_blank");
    } else if (navigator.share) {
      try { await navigator.share({ url: absUrl, text: shareText }); } catch { /* dismissed */ }
    } else {
      try {
        await navigator.clipboard.writeText(absUrl);
        showToast(s.copied);
      } catch { showToast(absUrl); }
    }
  }, [lang, profile.streak, s.copied]);

  useEffect(() => {
    let alive = true;
    fetchDaily()
      .then((d) => alive && setDaily(d))
      .catch(() => alive && setDaily(null));
    return () => {
      alive = false;
    };
  }, []);

  const onClaim = async () => {
    if (busy || !daily?.claimable) return;
    setBusy(true);
    try {
      setDaily(await claimDaily());
    } catch {
      // keep current state on failure
    } finally {
      setBusy(false);
    }
  };

  const onClaimQuest = async (questId: string) => {
    if (questBusy) return;
    setQuestBusy(questId);
    try {
      setDaily(await claimQuestReward(questId));
    } catch {
      // ignore (already claimed or network error)
    } finally {
      setQuestBusy(null);
    }
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar">🙂</div>
        <div className="profile-name">{profile.firstName}</div>
        {profile.username && <div className="profile-username">@{profile.username}</div>}
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-value xp">⭐ {profile.xp}</div>
          <div className="profile-stat-label">{s.xp}</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value streak">🔥 {profile.streak}</div>
          <div className="profile-stat-label">{s.streak}</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value lessons">📚 {profile.completedLessons.length}</div>
          <div className="profile-stat-label">{s.lessons}</div>
        </div>
      </div>

      <div className="profile-freeze">🧊 {profile.freezes ?? 0} · {s.freeze}</div>

      <div className="profile-section-title">{s.daily}</div>
      <div className="profile-daily">
        {daily === null ? (
          <div className="profile-loading">…</div>
        ) : (
          <>
            {(daily.quests ?? []).map((q) => {
              const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
              return (
                <div key={q.id} className="profile-quest">
                  <div className="profile-daily-head">
                    <div className="profile-daily-title">{QEMOJI[q.id] ?? "🎯"} {QLABEL[q.id]?.[lang] ?? q.id}</div>
                    <div className="profile-daily-count">
                      {q.done ? (
                        q.rewarded ? (
                          <span className="quest-rewarded">{s.questRewarded}</span>
                        ) : (
                          <button
                            className="profile-btn quest-claim"
                            disabled={questBusy === q.id}
                            onClick={() => onClaimQuest(q.id)}
                          >
                            {s.claimQuest}
                          </button>
                        )
                      ) : (
                        `${q.progress} / ${q.goal}`
                      )}
                    </div>
                  </div>
                  <div className="profile-bar">
                    <span style={{ width: `${pct}%`, background: q.done ? "var(--green)" : undefined }} />
                  </div>
                </div>
              );
            })}

            {/* Weekly streak progress */}
            {(() => {
              const ws = daily.weeklyQuestStreak ?? 0;
              const wPct = Math.min(100, Math.round((ws / 5) * 100));
              return (
                <div className="profile-weekly-streak">
                  <div className="profile-daily-head">
                    <div className="profile-daily-title">🗓 {s.weeklyStreak} {ws}/5</div>
                  </div>
                  <div className="profile-bar">
                    <span style={{ width: `${wPct}%`, background: "var(--accent, #8b5cf6)" }} />
                  </div>
                  {daily.weeklyStreakReady && (
                    <button
                      className="profile-btn claim weekly-bonus"
                      disabled={busy}
                      onClick={onClaim}
                    >
                      {s.weeklyBonus}
                    </button>
                  )}
                </div>
              );
            })()}

            {daily.claimed ? (
              <div className="profile-daily-status claimed">{s.dailyClaimed}</div>
            ) : daily.done ? (
              <>
                <div className="profile-daily-status done">{s.dailyDone}</div>
                <button
                  className="profile-btn claim"
                  disabled={busy || !daily.claimable}
                  onClick={onClaim}
                >
                  {s.claim}
                  {daily.reward} ⭐
                </button>
              </>
            ) : null}
          </>
        )}
      </div>

      <div className="profile-freeze">👑 {Object.keys(profile.attempts ?? {}).length} · {s.mastery}</div>

      <div className="profile-section-title">
        {s.achievements}{" "}
        <span className="profile-badge-count">
          {BADGES.filter((b) => b.earned(profile)).length}/{BADGES.length}
        </span>
      </div>
      <div className="profile-badges">
        {BADGES.map((b, i) => {
          const got = b.earned(profile);
          return (
            <div key={i} className={"profile-badge" + (got ? " got" : " locked")}>
              <span className="pb-emoji">{got ? b.emoji : "🔒"}</span>
              <span className="pb-label">{b.label[lang]}</span>
            </div>
          );
        })}
      </div>

      <div className="profile-share-row">
        <button className="profile-btn share" onClick={onShare}>
          {s.share}
        </button>
      </div>

      {toast && <div className="profile-toast">{toast}</div>}

      <button className="profile-back" onClick={onBack}>
        {s.back}
      </button>
    </div>
  );
}
