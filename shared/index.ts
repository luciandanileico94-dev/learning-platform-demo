// Shared types between backend and frontend.

export type Lang = "ru" | "ro" | "en";

/** A localized string: one value per supported UI language. */
export type Localized = Record<Lang, string>;

export type ExerciseType =
  | "choice"
  | "translate"
  | "order"
  | "match"
  | "mcq"
  | "listen" // hear the word (TTS) → choose the translation
  | "dictation" // hear the word (TTS) → type it
  | "cloze" // fill the blank in a sentence
  | "truefalse" // is this pairing correct?
  | "oddoneout" // pick the word that doesn't belong
  | "picture" // see the word → pick its matching photo from 4
  | "flashcards"; // flip card: recall → reveal → self-assess (знал/не знал)

/** One "info card" shown in the Teach step before practice (vocab or concept). */
export interface TeachItem {
  /** Headword/concept, localized (for vocab the target word repeats across langs). */
  title: Localized;
  /** Translation or explanation, localized. */
  body?: Localized;
  /** Longer explanation shown on the full-screen detail page (2-3x body). */
  detail?: Localized;
  /** Lesson-like structured long-form explanation: ordered sections, each a
   *  short heading + a paragraph. Preferred over `detail` on the detail screen. */
  sections?: { heading: Localized; body: Localized }[];
  /** Illustration filename served from /media (e.g. "chem-atoms-elements-easy-0"). */
  image?: string;
  /** Optional example sentence. */
  example?: string;
  /** Optional emoji/icon. */
  emoji?: string;
  /** Target-language word to read aloud via TTS. Present for language lessons. */
  audioWord?: string;
  /** Phonetic pronunciation guide for the word. */
  phonetic?: { ipa?: string; ru?: string; ro?: string };
}

/** A word↔emoji pair for "match" exercises (server-only truth). */
export interface MatchPair {
  word: string;
  emoji: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  /** Question/prompt shown to the learner, localized into their UI language. */
  prompt: Localized;
  /** Answer options (for "choice"). */
  options?: string[];
  /** Localized answer options (for "mcq" — subjects). */
  optionsLoc?: Localized[];
  /** Correct option index (for "mcq"). Server-only. */
  answerIndex?: number;
  /** Shuffled word tokens to assemble (for "order"). */
  tokens?: string[];
  /** Photo concept slugs (for "picture"), parallel to `options`. Client renders /media/w-<slug>.png. */
  photos?: string[];
  /** Correct word↔emoji pairs (for "match"). Server-only. */
  pairs?: MatchPair[];
  /** The correct answer string (choice/translate/order/cloze/oddoneout/dictation). Server-only. */
  answer?: string;
  /** Target-language word/phrase to speak via TTS (for "listen"/"dictation"/"flashcards"). */
  audioWord?: string;
  /** Reveal text shown on the back of a "flashcards" card (the translation). */
  reveal?: Localized;
  /** Why the answer is what it is — the key teaching moment. Localized. */
  explanation: Localized;
}

export interface Lesson {
  id: string;
  unitId: string;
  /** Randomization seed that produced this lesson's selection/order. */
  seed?: number;
  title: Localized;
  /** Info cards shown before practice. */
  teach: TeachItem[];
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  courseId: string;
  title: Localized;
  icon: string;
}

export interface Course {
  id: string;
  title: Localized;
  level: string;
}

/** Exercise as sent to the client: correct answer/pairs hidden. */
export interface ClientExercise {
  id: string;
  type: ExerciseType;
  prompt: Localized;
  options?: string[];
  optionsLoc?: Localized[];
  tokens?: string[];
  /** Photo concept slugs (for "picture"), parallel to `options`. Client renders /media/w-<slug>.png. */
  photos?: string[];
  /** For "match": shuffled words and emojis as two separate columns. */
  words?: string[];
  emojis?: string[];
  /** Target-language word to speak via TTS (for "listen"/"dictation"/"flashcards"). */
  audioWord?: string;
  /** Reveal text shown on the back of a "flashcards" card (the translation). */
  reveal?: Localized;
  /** Fixture-only answer metadata; production API would keep these server-side. */
  answer?: string;
  answerIndex?: number;
  explanation?: Localized;
}

