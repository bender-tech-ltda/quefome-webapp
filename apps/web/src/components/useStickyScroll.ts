"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * Legacy qf-sticky-scroll directive: adds `stick-top` / `stick-bottom` when the element's natural
 * position leaves the viewport. The legacy CSS positions those classes as `fixed`; the caller renders
 * a `.sticky-fake` spacer while stuck so the layout doesn't jump.
 */
export function useStickyScroll(ref: RefObject<HTMLElement | null>, reference: "top" | "bottom" = "top") {
  const [stuck, setStuck] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    let naturalTop = 0;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const wasStuck = el.classList.contains(reference === "top" ? "stick-top" : "stick-bottom");
      if (!wasStuck) {
        naturalTop = el.getBoundingClientRect().top + window.scrollY;
        setHeight(el.offsetHeight);
      }
      const scroll = window.scrollY + (reference === "bottom" ? window.innerHeight : 0);
      const edge = reference === "bottom" ? naturalTop + (el.offsetHeight || 0) : naturalTop;
      setStuck(reference === "bottom" ? scroll < edge : scroll > edge);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ref, reference]);

  return { stuck, className: stuck ? (reference === "top" ? "stick-top" : "stick-bottom") : "", spacerHeight: height };
}
