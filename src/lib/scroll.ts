/**
 * Tiny scroll bus so the nav, hero CTAs and the ⌘K palette can scroll
 * through Lenis when it is running and natively when it is not.
 */

type LenisLike = {
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number; duration?: number; immediate?: boolean }) => void;
  stop: () => void;
  start: () => void;
};

let lenis: LenisLike | null = null;

export function registerLenis(instance: LenisLike | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/** Fired before every programmatic jump so the nav stays visible (detail = ms to stay quiet) */
export const NAV_QUIET = "nav:quiet";

/**
 * Smooth-scroll to a section and move keyboard focus there.
 * The nav offset comes from `scroll-padding-top` on <html> only: Lenis subtracts
 * it itself, and the native branch reads it — one source of truth.
 */
export function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  const el = id === "top" ? document.getElementById("top") ?? document.body : document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.dispatchEvent(new CustomEvent(NAV_QUIET, { detail: 1800 }));

  if (lenis && !reduce) {
    lenis.scrollTo(id === "top" ? 0 : el, { duration: 1.4 });
  } else {
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const top = id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - pad;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  history.replaceState(null, "", id === "top" ? location.pathname + location.search : `#${id}`);

  // Move the keyboard / screen-reader starting point to the destination
  const target = id === "top" ? document.getElementById("main") ?? el : el;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.classList.add("outline-none");
  target.focus({ preventScroll: true });
}

/** Pause smooth scrolling while a modal is open */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
