// DiceBear-based avatar: renders an SVG from a style + seed (+ bg).
import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import {
  adventurer,
  avataaars,
  bigSmile,
  micah,
  lorelei,
  notionists,
  openPeeps,
  bottts,
  funEmoji,
  pixelArt,
} from "@dicebear/collection";
import type { Avatar } from "@app/shared";
import "./avatar.css";

// Map our style ids → DiceBear style modules.
const STYLES: Record<string, Parameters<typeof createAvatar>[0]> = {
  adventurer,
  avataaars,
  "big-smile": bigSmile,
  micah,
  lorelei,
  notionists,
  "open-peeps": openPeeps,
  bottts,
  "fun-emoji": funEmoji,
  "pixel-art": pixelArt,
};

export const STYLE_IDS = Object.keys(STYLES);
export const BG_IDS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "transparent"];
export const DEFAULT_AVATAR: Avatar = { style: "adventurer", seed: "Learner", bg: "b6e3f4" };

/** Build the avatar SVG string for a given look. */
export function avatarSvg(a: Avatar): string {
  const style = STYLES[a.style] ?? adventurer;
  const opts: Record<string, unknown> = { seed: a.seed || "Learner" };
  if (a.bg && a.bg !== "transparent") opts.backgroundColor = [a.bg];
  return createAvatar(style, opts).toString();
}

export function AvatarView({ avatar, size = 96 }: { avatar: Avatar; size?: number }) {
  const svg = useMemo(() => avatarSvg(avatar), [avatar.style, avatar.seed, avatar.bg]);
  return (
    <div
      className="avatar-view"
      style={{ width: size, height: size }}
      role="img"
      aria-label="avatar"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
