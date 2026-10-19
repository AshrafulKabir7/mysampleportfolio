import { useEffect, useState } from "react";

/**
 * The one-per-session intro overlay is flagged by an inline script in index.html
 * (`html.intro-pending`). The Intro component removes the flag and fires
 * INTRO_DONE when the curtain has lifted.
 */
export const INTRO_DONE = "intro:done";

export function isIntroPending(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("intro-pending");
}

export function finishIntro() {
  document.documentElement.classList.remove("intro-pending");
  try {
    sessionStorage.setItem("aka-intro", "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(INTRO_DONE));
}

/**
 * false during SSR/hydration; becomes true right after mount when there is no
 * intro, or when the intro finishes. Use it to start hero entrance animations.
 */
export function useIntroDone(): boolean {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!isIntroPending()) {
      setDone(true);
      return;
    }
    const on = () => setDone(true);
    window.addEventListener(INTRO_DONE, on);
    // failsafe mirrors the inline script timeout
    const t = window.setTimeout(on, 4200);
    return () => {
      window.removeEventListener(INTRO_DONE, on);
      window.clearTimeout(t);
    };
  }, []);
  return done;
}
