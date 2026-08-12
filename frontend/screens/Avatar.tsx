// Avatar editor: pick a DiceBear style, shuffle the seed, pick a background, save.
import { useEffect, useState } from "react";
import type { Avatar, Lang } from "@app/shared";
import { AvatarView, STYLE_IDS, BG_IDS, DEFAULT_AVATAR } from "./AvatarView";
import "./avatar.css";

const S: Record<string, Record<Lang, string>> = {
  title: { ru: "Аватар", ro: "Avatar", en: "Avatar" },
  style: { ru: "Стиль", ro: "Stil", en: "Style" },
  variants: { ru: "Варианты", ro: "Variante", en: "Variants" },
  bg: { ru: "Фон", ro: "Fundal", en: "Background" },
  random: { ru: "🎲 Случайный", ro: "🎲 Aleatoriu", en: "🎲 Random" },
  save: { ru: "Сохранить", ro: "Salvează", en: "Save" },
  back: { ru: "← Назад", ro: "← Înapoi", en: "← Back" },
  saved: { ru: "Сохранено ✓", ro: "Salvat ✓", en: "Saved ✓" },
};

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const initData = window.Telegram?.WebApp?.initData ?? "";
  if (initData) h["x-init-data"] = initData;
  const token = localStorage.getItem("session_token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

const randomSeed = () => Math.random().toString(36).slice(2, 9);

export function AvatarEditor({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
  const [variants] = useState<string[]>(() => Array.from({ length: 8 }, () => randomSeed()));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/avatar", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : DEFAULT_AVATAR))
      .then((a: Avatar) => setAvatar({ ...DEFAULT_AVATAR, ...a }))
      .catch(() => {});
  }, []);

  const patch = (p: Partial<Avatar>) => { setAvatar((a) => ({ ...a, ...p })); setSaved(false); };

  const save = async () => {
    await fetch("/api/avatar", { method: "POST", headers: authHeaders(), body: JSON.stringify(avatar) });
    setSaved(true);
  };

  return (
    <div className="app avatar-editor">
      <div className="prompt">{S.title[lang]}</div>

      <div className="avatar-hero">
        <AvatarView avatar={avatar} size={160} />
      </div>
      <button className="btn ghost" onClick={() => patch({ seed: randomSeed() })}>{S.random[lang]}</button>

      <div className="unit-title">{S.style[lang]}</div>
      <div className="opt-row">
        {STYLE_IDS.map((st) => (
          <button
            key={st}
            className={`opt ${avatar.style === st ? "sel" : ""}`}
            onClick={() => patch({ style: st })}
            aria-label={st}
          >
            <AvatarView avatar={{ style: st, seed: avatar.seed, bg: avatar.bg }} size={52} />
          </button>
        ))}
      </div>

      <div className="unit-title">{S.variants[lang]}</div>
      <div className="opt-row">
        {variants.map((sd) => (
          <button
            key={sd}
            className={`opt ${avatar.seed === sd ? "sel" : ""}`}
            onClick={() => patch({ seed: sd })}
            aria-label="variant"
          >
            <AvatarView avatar={{ style: avatar.style, seed: sd, bg: avatar.bg }} size={52} />
          </button>
        ))}
      </div>

      <div className="unit-title">{S.bg[lang]}</div>
      <div className="opt-row">
        {BG_IDS.map((b) => (
          <button
            key={b}
            className={`opt swatch ${avatar.bg === b ? "sel" : ""}`}
            onClick={() => patch({ bg: b })}
            style={{ background: b === "transparent" ? "var(--card2)" : `#${b}` }}
            aria-label={b}
          >
            {b === "transparent" ? "∅" : ""}
          </button>
        ))}
      </div>

      <button className="btn" onClick={save}>{saved ? S.saved[lang] : S.save[lang]}</button>
      <button className="btn ghost" onClick={onBack}>{S.back[lang]}</button>
    </div>
  );
}
