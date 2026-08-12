import { useEffect, useRef, useState } from "react";
import type { Lang, ShopState, Avatar } from "@app/shared";
import { api } from "../api";

const L = (lang: Lang, ru: string, ro: string, en: string) => (lang === "ru" ? ru : lang === "ro" ? ro : en);

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

/** Soft-currency shop: streak freezes + XP booster + premium avatar backgrounds. */
export function Shop({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [s, setS] = useState<ShopState | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.shop().then(setS).catch(() => setS(null));
    api.getAvatar().then(setAvatar).catch(() => {});
  }, []);

  // Countdown timer for the active boost
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!s?.boostExpiresAt) { setCountdown(null); return; }
    const tick = () => {
      const remaining = (s.boostExpiresAt ?? 0) - Date.now();
      if (remaining <= 0) { setCountdown(null); if (timerRef.current) clearInterval(timerRef.current); }
      else setCountdown(fmtCountdown(remaining));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [s?.boostExpiresAt]);

  if (!s) return <div className="app center muted">…</div>;

  const owned = (id: string) => s.ownedBgs.includes(id);
  const active = (id: string) => avatar?.bg === id;

  const buyBg = async (id: string) => {
    setBusy(id);
    try { const r = await api.shopBuy("bg", id); if (r.ok) setS({ ...s, coins: r.coins, ownedBgs: r.bgs }); } catch {}
    setBusy(null);
  };
  const applyBg = async (id: string) => {
    if (!avatar) return;
    setBusy(id);
    try { const a = { ...avatar, bg: id }; await api.saveAvatar(a); setAvatar(a); } catch {}
    setBusy(null);
  };
  const buyFreeze = async () => {
    setBusy("freeze");
    try { const r = await api.shopBuy("freeze", "freeze"); if (r.ok) setS({ ...s, coins: r.coins, freezes: r.freezes }); } catch {}
    setBusy(null);
  };
  const buyFreeze3 = async () => {
    setBusy("freeze3");
    try { const r = await api.shopBuy("freeze3", "freeze3"); if (r.ok) setS({ ...s, coins: r.coins, freezes: r.freezes }); } catch {}
    setBusy(null);
  };
  const buyBoost = async () => {
    setBusy("boost-buy");
    try { const r = await api.shopBuy("boost", "boost"); if (r.ok) setS({ ...s, coins: r.coins, boosts: r.boosts }); } catch {}
    setBusy(null);
  };
  const activateBoost = async () => {
    setBusy("boost-activate");
    try {
      const r = await api.activateBoost();
      if (r.ok) {
        const expiresAt = Date.now() + 3_600_000;
        setS({ ...s, boosts: s.boosts - 1, boostActive: true, boostExpiresAt: expiresAt });
      }
    } catch {}
    setBusy(null);
  };

  // Group backgrounds by tier
  const standardBgs = s.bgs.filter((b) => b.cost <= 120);
  const premiumBgs = s.bgs.filter((b) => b.cost >= 150 && b.cost <= 250);
  const legendaryBgs = s.bgs.filter((b) => b.cost >= 400);

  const BgGrid = ({ items }: { items: { id: string; cost: number }[] }) => (
    <div className="shop-grid">
      {items.map((b) => (
        <div key={b.id} className={`shop-bg ${active(b.id) ? "active" : ""}`}>
          <div className="shop-swatch" style={{ background: `#${b.id}` }} />
          {owned(b.id) ? (
            active(b.id) ? (
              <div className="shop-tag on">{L(lang, "Активен", "Activ", "Active")}</div>
            ) : (
              <button className="btn tiny" disabled={busy === b.id} onClick={() => applyBg(b.id)}>{L(lang, "Надеть", "Aplică", "Apply")}</button>
            )
          ) : (
            <button className="btn tiny buy" disabled={busy === b.id || s.coins < b.cost} onClick={() => buyBg(b.id)}>🪙 {b.cost}</button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      <div className="prompt">{L(lang, "🛒 Магазин", "🛒 Magazin", "🛒 Shop")}</div>
      <div className="shop-bal">🪙 <b>{s.coins}</b> {L(lang, "монет", "monede", "coins")}</div>
      <div className="shop-hint muted">{L(lang, "Зарабатывай монеты за уроки, дуэли и ежедневные задания.", "Câștigi monede din lecții, dueluri și sarcini zilnice.", "Earn coins from lessons, duels and daily challenges.")}</div>

      {/* XP Booster section */}
      <div className="unit-title">{L(lang, "⚡ XP Бустер", "⚡ Multiplicator XP", "⚡ XP Booster")}</div>
      {s.boostActive && countdown ? (
        <div className="card shop-row">
          <div className="shop-icon">⚡</div>
          <div className="meta">
            <div className="name">{L(lang, "XP Бустер ×2 активен", "Multiplicator XP ×2 activ", "XP Booster ×2 active")}</div>
            <div className="sub">{L(lang, "Активен", "Activ", "Active")} ({countdown})</div>
          </div>
        </div>
      ) : null}
      <div className="card shop-row">
        <div className="shop-icon">⚡</div>
        <div className="meta">
          <div className="name">{L(lang, "XP Бустер ×2", "Multiplicator XP ×2", "XP Booster ×2")}</div>
          <div className="sub">{L(lang, "Удваивает XP на 1 час · у тебя", "Dublează XP timp de 1 oră · ai", "Doubles XP for 1 hour · you have")}: {s.boosts}</div>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button className="btn tiny buy" disabled={busy === "boost-buy" || s.coins < s.boostCost} onClick={buyBoost}>🪙 {s.boostCost}</button>
          {s.boosts > 0 && !s.boostActive ? (
            <button className="btn tiny" disabled={busy === "boost-activate"} onClick={activateBoost}>{L(lang, "Активировать", "Activează", "Activate")}</button>
          ) : null}
        </div>
      </div>

      {/* Streak freeze section */}
      <div className="unit-title">{L(lang, "🛡️ Заморозка серии", "🛡️ Înghețare serie", "🛡️ Streak freeze")}</div>
      <div className="card shop-row">
        <div className="shop-icon">🛡️</div>
        <div className="meta">
          <div className="name">{L(lang, "Заморозка", "Înghețare", "Freeze")} ×1</div>
          <div className="sub">{L(lang, "Защитит серию в пропущенный день", "Îți protejează seria într-o zi ratată", "Protects your streak on a missed day")} · {L(lang, "у тебя", "ai", "you have")}: {s.freezes}</div>
        </div>
        <button className="btn tiny buy" disabled={busy === "freeze" || s.coins < s.freezeCost} onClick={buyFreeze}>🪙 {s.freezeCost}</button>
      </div>
      <div className="card shop-row">
        <div className="shop-icon">🛡️</div>
        <div className="meta">
          <div className="name">{L(lang, "×3 Пакет заморозок", "×3 Pachet înghețări", "×3 Freeze bundle")}</div>
          <div className="sub">{L(lang, "Скидка: 3 заморозки за 120", "Reducere: 3 înghețări pentru 120", "Deal: 3 freezes for 120")} {L(lang, "вместо", "în loc de", "instead of")} 150</div>
        </div>
        <button className="btn tiny buy" disabled={busy === "freeze3" || s.coins < s.freeze3Cost} onClick={buyFreeze3}>🪙 {s.freeze3Cost}</button>
      </div>

      {/* Background section — tiered */}
      <div className="unit-title">{L(lang, "🎨 Фон аватара", "🎨 Fundal avatar", "🎨 Avatar background")}</div>
      {standardBgs.length > 0 && (
        <>
          <div className="shop-tier-label muted">{L(lang, "Стандарт", "Standard", "Standard")}</div>
          <BgGrid items={standardBgs} />
        </>
      )}
      {premiumBgs.length > 0 && (
        <>
          <div className="shop-tier-label muted">{L(lang, "Премиум", "Premium", "Premium")}</div>
          <BgGrid items={premiumBgs} />
        </>
      )}
      {legendaryBgs.length > 0 && (
        <>
          <div className="shop-tier-label muted">{L(lang, "Легендарный", "Legendar", "Legendary")}</div>
          <BgGrid items={legendaryBgs} />
        </>
      )}

      <div className="actions"><button className="btn ghost" onClick={onExit}>{L(lang, "Назад", "Înapoi", "Back")}</button></div>
    </div>
  );
}
