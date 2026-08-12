// Platform layer: works inside Telegram (Mini App, initData auth) and as a
// standalone website (Login Widget → session token).
interface TelegramHaptic {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
  selectionChanged: () => void;
}
interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { start_param?: string };
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
  themeParams: Record<string, string>;
  HapticFeedback?: TelegramHaptic;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = window.Telegram?.WebApp;
export const isTelegram = Boolean(tg && tg.initData);

export function initTelegram() {
  if (tg) {
    tg.ready();
    tg.expand();
  }
}

export function getInitData(): string {
  return tg?.initData ?? "";
}

// --- Web session token (only used outside Telegram) ---
const TOKEN_KEY = "session_token";
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Bot username for the Login Widget (no @).
export const BOT_USERNAME = "SmartyNerdBot";

// Mini App deep-link start parameter (e.g. "ref12345" from t.me/Bot?startapp=ref12345).
export function getStartParam(): string {
  return tg?.initDataUnsafe?.start_param ?? "";
}

/** Open a Telegram link (share sheet, etc.), falling back to a normal navigation outside Telegram. */
export function openTgLink(url: string) {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, "_blank");
}
