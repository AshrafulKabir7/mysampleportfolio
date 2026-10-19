import { useEffect, useState } from "react";


/**
 * Site-level "pause motion" switch (WCAG 2.2.2), independent of the OS setting.
 * CSS pauses every animation under html.motion-paused; JS loops (hero field,
 * ticker) check isMotionPaused() and listen for MOTION_CHANGE.
 */
export const MOTION_CHANGE = "motionchange";
const KEY = "aka-motion";

export function isMotionPaused(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion-paused");
}

export function setMotionPaused(paused: boolean) {
  document.documentElement.classList.toggle("motion-paused", paused);
  try {
    if (paused) localStorage.setItem(KEY, "paused");
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(MOTION_CHANGE, { detail: paused }));
}

/** Reactive version for components (false during SSR and hydration) */
export function useMotionPaused(): boolean {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setPaused(isMotionPaused());
    const on = (e: Event) => setPaused(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(MOTION_CHANGE, on);
    return () => window.removeEventListener(MOTION_CHANGE, on);
  }, []);
  return paused;
}
