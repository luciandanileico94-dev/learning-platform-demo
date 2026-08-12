import type {
  AnswerInput, AnswerResult, BattleFinal, BattleQuestion, BattleRoundResult, BattleStart,
  ClientExercise, ClientLesson, Course, Lang, Leaderboard, League, Localized, RandomFact,
  ReviewDeck, SubjectReviewDeck, ShopState, Avatar, UserProfile,
} from "@app/shared";

export interface SoloQuestion { prompt: Localized; options: Localized[]; correctIndex: number; why: Localized; track: Localized; icon: string; }
export type Difficulty = "easy" | "medium" | "hard" | "ultra";
export interface Level { difficulty: Difficulty; lessonId: string; count: number; completed: boolean; }
export interface ThemeNode { id: string; icon: string; title: Localized; levels: Level[]; }
export interface TrackNode { key: string; domain: string; icon: string; title: Localized; themes: ThemeNode[]; }
export interface DomainNode { domain: string; title: Localized; tracks: TrackNode[]; }
export interface CoursesResponse { course: Course; domains: DomainNode[]; profile: UserProfile; }
export interface WidgetAuthResult { token: string; profile: UserProfile; }

const L = (ru: string, ro: string, en: string): Localized => ({ ru, ro, en });
const profileKey = "learningo-fixture-profile-v2";
const avatarKey = "learningo-fixture-avatar-v2";
const initialProfile: UserProfile = {
  telegramId: 10001, firstName: "Ana Demo", username: "ana_demo", lang: "ro", xp: 120,
  streak: 4, coins: 240, freezes: 2, boosts: 1, completedLessons: [],
  onboarded: true, occupation: "curious", goals: ["knowledge", "school"], interests: ["science", "math", "it"], startLevel: "easy",
  avatar: { style: "adventurer", seed: "Ana Demo", bg: "b6e3f4" },
};
const read = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; } };
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
let profile = read(profileKey, initialProfile);
let avatar = read<Avatar>(avatarKey, profile.avatar ?? initialProfile.avatar!);

const lessonData: Record<string, ClientLesson> = {
  "math-linear": {
    id: "math-linear", unitId: "math-foundations", kind: "subject", title: L("Linear equations", "Ecuații liniare", "Linear equations"),
    teach: [
      { title: L("Unknowns have a value", "Necunoscuta are o valoare", "Unknowns have a value"), body: L("O ecuație descrie o relație pe care o putem verifica.", "O ecuație descrie o relație pe care o putem verifica.", "An equation describes a relationship we can verify."), detail: L("Când izolăm necunoscuta, păstrăm aceeași operație pe ambele părți.", "Când izolăm necunoscuta, păstrăm aceeași operație pe ambele părți.", "When isolating an unknown, apply the same operation to both sides."), emoji: "➗" },
      { title: L("One step at a time", "Un pas la un moment dat", "One step at a time"), body: L("Mută termenii și verifică rezultatul.", "Mută termenii și verifică rezultatul.", "Move terms and check the result."), emoji: "🧩" },
    ],
    exercises: [
      { id: "eq-choice", type: "choice", prompt: L("Care este primul pas pentru 2x + 5 = 15?", "Care este primul pas pentru 2x + 5 = 15?", "What is the first step for 2x + 5 = 15?"), options: ["Scad 5", "Adun 5", "Împart direct", "Înmulțesc cu 5"], answer: "Scad 5", answerIndex: 0, explanation: L("Scădem 5 din ambele părți.", "Scădem 5 din ambele părți.", "Subtract 5 from both sides."), },
      { id: "eq-number", type: "translate", prompt: L("După primul pas, 2x = ?", "După primul pas, 2x = ?", "After the first step, 2x = ?"), options: [], optionsLoc: [], answer: "10", explanation: L("15 − 5 = 10.", "15 − 5 = 10.", "15 − 5 = 10."), },
      { id: "eq-order", type: "order", prompt: L("Pune pașii în ordinea corectă.", "Pune pașii în ordinea corectă.", "Put the steps in the correct order."), options: [], optionsLoc: [], tokens: ["Adun 4 la ambele părți", "Obțin 2x = 14", "Împart la 2 și obțin x = 7"], answer: "Adun 4 la ambele părți Obțin 2x = 14 Împart la 2 și obțin x = 7", explanation: L("Aceasta este ordinea sigură pentru a izola x.", "Aceasta este ordinea sigură pentru a izola x.", "This order safely isolates x."), },
    ],
  },
  "science-observation": {
    id: "science-observation", unitId: "science-basics", kind: "subject", title: L("Observarea științifică", "Observarea științifică", "Scientific observation"),
    teach: [{ title: L("Observă înainte să explici", "Observă înainte să explici", "Observe before explaining"), body: L("Un experiment bun separă observația de presupunere.", "Un experiment bun separă observația de presupunere.", "A good experiment separates observation from assumption."), emoji: "🔬" }],
    exercises: [{ id: "science-choice", type: "choice", prompt: L("Ce este o observație?", "Ce este o observație?", "What is an observation?"), options: ["Un fapt măsurat", "O presupunere", "O reclamă", "O opinie"], answer: "Un fapt măsurat", answerIndex: 0, explanation: L("Observația descrie ceea ce putem vedea sau măsura.", "Observația descrie ceea ce putem vedea sau măsura.", "An observation describes what we can see or measure."), }],
  },
  "ai-basics": {
    id: "ai-basics", unitId: "ai-skills", kind: "subject", title: L("Bazele inteligenței artificiale", "Bazele inteligenței artificiale", "AI foundations"),
    teach: [{ title: L("Modelele învață tipare", "Modelele învață tipare", "Models learn patterns"), body: L("Datele și exemplele influențează răspunsul unui model.", "Datele și exemplele influențează răspunsul unui model.", "Data and examples shape a model's output."), emoji: "🤖" }],
    exercises: [{ id: "ai-choice", type: "choice", prompt: L("Un model poate produce rezultate diferite pentru exemple diferite.", "Un model poate produce rezultate diferite pentru exemple diferite.", "A model can produce different outputs for different examples."), options: ["Adevărat", "Fals"], answer: "Adevărat", explanation: L("Modelele răspund pe baza tiparelor și contextului primit.", "Modelele răspund pe baza tiparelor și contextului primit.", "Models respond based on patterns and context."), }],
  },
};

