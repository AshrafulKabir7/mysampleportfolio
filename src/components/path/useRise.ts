import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useReducedMotionPref } from "@/lib/hooks";
import { isMotionPaused, MOTION_CHANGE } from "@/lib/motionPref";

export type RiseState = "idle" | "armed" | "shown";

/**
 * Progressive-enhancement scroll reveal for long-form CV content.
 *
 * The prerendered HTML is always fully visible ("idle"), so no-JS readers,
 * crawlers and printers get everything. After mount, an element is "armed"
 * (hidden) only if the first IntersectionObserver report finds it entirely
 * below the viewport, where nobody sees the switch; it is "shown" once it
 * scrolls in. Anything already in or above the viewport is never armed.
 *
 * Reduced motion and the site's "pause motion" switch never arm, and undo any
 * arming that already happened. That matters during hydration: the hook value
 * is the server snapshot (false) on the first effect pass, so the effect also
 * reads the live preference, and the returned state is forced to "idle"
 * whenever reduce is on.
 *
 * State changes happen at most twice per element, from an IntersectionObserver
 * (never from a scroll loop), and the effect forces no layout of its own.
 */
export function useRise<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduce = useReducedMotionPref();
  const [state, setState] = useState<RiseState>("idle");

  useEffect(() => {
    const el = ref.current;
    if (reduce || prefersReducedMotion() || isMotionPaused()) {
      setState("idle");
      return;
    }
    if (!el || typeof IntersectionObserver === "undefined") return;

    // The root reaches far above the viewport, so "intersecting" means "its top has
    // passed the 92% line", whether it is on screen or already scrolled past. A jump
    // over an armed element (nav link, End key, fast fling) therefore still reveals it.
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        if (!e.isIntersecting && e.boundingClientRect.top >= window.innerHeight) {
          setState((s) => (s === "idle" ? "armed" : s));
          return;
        }
        // Reached, or (first report only) already visible in the bottom band:
        // reveal if armed, otherwise leave it exactly as rendered.
        setState((s) => (s === "armed" ? "shown" : s));
        io.disconnect();
      },
      { rootMargin: "1000000px 0px -8% 0px" },
    );
    io.observe(el);

    const onMotionChange = (ev: Event) => {
      if (!(ev as CustomEvent<boolean>).detail) return;
      io.disconnect();
      setState("idle");
    };
    window.addEventListener(MOTION_CHANGE, onMotionChange);

    return () => {
      io.disconnect();
      window.removeEventListener(MOTION_CHANGE, onMotionChange);
    };
  }, [reduce]);

  return [ref, reduce ? "idle" : state] as const;
}

/** Classes for a rise state; print always shows the final state. */
export function riseClass(state: RiseState) {
  if (state === "armed") return "translate-y-5 opacity-0 print:translate-y-0 print:opacity-100";
  if (state === "shown")
    return "translate-y-0 opacity-100 transition-[opacity,transform] duration-[900ms] ease-out-expo";
  return "";
}
