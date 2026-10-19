import { useEffect, useState, useSyncExternalStore } from "react";

/** One MediaQueryList per query, shared by every hook instance */
const mqls = new Map<string, MediaQueryList>();
function mql(query: string): MediaQueryList {
  let m = mqls.get(query);
  if (!m) {
    m = window.matchMedia(query);
    mqls.set(query, m);
  }
  return m;
}

/**
 * SSR-safe media query. Returns `serverValue` during prerender and hydration,
 * then the live value. Never read matchMedia during render elsewhere.
 * Effects keyed on this value must undo their side effects when it flips
 * after hydration (the first effect pass still sees `serverValue`).
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const m = mql(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => mql(query).matches,
    () => serverValue,
  );
}

/** Live, non-hook read for effects and handlers (never during render) */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && mql("(prefers-reduced-motion: reduce)").matches;

/** true when the user asked the OS for less motion */
export const useReducedMotionPref = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** true on devices with a precise hovering pointer (mouse / trackpad) — gate cursor & magnetic effects */
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

/** true from md breakpoint (768px) up */
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)", true);

/** false during SSR and the hydration pass, true afterwards */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export type DhakaTime = { time: string; hour: number; isNight: boolean };

/** Live clock for Dhaka (GMT+6). `null` until mounted so prerendered HTML stays deterministic. */
export function useDhakaTime(intervalMs = 15_000): DhakaTime | null {
  const [now, setNow] = useState<DhakaTime | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => {
      const time = fmt.format(new Date());
      const hour = Number(time.slice(0, 2));
      setNow({ time, hour, isNight: hour >= 18 || hour < 6 });
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Copy text and report success; falls back to a hidden textarea on old browsers */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
