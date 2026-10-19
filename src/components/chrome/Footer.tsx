import { m, useScroll, useTransform } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { profile } from "@/content/site";
import { scrollToId } from "@/lib/scroll";
import { useMounted, useReducedMotionPref } from "@/lib/hooks";
import { isMotionPaused, MOTION_CHANGE, setMotionPaused } from "@/lib/motionPref";

const WORD = "ALIF";

/** Dot-screen fill + hairline outline: the "noise" state of the wordmark */
const halftone: CSSProperties = {
  backgroundImage: "radial-gradient(circle at center, var(--fg) 0 1.15px, transparent 1.6px)",
  backgroundSize: "7px 7px",
  backgroundPosition: "0 0",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextStroke: "1px var(--line-strong)",
};

/* Reduced motion: explicit final values. Passing `undefined` after the prerendered
   (motion) values would leave the stale inline clip-path / opacity on the element. */
const SETTLED_RISE = { y: 0 };
const SETTLED_INK = { clipPath: "inset(0% 0 0 0)", WebkitClipPath: "inset(0% 0 0 0)" };
const SETTLED_DOT = { scale: 1 };

/**
 * Site-wide "Pause motion" switch (WCAG 2.2.2) for people who haven't set the OS
 * reduced-motion preference. The label itself carries the state, so no aria-pressed
 * (a pressed "Resume motion" would contradict itself). Hydrates with the neutral label.
 */
function MotionToggle() {
  const mounted = useMounted();
  const reduce = useReducedMotionPref();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const sync = () => setPaused(isMotionPaused());
    sync();
    window.addEventListener(MOTION_CHANGE, sync);
    return () => window.removeEventListener(MOTION_CHANGE, sync);
  }, []);

  // the OS already keeps things still: nothing to pause
  if (reduce) return null;

  const isPaused = mounted && paused;
  const Icon = isPaused ? Play : Pause;
  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!isMotionPaused())}
      className="link-draw label-mono inline-flex items-center gap-2 pb-0.5 text-muted transition-colors hover:text-fg"
    >
      <Icon aria-hidden="true" className="size-3 shrink-0" strokeWidth={2} />
      {isPaused ? "Resume motion" : "Pause motion"}
    </button>
  );
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0, 0.55], ["38%", "0%"]);
  const fill = useTransform(scrollYProgress, [0.3, 0.95], [100, 0]);
  const clip = useTransform(fill, (v) => `inset(${v}% 0 0 0)`);
  const dot = useTransform(scrollYProgress, [0.5, 0.95], [0, 1]);
  // once the ink is solid, retire the dot screen so its outline doesn't fringe the letters
  const screen = useTransform(scrollYProgress, [0.9, 1], [1, 0]);

  return (
    <footer ref={ref} className="container-page relative pb-8 pt-24">
      <p className="sr-only">Ashraful Kabir Alif</p>

      {/* Giant wordmark — decorative; rises from a mask, dots resolve into solid ink */}
      <div aria-hidden="true" className="@container relative select-none overflow-hidden">
        {/* keyed: m.* keep the MotionValues they hydrated with, so the reduce flip must remount */}
        <m.div
          key={reduce ? "still" : "live"}
          style={reduce ? SETTLED_RISE : { y: rise }}
          className="relative pt-[0.03em] text-[55.5cqw] leading-[0.8]"
        >
          <span
            className="relative block w-fit font-display font-semibold leading-[0.8] tracking-[-0.035em]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            <m.span
              className="block"
              style={reduce ? { ...halftone, opacity: 0 } : { ...halftone, opacity: screen }}
            >
              {WORD}
            </m.span>
            <m.span
              className="absolute inset-0 block text-fg"
              style={reduce ? SETTLED_INK : { clipPath: clip, WebkitClipPath: clip }}
            >
              {WORD}
            </m.span>
            {/* the companion: a small planet beside the star */}
            <m.span
              className="absolute right-[-0.115em] top-[0.03em] block size-[0.072em] rounded-full bg-accent"
              style={reduce ? SETTLED_DOT : { scale: dot }}
            />
          </span>
        </m.div>
      </div>

      <div className="label-mono mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t pt-6 text-muted md:mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <span>© 2026 {profile.name}</span>
          <span>
            Built in Dhaka —{" "}
            <span lang="bn" className="font-bangla text-[0.9rem] normal-case tracking-normal">
              {profile.bangla.city}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="basis-full sm:basis-auto">
            {profile.version} · Updated {profile.updated}
          </span>
          <a href="/llms.txt" className="link-draw pb-0.5 transition-colors hover:text-fg">
            llms.txt
          </a>
          <MotionToggle />
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="link-draw label-mono pb-0.5 text-muted transition-colors hover:text-fg"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
