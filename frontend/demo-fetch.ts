import { api } from "./api";

const realFetch = window.fetch.bind(window);
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });

window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
  if (!url.startsWith("/api/")) return realFetch(input, init);
  if (url === "/api/daily") return json({ quests: [{ id: "xp", goal: 50, progress: 20, done: false, rewarded: false }, { id: "lessons", goal: 1, progress: 0, done: false, rewarded: false }], goalXp: 50, earnedToday: 20, done: false, claimed: false, claimable: false, reward: 30, weeklyQuestStreak: 2, weeklyStreakReady: false });
  if (url === "/api/daily/claim" || url === "/api/daily/claim-quest") return json({ quests: [], goalXp: 50, earnedToday: 50, done: true, claimed: true, claimable: false, reward: 30 });
  if (url === "/api/avatar" && (!init?.method || init.method === "GET")) return json(await api.getAvatar());
  if (url === "/api/avatar" && init?.method === "POST") return json(await api.saveAvatar(JSON.parse(String(init.body ?? "{}"))));
  if (url.startsWith("/api/moldova/tree")) return json({ grade: "VII", profiles: ["general"], subjects: [{ name: { ro: "Matematică", en: "Mathematics" }, lessons: [{ key: "math-linear", ro: "Ecuații liniare", en: "Linear equations", week: 1 }, { key: "math-functions", ro: "Funcții", en: "Functions", week: 2 }] }, { name: { ro: "Științe", en: "Science" }, lessons: [{ key: "science-observation", ro: "Observarea științifică", en: "Scientific observation", week: 1 }] }] });
  if (url.startsWith("/api/moldova/today")) return json({ date: "2026-08-12", week: 1, lessons: [{ key: "math-linear", subject: "Matematică", ro: "Ecuații liniare", en: "Linear equations" }] });
  if (url.startsWith("/api/moldova/lesson/")) return json({ found: true, sourceText: "Conținut demonstrativ local.", content: { title: "Lecție demonstrativă", body: "Acesta este un exemplu local pentru preview." } });
  return realFetch(input, init);
};