const domainsBase: DomainNode[] = [
  { domain: "school", title: L("Școală", "Școală", "School"), tracks: [{ key: "math-g7", domain: "school", icon: "➗", title: L("Matematică · clasa VII", "Matematică · clasa VII", "Math · grade VII"), themes: [{ id: "math-foundations", icon: "📐", title: L("Fundamente", "Fundamente", "Foundations"), levels: [{ difficulty: "easy", lessonId: "math-linear", count: 3, completed: false }, { difficulty: "medium", lessonId: "math-linear", count: 3, completed: false }] }] }, { key: "science-g7", domain: "school", icon: "🔬", title: L("Științe · clasa VII", "Științe · clasa VII", "Science · grade VII"), themes: [{ id: "science-basics", icon: "🧪", title: L("Metoda științifică", "Metoda științifică", "Scientific method"), levels: [{ difficulty: "easy", lessonId: "science-observation", count: 1, completed: false }] }] }] },
  { domain: "skills", title: L("Abilități", "Abilități", "Skills"), tracks: [{ key: "ai", domain: "skills", icon: "🤖", title: L("Inteligență artificială", "Inteligență artificială", "Artificial intelligence"), themes: [{ id: "ai-skills", icon: "✨", title: L("AI pentru începători", "AI pentru începători", "AI for beginners"), levels: [{ difficulty: "easy", lessonId: "ai-basics", count: 1, completed: false }] }] }] },
];

const refreshDomains = (): DomainNode[] => domainsBase.map((d) => ({ ...d, tracks: d.tracks.map((t) => ({ ...t, themes: t.themes.map((th) => ({ ...th, levels: th.levels.map((l) => ({ ...l, completed: profile.completedLessons.includes(l.lessonId) })) })) })) }));
const course: Course = { id: "learningo", title: L("Learningo", "Learningo", "Learningo"), level: "personal learning" };

