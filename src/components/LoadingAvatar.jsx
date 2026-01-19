import { useMemo } from "react";

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Inline SVG "fantasy character" avatars (generic for now).
 * Later we can replace these with true top characters per game.
 */
const AVATARS = [
  function Wizard({ size }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l9 7-9 3-9-3 9-7z" fill="currentColor" opacity="0.95" />
        <path d="M7 12l5 10 5-10-5 2-5-2z" fill="currentColor" opacity="0.78" />
        <path
          d="M9.2 14.2c1-.7 2-.9 2.8-.9s1.8.2 2.8.9"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.9"
        />
        <circle cx="10.2" cy="15.4" r="0.9" fill="currentColor" />
        <circle cx="13.8" cy="15.4" r="0.9" fill="currentColor" />
      </svg>
    );
  },
  function Knight({ size }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2c4 0 7 3 7 7v4l-2 6H7l-2-6V9c0-4 3-7 7-7z"
          fill="currentColor"
          opacity="0.9"
        />
        <path d="M9 10h6" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
        <path d="M10 13h4" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
        <path d="M8 6l4 2 4-2" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.85" />
      </svg>
    );
  },
  function Rogue({ size }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12c2-5 6-8 8-8s6 3 8 8c-2 5-6 8-8 8s-6-3-8-8z" fill="currentColor" opacity="0.88" />
        <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.6" opacity="0.95" />
        <path
          d="M10 15c.7.6 1.4.8 2 .8s1.3-.2 2-.8"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          opacity="0.9"
        />
      </svg>
    );
  },
  function Dragon({ size }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3c4 1 8 5 8 9 0 5-4 9-8 9s-8-4-8-9c0-4 4-8 8-9z"
          fill="currentColor"
          opacity="0.82"
        />
        <path d="M9 9l3 2 3-2" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.95" />
        <path d="M10 13l2 2 2-2" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.95" />
      </svg>
    );
  },
];

export default function LoadingAvatar({ game = "pokemon", size = 18 }) {
  const Comp = useMemo(() => {
    // Changes daily per game (stable during the day so it doesn't "flicker" randomly)
    const seed = hashString(`${game}|${new Date().toDateString()}`);
    const rnd = mulberry32(seed);
    const idx = Math.floor(rnd() * AVATARS.length);
    return AVATARS[idx] || AVATARS[0];
  }, [game]);

  return <Comp size={size} />;
}
