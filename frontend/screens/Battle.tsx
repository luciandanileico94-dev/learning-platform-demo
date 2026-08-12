import { useEffect, useRef, useState } from "react";
import type { Lang, BattleStart, BattleRoundResult, BattleFinal, Localized } from "@app/shared";
import { api } from "../api";
import { sfx, primeAudio, isMuted, toggleMuted } from "../sound";
import { haptics } from "../haptics";
import "./battle.css";

const ROUND_MS = 30000;
type Phase = "category" | "searching" | "vs" | "duel" | "reveal" | "result" | "error";
type L = Record<Lang, string>;

const S: Record<string, L> = {
  searching: { ru: "Ищем соперника…", ro: "Căutăm un adversar…", en: "Finding an opponent…" },
  battling: { ru: "сейчас в бою", ro: "în luptă acum", en: "battling now" },
  vs: { ru: "СОПЕРНИК НАЙДЕН", ro: "ADVERSAR GĂSIT", en: "OPPONENT FOUND" },
  you: { ru: "Ты", ro: "Tu", en: "You" },
  win: { ru: "ПОБЕДА!", ro: "VICTORIE!", en: "VICTORY!" },
  lose: { ru: "Поражение", ro: "Înfrângere", en: "Defeat" },
  draw: { ru: "Ничья", ro: "Egalitate", en: "Draw" },
  closeGame: { ru: "Близкий бой — почти!", ro: "Meci strâns — aproape!", en: "Close game — so close!" },
  niceWin: { ru: "Отличная игра!", ro: "Joc grozav!", en: "Great game!" },
  correctOf: { ru: "правильных", ro: "corecte", en: "correct" },
  rematch: { ru: "🔁 Реванш", ro: "🔁 Revanșă", en: "🔁 Rematch" },
  home: { ru: "На главную", ro: "Acasă", en: "Home" },
  reward: { ru: "Награда", ro: "Recompensă", en: "Reward" },
  recap: { ru: "Разбор", ro: "Recapitulare", en: "Recap" },
  loadErr: { ru: "Не удалось начать дуэль", ro: "Nu s-a putut începe duelul", en: "Couldn't start the duel" },
  retry: { ru: "Ещё раз", ro: "Din nou", en: "Try again" },
  chooseCat: { ru: "Выбери категорию", ro: "Alege categoria", en: "Choose a category" },
  catHint: { ru: "На какие темы сразимся?", ro: "Pe ce teme ne batem?", en: "What shall we battle on?" },
  flawless: { ru: "🔥 БЕЗ ОШИБОК 7/7!", ro: "🔥 FĂRĂ GREȘELI 7/7!", en: "🔥 FLAWLESS 7/7!" },
  bestStreak: { ru: "Лучшая серия", ro: "Cea mai bună serie", en: "Best streak" },
  audience: { ru: "Спросить AI", ro: "Întreabă AI", en: "Ask AI" },
  question: { ru: "Вопрос", ro: "Întrebare", en: "Question" },
  tfHint: { ru: "Это верный ответ?", ro: "Acesta e răspunsul corect?", en: "Is this the correct answer?" },
  share: { ru: "📤 Поделиться", ro: "📤 Distribuie", en: "📤 Share" },
  readPause: { ru: "⏸ Прочитать ответ", ro: "⏸ Citește răspunsul", en: "⏸ Read the answer" },
  next: { ru: "Дальше →", ro: "Mai departe →", en: "Next →" },
  freeze: { ru: "+10 сек", ro: "+10 sec", en: "+10 sec" },
  quit: { ru: "Сдаться · −15 XP", ro: "Renunță · −15 XP", en: "Forfeit · −15 XP" },
  quitConfirm: { ru: "Выйти из дуэли? Спишется 15 XP.", ro: "Ieși din duel? Se scad 15 XP.", en: "Leave the duel? You lose 15 XP." },
  oppLvl: { ru: "Ур.", ro: "Niv.", en: "Lvl" },
  vibeStrong: { ru: "⚠️ Сильный соперник", ro: "⚠️ Adversar puternic", en: "⚠️ Strong opponent" },
  vibeWeak: { ru: "🟢 Слабее тебя", ro: "🟢 Mai slab decât tine", en: "🟢 Weaker than you" },
  vibeEven: { ru: "⚔️ Равный бой", ro: "⚔️ Luptă egală", en: "⚔️ Even match" },
  shareHint: { ru: "Поделись результатом → +10 XP (раз в день)", ro: "Distribuie rezultatul → +10 XP (o dată pe zi)", en: "Share your result → +10 XP (once a day)" },
  shareGot: { ru: "🎁 +{n} XP за репост!", ro: "🎁 +{n} XP pentru distribuire!", en: "🎁 +{n} XP for sharing!" },
};