const leaderboard = (): Leaderboard => ({ total: 248, myRank: 7, myXp: profile.xp, top: [{ rank: 1, name: "Mihai Focus", username: "mihai", xp: 860, streak: 18, me: false }, { rank: 2, name: "Sofia Curioasă", username: "sofia", xp: 710, streak: 12, me: false }, { rank: 3, name: "David Learn", xp: 540, streak: 9, me: false }, { rank: 7, name: profile.firstName, username: profile.username, xp: profile.xp, streak: profile.streak, me: true }] });
const league = (): League => ({ week: "2026-W33", total: 36, myRank: 4, myWeekXp: 120, myTier: "silver", top: [{ rank: 1, name: "Sofia Curioasă", weekXp: 280, tier: "gold", me: false }, { rank: 2, name: "Mihai Focus", weekXp: 220, tier: "gold", me: false }, { rank: 4, name: profile.firstName, weekXp: 120, tier: "silver", me: true }] });
const shopState = (): ShopState => ({ coins: profile.coins ?? 0, freezes: profile.freezes ?? 0, ownedBgs: profile.bgs ?? ["b6e3f4"], bgs: [{ id: "b6e3f4", cost: 0 }, { id: "c0aede", cost: 40 }, { id: "ffd5dc", cost: 60 }], freezeCost: 50, freeze3Cost: 120, boosts: profile.boosts ?? 0, boostCost: 80, boostActive: false, boostExpiresAt: null });
const reviewDeck = (): ReviewDeck => ({ due: 2, items: [{ key: "observation", emoji: "🔬", prompt: "observație", options: ["observation", "equation", "pattern", "lesson"], answer: 0 }, { key: "unknown", emoji: "➗", prompt: "necunoscută", options: ["unknown", "answer", "track", "level"], answer: 0 }] });
const subjectReview = (): SubjectReviewDeck => ({ due: 1, items: [{ key: "science-observation", themeId: "science-basics", prompt: L("Ce măsoară o observație bună?", "Ce măsoară o observație bună?", "What does a good observation measure?"), options: [L("Un fapt", "Un fapt", "A fact"), L("O presupunere", "O presupunere", "An assumption")], answerIndex: 0, explanation: L("Datele verificabile sunt punctul de plecare.", "Datele verificabile sunt punctul de plecare.", "Verifiable data is the starting point.") }] });

const battleQuestions = (): BattleQuestion[] => [0, 1, 2].map((idx) => ({ idx, type: "mcq", prompt: L(["Câte laturi are un triunghi?", "Care este rezultatul 2 + 2?", "Ce este o observație?"][idx], ["Câte laturi are un triunghi?", "Care este rezultatul 2 + 2?", "Ce este o observație?"][idx], ["How many sides does a triangle have?", "What is 2 + 2?", "What is an observation?"][idx]), options: [L("3", "3", "3"), L("4", "4", "4"), L("Un fapt", "Un fapt", "A fact"), L("5", "5", "5")], track: L("Științe", "Științe", "Science"), icon: "🧠", difficulty: "easy", botAnswerMs: 4000, fiftyFifty: [2, 3], audience: [72, 18, 6, 4] }));
let currentBattle: { start: BattleStart; score: number; answered: number[] } | null = null;

