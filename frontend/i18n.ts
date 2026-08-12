import type { Lang } from "@app/shared";

type Key =
  | "appTitle"
  | "xp"
  | "streak"
  | "start"
  | "check"
  | "next"
  | "correct"
  | "wrong"
  | "lessonDone"
  | "back"
  | "typeAnswer"
  | "completed"
  | "learnTitle"
  | "learnTitleSubj"
  | "continue"
  | "tapToBuild"
  | "clear"
  | "chooseLevel"
  | "easy"
  | "medium"
  | "hard"
  | "ultra"
  | "words"
  | "tasks"
  | "loginTitle"
  | "loginHint"
  | "heroTagline"
  | "intro"
  | "howTitle"
  | "step1"
  | "step2"
  | "step3"
  | "step4"
  | "subjectsCaption"
  | "cta"
  | "toHome"
  | "tapForMore"
  | "details"
  | "randomFact"
  | "randomFactHint"
  | "checkYourself"
  | "anotherFact"
  | "factDone"
  | "leaderboard"
  | "yourRank"
  | "players"
  | "you"
  | "levels"
  | "langsWord"
  | "subjectsWord"
  | "skillsWord"
  | "playAudio"
  | "flip"
  | "battle"
  | "countriesWord";

const STRINGS: Record<Key, Record<Lang, string>> = {
  learnTitleSubj: { ru: "Новые знания", ro: "Cunoștințe noi", en: "New knowledge" },
  appTitle: { ru: "Учим вместе", ro: "Învățăm împreună", en: "Learn together" },
  xp: { ru: "Опыт", ro: "XP", en: "XP" },
  streak: { ru: "Серия", ro: "Serie", en: "Streak" },
  start: { ru: "Начать", ro: "Începe", en: "Start" },
  check: { ru: "Проверить", ro: "Verifică", en: "Check" },
  next: { ru: "Дальше", ro: "Mai departe", en: "Next" },
  correct: { ru: "Верно!", ro: "Corect!", en: "Correct!" },
  wrong: { ru: "Неверно", ro: "Greșit", en: "Wrong" },
  lessonDone: { ru: "Урок пройден! 🎉", ro: "Lecție terminată! 🎉", en: "Lesson done! 🎉" },
  back: { ru: "Назад", ro: "Înapoi", en: "Back" },
  typeAnswer: { ru: "Введите ответ…", ro: "Scrie răspunsul…", en: "Type your answer…" },
  completed: { ru: "пройдено", ro: "terminat", en: "completed" },
  learnTitle: { ru: "Новые слова", ro: "Cuvinte noi", en: "New words" },
  continue: { ru: "Продолжить", ro: "Continuă", en: "Continue" },
  tapToBuild: { ru: "Нажимай на слова по порядку", ro: "Apasă cuvintele în ordine", en: "Tap the words in order" },
  clear: { ru: "Очистить", ro: "Șterge", en: "Clear" },
  chooseLevel: { ru: "Выбери уровень", ro: "Alege nivelul", en: "Choose level" },
  easy: { ru: "Лёгкий", ro: "Ușor", en: "Easy" },
  medium: { ru: "Средний", ro: "Mediu", en: "Medium" },
  hard: { ru: "Сложный", ro: "Greu", en: "Hard" },
  ultra: { ru: "Ультра", ro: "Ultra", en: "Ultra" },
  words: { ru: "слов", ro: "cuvinte", en: "words" },
  tasks: { ru: "заданий", ro: "sarcini", en: "tasks" },
  loginTitle: { ru: "Учим вместе", ro: "Învățăm împreună", en: "Learn together" },
  loginHint: {
    ru: "Войди через Telegram, чтобы начать. Прогресс синхронизируется с приложением в Telegram.",
    ro: "Conectează-te cu Telegram ca să începi. Progresul se sincronizează cu aplicația din Telegram.",
    en: "Log in with Telegram to start. Your progress syncs with the Telegram app.",
  },
  heroTagline: {
    ru: "Учись чему угодно — играя",
    ro: "Învață orice — jucându-te",
    en: "Learn anything — by playing",
  },
  intro: {
    ru: "Языки, школьные предметы и полезные навыки — в коротких уроках с объяснениями. Выбирай сложность, зарабатывай опыт и держи серию каждый день.",
    ro: "Limbi, materii școlare și abilități utile — în lecții scurte cu explicații. Alege dificultatea, câștigă experiență și ține seria în fiecare zi.",
    en: "Languages, school subjects and useful skills — in short lessons with explanations. Pick a difficulty, earn XP and keep your daily streak.",
  },
  howTitle: { ru: "Как это работает", ro: "Cum funcționează", en: "How it works" },
  step1: {
    ru: "🎯 Выбери предмет — языки, математика, физика и другое",
    ro: "🎯 Alege un subiect — limbi, matematică, fizică și altele",
    en: "🎯 Pick a subject — languages, math, physics and more",
  },
  step2: {
    ru: "🎚️ Выбери сложность: лёгкий, средний или сложный",
    ro: "🎚️ Alege dificultatea: ușor, mediu sau greu",
    en: "🎚️ Choose a difficulty: easy, medium or hard",
  },
  step3: {
    ru: "📘 Проходи короткие уроки с объяснением «почему»",
    ro: "📘 Parcurge lecții scurte cu explicații „de ce”",
    en: "📘 Take short lessons with “why” explanations",
  },
  step4: {
    ru: "⭐ Зарабатывай опыт и держи 🔥 серию каждый день",
    ro: "⭐ Câștigă XP și ține 🔥 seria în fiecare zi",
    en: "⭐ Earn XP and keep your 🔥 streak every day",
  },
  subjectsCaption: {
    ru: "6 предметов уже доступны — скоро больше",
    ro: "6 subiecte deja disponibile — în curând mai multe",
    en: "6 subjects available now — more coming soon",
  },
  cta: { ru: "🚀 Давай учить!", ro: "🚀 Hai să învățăm!", en: "🚀 Let's learn!" },
  toHome: { ru: "← На главную", ro: "← Acasă", en: "← Home" },
  tapForMore: { ru: "Нажми, чтобы узнать больше", ro: "Apasă pentru detalii", en: "Tap to learn more" },
  details: { ru: "Подробнее", ro: "Detalii", en: "Details" },
  randomFact: { ru: "🎲 Случайный факт", ro: "🎲 Fapt aleatoriu", en: "🎲 Random fact" },
  randomFactHint: {
    ru: "Узнай что-то новое за минуту — факт и пара вопросов",
    ro: "Învață ceva nou într-un minut — un fapt și câteva întrebări",
    en: "Learn something new in a minute — a fact and a couple of questions",
  },
  checkYourself: { ru: "Проверь себя", ro: "Verifică-te", en: "Check yourself" },
  anotherFact: { ru: "Ещё факт", ro: "Alt fapt", en: "Another fact" },
  factDone: { ru: "Молодец! 🎉", ro: "Bravo! 🎉", en: "Nice work! 🎉" },
  leaderboard: { ru: "🏆 Рейтинг", ro: "🏆 Clasament", en: "🏆 Leaderboard" },
  yourRank: { ru: "Твоё место", ro: "Locul tău", en: "Your rank" },
  players: { ru: "игроков", ro: "jucători", en: "players" },
  you: { ru: "Ты", ro: "Tu", en: "You" },
  levels: { ru: "уровней", ro: "niveluri", en: "levels" },
  langsWord: { ru: "языков", ro: "limbi", en: "languages" },
  subjectsWord: { ru: "предметов", ro: "materii", en: "subjects" },
  skillsWord: { ru: "навыков", ro: "abilități", en: "skills" },
  playAudio: { ru: "🔊 Прослушать ещё раз", ro: "🔊 Ascultă din nou", en: "🔊 Play again" },
  flip: { ru: "🔄 Перевернуть", ro: "🔄 Întoarce", en: "🔄 Flip" },
  battle: { ru: "⚔️ Дуэль", ro: "⚔️ Duel", en: "⚔️ Duel" },
  countriesWord: { ru: "стран", ro: "țări", en: "countries" },
};

export function t(key: Key, lang: Lang): string {
  return STRINGS[key][lang];
}