const CATS: { id: string; icon: string; label: L }[] = [
  { id: "mixed", icon: "🎲", label: { ru: "Микс — все темы", ro: "Mix — toate temele", en: "Mix — all topics" } },
  { id: "science", icon: "🔬", label: { ru: "Наука", ro: "Știință", en: "Science" } },
  { id: "history", icon: "🏛️", label: { ru: "История", ro: "Istorie", en: "History" } },
  { id: "society", icon: "🌍", label: { ru: "Общество", ro: "Societate", en: "Society" } },
  { id: "professions", icon: "💼", label: { ru: "Профессии", ro: "Profesii", en: "Professions" } },
  { id: "culture", icon: "🎭", label: { ru: "Культура и искусство", ro: "Cultură și artă", en: "Culture & arts" } },
  { id: "countries", icon: "🌎", label: { ru: "Страны мира", ro: "Țările lumii", en: "Countries" } },
];

function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function initial(name: string) { return (name.trim()[0] ?? "?").toUpperCase(); }

export function Battle({ lang, onExit }: { lang: Lang; onExit: () => void }) {
  const [bs, setBs] = useState<BattleStart | null>(null);
  const [phase, setPhase] = useState<Phase>("category");
  const [category, setCategory] = useState("mixed");
  const [round, setRound] = useState(0);
  const [youScore, setYouScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [youDots, setYouDots] = useState<(boolean | null)[]>([]);
  const [oppDots, setOppDots] = useState<(boolean | null)[]>([]);
  const [reveal, setReveal] = useState<BattleRoundResult | null>(null);
  const [final, setFinal] = useState<BattleFinal | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [oppLocked, setOppLocked] = useState(false);
  const [searchCount] = useState(() => Math.floor(rnd(40, 380)));
  const [muted, setMuted] = useState(isMuted());
  const [combo, setCombo] = useState(0);
  // Lifelines (Millionaire-style): one 50/50 and one "ask the audience" per duel.
  const [usedFifty, setUsedFifty] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [hiddenOpts, setHiddenOpts] = useState<number[]>([]);
  const [showAudience, setShowAudience] = useState(false);
  const [revealPaused, setRevealPaused] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(0); // +10s lifeline, max 2 per battle

  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const advanceFn = useRef<(() => void) | undefined>(undefined);
  const frozenMs = useRef(0); // extra time granted on the current question by freeze lifelines
  const locked = useRef(false);
  const alive = useRef(true);
  const lastTickSec = useRef(99);
  const oppPlayed = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearInterval(timer.current); clearTimeout(revealTimer.current); };
  }, []);

  async function load(cat: string = category) {
    setCategory(cat);
    primeAudio();
    clearInterval(timer.current);
    setPhase("searching"); setReveal(null); setFinal(null); setRound(0);
    setYouScore(0); setOppScore(0); setYouDots([]); setOppDots([]); setChosen(null); setCombo(0);
    setUsedFifty(false); setUsedAudience(false); setHiddenOpts([]); setShowAudience(false); setFreezeUsed(0);
    let s: BattleStart;
    try {
      s = await api.battleStart(cat);
    } catch {
      if (alive.current) setPhase("error");
      return;
    }
    if (!alive.current) return;
    setBs(s);
    const searchMs = rnd(1500, 5000);
    window.setTimeout(() => {
      if (!alive.current) return;
      setPhase("vs");
      sfx.vs(); haptics.impact("heavy");
      window.setTimeout(() => { if (alive.current) beginRound(0, s); }, 2000);
    }, searchMs);
  }

  function beginRound(i: number, s: BattleStart) {
    if (!alive.current) return;
    locked.current = false;
    lastTickSec.current = 99;
    oppPlayed.current = false;
    setRound(i); setChosen(null); setReveal(null); setOppLocked(false);
    setHiddenOpts([]); setShowAudience(false); setRevealPaused(false); frozenMs.current = 0;
    setPhase("duel"); setTimeLeft(ROUND_MS);
    startedAt.current = Date.now();
    const botMs = s.questions[i].botAnswerMs;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const el = Date.now() - startedAt.current;
      const left = Math.max(0, ROUND_MS + frozenMs.current - el);
      setTimeLeft(left);
      // Ticking with rising tension in the last 5 seconds.
      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 5 && secLeft >= 1 && secLeft !== lastTickSec.current) {
        lastTickSec.current = secLeft;
        sfx.tick((6 - secLeft) / 5);
        if (secLeft <= 3) haptics.impact("rigid");
      }
      if (el >= botMs && !oppPlayed.current) { oppPlayed.current = true; setOppLocked(true); sfx.oppLock(); }
      if (el >= ROUND_MS + frozenMs.current) void submit(null, i, s);
    }, 100);
  }

  async function submit(optionId: number | null, i: number, s: BattleStart) {
    if (locked.current) return;
    locked.current = true;
    clearInterval(timer.current);
    const el = Math.min(ROUND_MS, Date.now() - startedAt.current);
    setChosen(optionId);
    let r: BattleRoundResult;
    try {
      r = await api.battleAnswer(s.matchId, i, optionId, el);
    } catch {
      if (alive.current) setPhase("error");
      return;
    }
    if (!alive.current) return;
    setReveal(r); setPhase("reveal");
    setCombo(r.streak);
    if (r.you.correct) {
      sfx.correct(); haptics.success();
      if (r.streak >= 3) { sfx.combo(r.streak); haptics.impact("heavy"); }
    } else {
      sfx.wrong(); haptics.error();
    }
    setYouScore(r.score.you); setOppScore(r.score.opp);
    setYouDots((d) => { const n = d.slice(); n[i] = r.you.correct; return n; });
    setOppDots((d) => { const n = d.slice(); n[i] = r.opp.correct; return n; });
    // Linger on the reveal so the player can read the correct answer (longer after a
    // wrong answer). +3s baseline (D3); the player can also pause to read (D2, reveal UI).
    const revealMs = (r.you.correct ? 2200 : 7200) + 3000;
    const goNext = () => {
      if (!alive.current) return;
      if (r.final) {
        if (r.final.result === "win") { sfx.win(); haptics.success(); }
        else if (r.final.result === "lose") { sfx.lose(); haptics.warning(); }
        setFinal(r.final); setPhase("result");
      } else beginRound(i + 1, s);
    };
    advanceFn.current = goNext;
    revealTimer.current = setTimeout(goNext, revealMs);
  }

  function tap(optionId: number) {
    if (phase !== "duel" || locked.current || !bs) return;
    haptics.select();
    void submit(optionId, round, bs);
  }

  // Reveal pause: tap to freeze auto-advance and read the correct answer, tap again to continue.
  function pauseReveal() {
    if (phase !== "reveal" || revealPaused) return;
    clearTimeout(revealTimer.current);
    setRevealPaused(true);
    haptics.select();
  }
  function continueReveal() {
    setRevealPaused(false);
    advanceFn.current?.();
  }

  function useFifty() {
    if (usedFifty || phase !== "duel" || !bs) return;
    setHiddenOpts(bs.questions[round].fiftyFifty ?? []);
    setUsedFifty(true); haptics.select(); sfx.tick(0.5);
  }
  function useAudience() {
    if (usedAudience || phase !== "duel" || !bs) return;
    setShowAudience(true); setUsedAudience(true); haptics.select(); sfx.tick(0.5);
  }
  // +10s lifeline (max 2/battle): extend the current question's timer.
  function useFreeze() {
    if (freezeUsed >= 2 || phase !== "duel" || locked.current) return;
    frozenMs.current += 10000;
    setFreezeUsed((n) => n + 1);
    setTimeLeft((t) => t + 10000);
    haptics.success(); sfx.combo(3);
  }
  // Forfeit the duel anytime for an XP penalty (server deducts).
  async function quitBattle() {
    if (!bs || locked.current) return;
    if (typeof window !== "undefined" && !window.confirm(S.quitConfirm[lang])) return;
    locked.current = true;
    clearInterval(timer.current); clearTimeout(revealTimer.current);
    try { await api.battleAbandon(bs.matchId); } catch { /* ignore */ }
    onExit();
  }

  const muteBtn = (
    <button className="bt-mute" aria-label="sound" onClick={() => setMuted(toggleMuted())}>
      {muted ? "🔇" : "🔊"}
    </button>
  );

  // ---- Render ----
  if (phase === "category") {
    return (
      <div className="app battle bt">
        {muteBtn}
        <div className="bt-cat">
          <div className="bt-cat-emoji">⚔️</div>
          <h2 className="bt-cat-title">{S.chooseCat[lang]}</h2>
          <p className="bt-sub">{S.catHint[lang]}</p>
          <div className="bt-cat-list">
            {CATS.map((c) => (
              <button key={c.id} className="bt-cat-btn" onClick={() => { primeAudio(); void load(c.id); }}>
                <span className="bt-cat-ic">{c.icon}</span>
                <span>{c.label[lang]}</span>
              </button>
            ))}
          </div>
          <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="app battle bt">
        <div className="bt-center">
          <div className="bt-big-emoji">😕</div>
          <p className="bt-msg">{S.loadErr[lang]}</p>
          <button className="bt-btn primary" onClick={() => void load()}>{S.retry[lang]}</button>
          <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
        </div>
      </div>
    );
  }

  if (phase === "searching" || !bs) {
    return (
      <div className="app battle bt">
        {muteBtn}
        <div className="bt-center">
          <div className="bt-radar"><span /><span /><span /><div className="bt-radar-core">⚔️</div></div>
          <p className="bt-msg">{S.searching[lang]}</p>
          <p className="bt-sub">{searchCount} {S.battling[lang]}</p>
          <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
        </div>
      </div>
    );
  }

  if (phase === "vs") {
    return (
      <div className="app battle bt">
        <div className="bt-center">
          <div className="bt-vs">
            <div className="bt-fighter me"><div className="bt-ava me">{S.you[lang][0]}</div><span>{S.you[lang]}</span></div>
            <div className="bt-vs-mark">VS</div>
            <div className="bt-fighter opp">
              <div className="bt-ava opp">{initial(bs.opponent.name)}</div>
              <span>{bs.opponent.name}</span>
              <span className="bt-opp-meta">{S.oppLvl[lang]} {bs.opponent.level}{bs.opponent.streak ? ` · 🔥 ${bs.opponent.streak}` : ""}</span>
            </div>
          </div>
          {bs.opponent.vibe && (
            <div className={"bt-vibe " + bs.opponent.vibe}>
              {bs.opponent.vibe === "strong" ? S.vibeStrong[lang] : bs.opponent.vibe === "weak" ? S.vibeWeak[lang] : S.vibeEven[lang]}
            </div>
          )}
          <p className="bt-msg">{S.vs[lang]}</p>
        </div>
      </div>
    );
  }

  if (phase === "result" && final) {
    return (
      <div className="app battle bt">
        <Result final={final} lang={lang} opp={bs.opponent.name} onRematch={() => void load()} onExit={onExit} />
      </div>
    );
  }

  // duel / reveal
  const q = bs.questions[round];
  const ringPct = Math.min(100, Math.round((timeLeft / ROUND_MS) * 100));
  const ringColor = timeLeft > 5000 ? "#22c55e" : timeLeft > 2500 ? "#ffcc33" : "#ff5b5b";
  const total = bs.total;

  const Dots = ({ dots, active }: { dots: (boolean | null)[]; active: boolean }) => (
    <span className="bt-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={"bt-dot" + (dots[i] == null ? "" : dots[i] ? " hit" : " miss") + (active && i === round ? " cur" : "")} />
      ))}
    </span>
  );

  return (
    <div className="app battle bt">
      {muteBtn}
      <div className="bt-bars">
        <div className="bt-bar me">
          <div className="bt-ava sm me">{S.you[lang][0]}</div>
          <Dots dots={youDots} active />
          <span className="bt-score">{youScore}</span>
        </div>
        <div className="bt-bar opp">
          <div className="bt-ava sm opp">{initial(bs.opponent.name)}</div>
          <Dots dots={oppDots} active={false} />
          <span className="bt-score">{oppScore}{phase === "duel" && oppLocked && <i className="bt-locked">🔒</i>}</span>
        </div>
      </div>

      <div className="bt-qhead">
        <span className="bt-track">{q.icon} {q.track[lang]}</span>
        {combo >= 2 && <span className={"bt-combo" + (combo >= 5 ? " hot" : "")} key={combo}>🔥 {combo}</span>}
        <div className="bt-ring" style={{ background: `conic-gradient(${ringColor} ${ringPct}%, rgba(255,255,255,.08) ${ringPct}%)` }}>
          <span>{Math.ceil(timeLeft / 1000)}</span>
        </div>
      </div>

      <div className="bt-question">
        <span className="bt-qlabel">{q.type === "image" ? "📷" : q.type === "odd" ? "🧩" : q.type === "order" ? "🔢" : S.question[lang]}</span>
        {q.prompt[lang]}
      </div>

      {q.img && (
        <img
          className="bt-qimg"
          src={lang === "en" ? `/media/${q.img}.png` : `/media/${q.img}-${lang}.png`}
          alt=""
          onError={(e) => {
            const el = e.currentTarget;
            const base = `/media/${q.img}.png`;
            if (!el.src.endsWith(base)) el.src = base; else el.style.display = "none";
          }}
        />
      )}

      {q.type === "truefalse" && q.claim && (
        <div className="bt-claim">
          <span className="bt-claim-hint">{S.tfHint[lang]}</span>
          <b>{q.claim[lang]}</b>
        </div>
      )}

      {phase === "duel" && (
        <div className="bt-lifelines">
          {q.fiftyFifty && <button className="bt-life" disabled={usedFifty} onClick={useFifty}>🎯 50 / 50</button>}
          {q.audience && <button className="bt-life" disabled={usedAudience} onClick={useAudience}>🤖 {S.audience[lang]}</button>}
          <button className="bt-life" disabled={freezeUsed >= 2} onClick={useFreeze}>❄️ {S.freeze[lang]}{freezeUsed > 0 ? ` (${2 - freezeUsed})` : ""}</button>
        </div>
      )}

      <div className="bt-options answers">
        {q.options.map((o: Localized, i) => {
          if (hiddenOpts.includes(i)) return <div key={i} className="bt-opt gone" aria-hidden="true" />;
          let cls = "bt-opt";
          if (phase === "reveal" && reveal) {
            if (i === reveal.correctIndex) cls += " correct";
            else if (i === chosen) cls += " wrong";
            else cls += " dim";
          } else if (chosen === i) cls += " picked";
          return (
            <button key={i} className={cls} disabled={phase === "reveal"} onClick={() => tap(i)}>
              <span className="bt-opt-txt">{o[lang]}</span>
              {showAudience && q.audience && <span className="bt-aud">{q.audience[i]}%</span>}
            </button>
          );
        })}
      </div>

      {phase === "reveal" && reveal && (
        <>
          <div className={"bt-feedback " + (reveal.you.correct ? "ok" : "no")}>
            <b>{reveal.you.correct ? `+${reveal.you.points}` : "✗"}</b>
            {reveal.bonus2x && <span className="bt-x2">🔥 ×2</span>}
            <span>{reveal.explanation[lang]}</span>
          </div>
          <button className={"bt-readbtn" + (revealPaused ? " go" : "")} onClick={revealPaused ? continueReveal : pauseReveal}>
            {revealPaused ? S.next[lang] : S.readPause[lang]}
          </button>
        </>
      )}

      {phase === "duel" && (
        <button className="bt-quit" onClick={quitBattle}>{S.quit[lang]}</button>
      )}
    </div>
  );
}

