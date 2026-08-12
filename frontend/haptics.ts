// Thin Telegram HapticFeedback wrapper. No-ops outside Telegram and when muted
// (shares the sound mute toggle so one control silences both audio + haptics).
import { tg } from "./telegram";
import { isMuted } from "./sound";

const hf = () => (isMuted() ? undefined : tg?.HapticFeedback);

export const haptics = {
  select() { try { hf()?.selectionChanged(); } catch {} },
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") {
    try { hf()?.impactOccurred(style); } catch {}
  },
  success() { try { hf()?.notificationOccurred("success"); } catch {} },
  error() { try { hf()?.notificationOccurred("error"); } catch {} },
  warning() { try { hf()?.notificationOccurred("warning"); } catch {} },
};