export interface ClientLesson {
  id: string;
  unitId: string;
  /** "language" = vocab lesson (New words); "subject" = knowledge lesson (New knowledge). */
  kind?: "language" | "subject";
  /** Seed to echo back on answer/complete so the server rebuilds the same lesson. */
  seed?: number;
  title: Localized;
  teach: TeachItem[];
  exercises: ClientExercise[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  username?: string;
  xp: number;
  streak: number;
  lessons?: number;
  crowns?: number;
  avatar?: Avatar;
  me: boolean;
}
export interface Leaderboard {
  top: LeaderboardEntry[];
  total: number;
  myRank: number | null;
  myXp: number;
}

export interface LeagueEntry {
  rank: number;
  name: string;
  username?: string;
  weekXp: number;
  tier: string;
  streak?: number;
  lessons?: number;
  crowns?: number;
  avatar?: Avatar;
  me: boolean;
}
export interface League {
  week: string;
  top: LeagueEntry[];
  total: number;
  myRank: number | null;
  myWeekXp: number;
  myTier: string | null;
}

/** One spaced-repetition review item: pick the foreign word for a translation. */
export interface ReviewItem {
  key: string; // stable concept key (the word's English form)
  emoji?: string;
  prompt: string; // the translation in the user's language
  options: string[]; // 4 foreign-word candidates
  answer: number; // index of the correct option
}
export interface ReviewDeck {
  items: ReviewItem[];
  due: number; // how many SRS-due items the learner has overall
}

export interface SubjectReviewItem {
  key: string;
  prompt: Localized;
  options: Localized[];
  answerIndex: number;
  explanation?: Localized;
  themeId: string;
}
export interface SubjectReviewDeck {
  items: SubjectReviewItem[];
  due: number;
}

/** A "Learn a random fact" card: one teach item + a couple of easy questions. */
export interface RandomFact {
  themeId: string;
  /** The easy lesson id these exercises belong to (for answer submission). */
  lessonId: string;
  /** Seed used to build the lesson (echo back on answer). */
  seed?: number;
  themeTitle: Localized;
  teach: TeachItem;
  exercises: ClientExercise[];
}

export interface Avatar {
  style: string; // DiceBear style id (e.g. "adventurer", "bottts")
  seed: string; // variant seed
  bg?: string; // background color id (hex w/o #) or "transparent"
}

export interface UserProfile {
  telegramId: number;
  firstName: string;
  username?: string;
  lang: Lang;
  xp: number;
  streak: number;
  freezes?: number; // streak freezes — auto-protect the streak on a missed day
  lastShareXp?: string; // ISO date of the last share-reward claim (daily cooldown)
  weekKey?: string; // ISO year-week the weekly XP is counted for (e.g. "2026-W25")
  weekXp?: number; // XP earned during weekKey (drives the weekly league; resets each week)
  weekDayKey?: string; // YYYY-MM-DD for the per-day league cap counter
  weekDayXp?: number; // XP counted toward the league today (anti-cheat cap)
  lastActiveDay?: string; // YYYY-MM-DD
  completedLessons: string[];
  // Daily challenge counters (all reset together when dailyDate rolls over)
  dailyDate?: string; // YYYY-MM-DD that the daily counters are for
  dailyXp?: number;
  dailyLessons?: number; // lessons completed today
  dailyDuels?: number; // duels finished today
  dailyReviews?: number; // spaced-repetition reviews completed today
  dailyBattleXp?: number; // XP earned in battles today
  dailyQuestRewards?: string[]; // quest ids whose per-quest 10-coin reward was already paid out today
  lastClaim?: string; // YYYY-MM-DD daily reward last claimed
  // Weekly quest streak (consecutive days where all 3 daily quests were completed)
  weeklyQuestStreak?: number; // consecutive days of full quest completion
  weeklyQuestLastDate?: string; // last date weekly streak was incremented
  // Cosmetic avatar
  avatar?: Avatar;
  // Admin/analytics timestamps (ISO)
  createdAt?: string; // first seen
  lastSeen?: string; // last activity (any authed request)
  // Recently-seen item keys per theme (legacy; superseded by `attempts`)
  seen?: Record<string, string[]>;
  // Completed-attempt count per "<themeId>:<difficulty>" — drives the rotating
  // window so a replay shows new words/questions.
  attempts?: Record<string, number>;
  // Spaced-repetition state per word concept: { box (1..5), due (epoch ms) }.
  srs?: Record<string, { box: number; due: number }>;
  // Referrals: who invited me (telegramId), and how many friends joined via my link.
  refBy?: number;
  refs?: number;
  // Onboarding: completed the first-run flow; chosen goals + occupation + interests + level.
  onboarded?: boolean;
  goal?: string; // legacy single goal (= goals[0])
  goals?: string[]; // multi-select goals: language | school | knowledge | growth | career
  occupation?: string; // student | working | teacher | curious
  interests?: string[]; // topic ids that drive the personalized "For you" zone
  startLevel?: string; // "easy" | "medium" | "hard"
  // Soft currency (earned by learning) + owned cosmetics.
  coins?: number;
  bgs?: string[]; // owned premium avatar background ids (hex without #)
  // XP booster consumable
  boosts?: number; // unused boost inventory count
  xpBoostUntil?: number; // epoch ms when the active boost expires (0 or absent = no active boost)
  // Weekly league tier: "bronze" | "silver" | "gold" | "diamond"
  leagueTier?: string;
}

/** Shop catalog + the player's wallet/inventory, as sent to the client. */
export interface ShopState {
  coins: number;
  freezes: number;
  ownedBgs: string[];
  bgs: { id: string; cost: number }[];
  freezeCost: number;
  freeze3Cost: number;
  boosts: number;
  boostCost: number;
  boostActive: boolean;
  boostExpiresAt: number | null;
}

/** What the client submits as an answer (shape depends on exercise type). */
export type AnswerInput =
  | string // choice / translate / order (assembled sentence)
  | number // mcq (selected option index)
  | { word: string; emoji: string }[]; // match

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  /** For "mcq": index of the correct option (client renders it localized). */
  correctIndex?: number;
  explanation: Localized;
  xpAwarded: number;
}

