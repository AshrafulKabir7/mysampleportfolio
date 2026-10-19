import { useEffect, useState, type RefObject } from "react";
import type { ThreadId } from "@/content/site";

const COARSE = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];

/**
 * The active thread is the article crossing the middle 10% of the viewport
 * (rootMargin '-45% 0px -45% 0px'). A second, coarse observer catches jumps
 * (anchor links, refresh mid-page) that skip the band entirely; both resolve to
 * the article nearest the viewport centre. Observer callbacks only fire on
 * threshold crossings, and state changes only when the id changes.
 */
export function useActiveThread(refs: RefObject<HTMLElement>[], initial: ThreadId): ThreadId {
  const [active, setActive] = useState<ThreadId>(initial);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = refs.map((r) => r.current).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const pick = () => {
      const mid = window.innerHeight / 2;
      let best: ThreadId | undefined;
      let bestD = Infinity;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const d = r.top > mid ? r.top - mid : r.bottom < mid ? mid - r.bottom : 0;
        if (d < bestD) {
          bestD = d;
          best = el.dataset.thread as ThreadId | undefined;
        }
      }
      if (best) {
        const id = best;
        setActive((prev) => (prev === id ? prev : id));
      }
    };

    const band = new IntersectionObserver(pick, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    const coarse = new IntersectionObserver(pick, { threshold: COARSE });
    els.forEach((el) => {
      band.observe(el);
      coarse.observe(el);
    });
    return () => {
      band.disconnect();
      coarse.disconnect();
    };
  }, [refs]);

  return active;
}