function shareTo(platform: "tg" | "fb" | "ig", final: BattleFinal, opp: string, lang: Lang) {
  const icon = final.result === "win" ? "🏆" : final.result === "draw" ? "🤝" : "💪";
  const head = final.result === "win" ? S.win[lang] : final.result === "draw" ? S.draw[lang] : S.lose[lang];
  const txt = `${icon} Learningo — ${head} ${final.youScore}:${final.oppScore} (${final.youCorrect}/${final.recap.length}) vs ${opp}`;
  const url = "https://t.me/SmartyNerdBot";
  const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void; openLink?: (u: string) => void } } }).Telegram?.WebApp;
  const openExt = (u: string) => { if (tg?.openLink) tg.openLink(u); else window.open(u, "_blank"); };
  try {
    if (platform === "tg") {
      const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`;
      if (tg?.openTelegramLink) tg.openTelegramLink(share); else openExt(share);
    } else if (platform === "fb") {
      openExt(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(txt)}`);
    } else {
      // Instagram has no web share-intent for text → copy it and open IG to paste into a story/post.
      try { void navigator.clipboard?.writeText(`${txt} ${url}`); } catch { /* ignore */ }
      openExt("https://www.instagram.com/");
    }
  } catch { /* ignore */ }
}

function Result({ final, lang, opp, onRematch, onExit }: { final: BattleFinal; lang: Lang; opp: string; onRematch: () => void; onExit: () => void }) {
  const title = final.result === "win" ? S.win[lang] : final.result === "draw" ? S.draw[lang] : S.lose[lang];
  const sub = final.result === "win" ? S.niceWin[lang] : final.result === "lose" ? S.closeGame[lang] : S.draw[lang];
  const [shareXp, setShareXp] = useState(0);
  const doShare = async (platform: "tg" | "fb" | "ig") => {
    shareTo(platform, final, opp, lang);
    try { const r = await api.shareClaim(); if (r.xp > 0) setShareXp(r.xp); } catch { /* ignore */ }
  };
  return (
    <div className={"bt-result " + final.result}>
      {final.result === "win" && <div className="bt-confetti" aria-hidden="true">🎉</div>}
      {final.result === "lose" && <div className="bt-confetti lose" aria-hidden="true">💪</div>}
      {final.result === "draw" && <div className="bt-confetti" aria-hidden="true">🤝</div>}
      <h2 className="bt-result-title">{title}</h2>
      <p className="bt-result-sub">{sub} — {final.youCorrect}/{final.recap.length} {S.correctOf[lang]}</p>
      <div className="bt-result-score">
        <span className="me">{final.youScore}</span>
        <span className="dash">:</span>
        <span className="opp">{final.oppScore}</span>
      </div>
      <div className="bt-recap">
        {final.recap.map((r) => (
          <span key={r.idx} className="bt-recap-col">
            <span className={"bt-dot lg " + (r.you ? "hit" : "miss")} />
            <span className={"bt-dot lg " + (r.opp ? "hit" : "miss")} />
          </span>
        ))}
      </div>
      {final.flawless ? (
        <div className="bt-flawless">{S.flawless[lang]}</div>
      ) : final.maxStreak >= 3 ? (
        <div className="bt-beststreak">🔥 {S.bestStreak[lang]}: {final.maxStreak}</div>
      ) : null}
      <div className="bt-reward">{S.reward[lang]}: <b>+{final.xp} XP</b></div>
      <button className="bt-btn primary big" onClick={onRematch}>{S.rematch[lang]}</button>
      <div className="bt-share-row">
        <button className="bt-btn share tg" onClick={() => void doShare("tg")}>📱 Telegram</button>
        <button className="bt-btn share fb" onClick={() => void doShare("fb")}>📘 Facebook</button>
        <button className="bt-btn share ig" onClick={() => void doShare("ig")}>📸 Instagram</button>
      </div>
      {shareXp > 0
        ? <div className="bt-share-xp">{S.shareGot[lang].replace("{n}", String(shareXp))}</div>
        : <div className="bt-share-hint">{S.shareHint[lang]}</div>}
      <button className="bt-btn ghost" onClick={onExit}>{S.home[lang]}</button>
    </div>
  );
}