// ---- Battle (PvP knowledge duel) ----

/** The opponent shown in a duel (a real player later; a stat-bot for the MVP). */
export interface BattleOpponent {
  name: string;
  avatar?: Avatar;
  rating: number;
  level: number;
  streak?: number;                      // current win streak (flavor)
  vibe?: "weak" | "even" | "strong";    // strength relative to the player (intrigue)
}

/** One duel question as sent to the client (correct answer stays server-side). */
export interface BattleQuestion {
  idx: number;
  /** Round type. "mcq"/"image" = 4 options; "truefalse" = claim + T/F; "odd" = find-the-odd-one-out. */
  type?: "mcq" | "truefalse" | "image" | "odd" | "order";
  /** For truefalse rounds: the candidate answer shown to judge as true/false. */
  claim?: Localized;
  prompt: Localized;
  options: Localized[];
  /** Subject/track this question came from (for the topic badge). */
  track: Localized;
  icon: string;
  difficulty: string;
  /** When the opponent locks in this round, ms from round start — timing only, NOT correctness. */
  botAnswerMs: number;
  /** Optional illustration slug for this question's topic → /media/<img>.png (small image). */
  img?: string;
  /** Two WRONG option indices to remove when the 50/50 lifeline is used (leaves correct + 1 wrong). */
  fiftyFifty?: number[];
  /** "Ask the audience" poll percentages per option (sum 100, biased toward correct). */
  audience?: number[];
}

export interface BattleStart {
  matchId: string;
  opponent: BattleOpponent;
  total: number;
  perQuestionMs: number;
  questions: BattleQuestion[];
}

export interface BattleRecapItem {
  idx: number;
  you: boolean;
  opp: boolean;
}

export interface BattleFinal {
  result: "win" | "lose" | "draw";
  youScore: number;
  oppScore: number;
  youCorrect: number;
  oppCorrect: number;
  xp: number;
  /** Longest run of consecutive correct answers this match. */
  maxStreak: number;
  /** All 7 correct. */
  flawless: boolean;
  recap: BattleRecapItem[];
}

/** Result of one duel round: reveals the correct answer + both players' outcomes. */
export interface BattleRoundResult {
  idx: number;
  correctIndex: number;
  explanation: Localized;
  you: { correct: boolean; points: number; chosen: number | null };
  opp: { correct: boolean; points: number };
  score: { you: number; opp: number };
  /** Your current combo (consecutive correct answers) after this round. */
  streak: number;
  /** Points were doubled this round thanks to a hot streak (≥3). */
  bonus2x?: boolean;
  done: boolean;
  final?: BattleFinal;
}