export const api = {
  auth: async () => profile,
  telegramWidget: async (_data: Record<string, unknown>): Promise<WidgetAuthResult> => ({ token: "fixture", profile }),
  webStart: async () => ({ code: "fixture", botUrl: "https://t.me/learningo_fixture_bot" }),
  webPoll: async (_code: string) => ({ token: "fixture", profile }),
  setLang: async (lang: Lang) => { profile = { ...profile, lang }; write(profileKey, profile); return profile; },
  courses: async (): Promise<CoursesResponse> => ({ course, domains: refreshDomains(), profile }),
  lesson: async (id: string): Promise<ClientLesson> => lessonData[id] ?? lessonData["math-linear"],
  randomFact: async (): Promise<RandomFact> => ({ themeId: "science-basics", lessonId: "science-observation", themeTitle: L("Metoda științifică", "Metoda științifică", "Scientific method"), teach: lessonData["science-observation"].teach[0], exercises: lessonData["science-observation"].exercises }),
  leaderboard: async () => leaderboard(), league: async () => league(), review: async () => reviewDeck(), reviewSubjects: async () => subjectReview(),
  reviewAnswer: async (_key: string, _correct: boolean) => ({ ok: true as const }), reviewSubjectsAnswer: async (_key: string, _correct: boolean) => ({ ok: true as const }),
  ref: async (_inviter: number) => ({ ok: true, refs: 1 }),
  onboard: async (payload: { goals: string[]; occupation: string; interests: string[]; startLevel: string }) => { profile = { ...profile, ...payload, onboarded: true }; write(profileKey, profile); return { ok: true as const }; },
  shop: async () => shopState(),
  shopBuy: async (kind: "bg" | "freeze" | "freeze3" | "boost", id: string) => { const s = shopState(); if (kind === "bg" && !s.ownedBgs.includes(id) && s.coins >= (s.bgs.find((b) => b.id === id)?.cost ?? 0)) profile = { ...profile, coins: s.coins - (s.bgs.find((b) => b.id === id)?.cost ?? 0), bgs: [...s.ownedBgs, id] }; if (kind === "freeze" && s.coins >= s.freezeCost) profile = { ...profile, coins: s.coins - s.freezeCost, freezes: s.freezes + 1 }; if (kind === "freeze3" && s.coins >= s.freeze3Cost) profile = { ...profile, coins: s.coins - s.freeze3Cost, freezes: s.freezes + 3 }; if (kind === "boost" && s.coins >= s.boostCost) profile = { ...profile, coins: s.coins - s.boostCost, boosts: s.boosts + 1 }; write(profileKey, profile); const next = shopState(); return { ok: true, coins: next.coins, bgs: next.ownedBgs, freezes: next.freezes, boosts: next.boosts }; },
  activateBoost: async () => { if ((profile.boosts ?? 0) > 0) { profile = { ...profile, boosts: (profile.boosts ?? 0) - 1, xpBoostUntil: Date.now() + 3600000 }; write(profileKey, profile); } return { ok: true }; },
  getAvatar: async () => avatar,
  saveAvatar: async (a: Avatar) => { avatar = a; profile = { ...profile, avatar: a }; write(avatarKey, avatar); write(profileKey, profile); return avatar; },
  answer: async (lessonId: string, exerciseId: string, response: AnswerInput, _seed?: number): Promise<AnswerResult> => { const ex = lessonData[lessonId]?.exercises.find((e) => e.id === exerciseId); const correct = String(response).trim().toLowerCase() === String(ex?.answer ?? "").trim().toLowerCase(); return { correct, correctAnswer: String(ex?.answer ?? ex?.answerIndex ?? "0"), correctIndex: ex?.answerIndex, explanation: ex?.explanation ?? L("Bine.", "Bine.", "Good."), xpAwarded: correct ? 10 : 0 }; },
  complete: async (lessonId: string, _seed?: number) => { if (!profile.completedLessons.includes(lessonId)) profile = { ...profile, completedLessons: [...profile.completedLessons, lessonId], xp: profile.xp + 30, coins: (profile.coins ?? 0) + 10, streak: Math.max(profile.streak, 5) }; write(profileKey, profile); return profile; },
  olympiadNotify: async () => ({ ok: true as const }),
  battleStart: async (_category?: string): Promise<BattleStart> => { const start: BattleStart = { matchId: "fixture-match", opponent: { name: "Mihai Focus", rating: 1180, level: 8, streak: 4, vibe: "even" }, total: 3, perQuestionMs: 30000, questions: battleQuestions() }; currentBattle = { start, score: 0, answered: [] }; return start; },
  battleAnswer: async (_matchId: string, idx: number, optionId: number | null, _elapsedMs: number): Promise<BattleRoundResult> => { const q = currentBattle?.start.questions[idx] ?? battleQuestions()[idx]; const correct = optionId === 0; const score = currentBattle ? (currentBattle.score += correct ? 1 : 0) : correct ? 1 : 0; const done = idx >= 2; const final: BattleFinal | undefined = done ? { result: score >= 2 ? "win" : score === 1 ? "draw" : "lose", youScore: score, oppScore: 1, youCorrect: score, oppCorrect: 1, xp: score * 10, maxStreak: score, flawless: score === 3, recap: q ? Array.from({ length: 3 }, (_, i) => ({ idx: i, you: i < score, opp: i === 0 })) : [] } : undefined; return { idx, correctIndex: 0, explanation: L("Răspunsul este evidențiat în explicație.", "Răspunsul este evidențiat în explicație.", "The explanation highlights the answer."), you: { correct, points: correct ? 1 : 0, chosen: optionId }, opp: { correct: idx === 0, points: idx === 0 ? 1 : 0 }, score: { you: score, opp: idx > 0 ? 1 : 0 }, streak: correct ? 1 : 0, done, final }; },
  battleAbandon: async (_matchId: string) => ({ ok: true, deducted: 0 }),
  soloStart: async (_category?: string) => ({ questions: battleQuestions().map((q) => ({ prompt: q.prompt, options: q.options, correctIndex: 0, why: L("Verifică ideea de bază.", "Verifică ideea de bază.", "Check the core idea."), track: q.track, icon: q.icon })) }),
  soloClaim: async (correct: number) => { const xp = correct * 5; profile = { ...profile, xp: profile.xp + xp }; write(profileKey, profile); return { xp }; },
  shareClaim: async () => ({ xp: 5 }),
  shareCardUrl: (_type: string, _value: number, _lang: string) => "#fixture-share",
};
