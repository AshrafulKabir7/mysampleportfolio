import { cancelFrame, frame } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { prefersReducedMotion, useReducedMotionPref } from "@/lib/hooks";
import { isIntroPending } from "@/lib/intro";
import { registerLenis } from "@/lib/scroll";

/** frames Lenis may sit still before the loop goes back to sleep */
const IDLE_FRAMES = 6;

/**
 * Lenis smooth scrolling for wheel/trackpad, off entirely for reduced motion.
 * Native touch scrolling is left alone. Nested scrollers opt out with
 * `data-lenis-prevent` (the ⌘K list does).
 *
 * - Lenis is fetched after hydration (it isn't needed for first paint).
 * - Anchors are off: every in-page link goes through scrollToId, and the only
 *   offset is html's scroll-padding-top, which Lenis subtracts itself.
 * - No perpetual rAF: lenis.raf rides motion's frame loop only while Lenis is
 *   animating (woken by wheel input or a programmatic scrollTo), so the main
 *   thread idles when the page is still.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotionPref();

  useEffect(() => {
    // during hydration `reduce` is still its server value: read the live preference too
    if (reduce || prefersReducedMotion()) return;
    let cancelled = false;
    let teardown: (() => void) | null = null;

    import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: false });

        let running = false;
        let still = 0;
        const tick = ({ timestamp }: { timestamp: number }) => {
          lenis.raf(timestamp);
          still = lenis.isScrolling === "smooth" ? 0 : still + 1;
          if (still > IDLE_FRAMES) {
            running = false;
            cancelFrame(tick);
          }
        };
        const wake = () => {
          if (running) return;
          running = true;
          still = 0;
          // re-base Lenis's clock so the first frame after a nap isn't one giant step
          lenis.time = performance.now();
          frame.update(tick, true);
        };

        const offWheel = lenis.on("virtual-scroll", ({ event }) => {
          if (event.type === "wheel") wake();
        });

        registerLenis({
          scrollTo: (target, opts) => {
            wake();
            lenis.scrollTo(target, opts);
          },
          stop: () => lenis.stop(),
          start: () => lenis.start(),
        });

        // a modal or the intro curtain may already hold the page: Intro stops Lenis one
        // frame after it mounts and would miss an instance that arrives later
        const lifting = document.documentElement.classList.contains("intro-lifting");
        if ((isIntroPending() && !lifting) || document.documentElement.style.overflow === "hidden") lenis.stop();

        teardown = () => {
          offWheel();
          cancelFrame(tick);
          lenis.destroy();
          registerLenis(null);
        };
      })
      .catch(() => {
        /* offline or blocked chunk: native scrolling still works */
      });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [reduce]);

  return <>{children}</>;
}
