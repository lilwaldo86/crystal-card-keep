import { useEffect, useMemo, useRef } from "react";
import LoadingAvatar from "./LoadingAvatar.jsx";
import cardArt from "../assets/hero-card-art.jpg"; // IMPORTANT: Step later will create this file

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function TradingCard({ href = "#shop", game = "pokemon" }) {
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;

    const setVars = (rx, ry, mx, my) => {
      el.style.setProperty("--rx", `${rx.toFixed(3)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(3)}deg`);
      el.style.setProperty("--mx", `${(mx * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(my * 100).toFixed(2)}%`);
    };

    const reset = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "50%");
      el.classList.remove("is-hover");
    };

    const onEnter = () => {
      el.classList.add("is-hover");
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1

      // modest, safe interactivity
      const max = 3; // degrees
      const ry = (px - 0.5) * (max * 2);
      const rx = -(py - 0.5) * (max * 2);

      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setVars(rx, ry, px, py);
        rafRef.current = 0;
      });
    };

    const onLeave = () => reset();

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    reset();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <div className="tcgCardWrap" ref={wrapRef}>
      <a className="tcgCardLink" href={href} aria-label="Open this section">
        <div className="tcgCard" role="img" aria-label="Trading card preview">
          <div className="tcgCard__rim" />
          <div className="tcgCard__surface">
            <div className="tcgCard__art">
              <img
                className="tcgCard__img"
                src={cardArt}
                alt=""
                draggable={false}
                loading="eager"
              />
            </div>

            <div className="tcgCard__grain" />
            <div className="tcgCard__shine" />
            <div className="tcgCard__vignette" />

            <div className="tcgCard__sigil" aria-hidden="true">
              <LoadingAvatar game={game} size={16} />
            </div>
          </div>

          <div className="tcgCard__shadow" />
        </div>
      </a>
    </div>
  );
}
