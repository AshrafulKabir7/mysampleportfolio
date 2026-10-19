import { useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { Fragment, useEffect, useRef, type Ref } from "react";
import { focusTicker } from "@/content/site";
import { isMotionPaused, MOTION_CHANGE } from "@/lib/motionPref";
import { cn } from "@/lib/cn";

/** Mini coronagraph: occulter ring, residual star, accent planet — the site's mark */
function Glyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-[0.5em] shrink-0 overflow-visible", className)}>
      <circle cx="12" cy="12" r="8" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.6" fill="var(--subtle)" />
      <circle cx="20.5" cy="4.5" r="2.6" fill="var(--accent)" />
    </svg>
  );
}

const item = "font-display whitespace-nowrap text-2xl tracking-[-0.025em] text-muted transition-colors duration-300 hover:text-fg md:text-4xl";

function Row({ rowRef }: { rowRef?: Ref<HTMLDivElement> }) {
  return (
    <div ref={rowRef} className="flex shrink-0 items-center">
      {focusTicker.map((t) => (
        <Fragment key={t}>
          <span className={cn(item, "px-5 md:px-8")}>{t}</span>
          <Glyph className="text-2xl md:text-4xl" />
        </Fragment>
      ))}
    </div>
  );
}

/** px per second at rest; scroll velocity adds up to ×5 */
const BASE_SPEED = 42;

function Marquee() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothV = useSpring(velocity, { damping: 50, stiffness: 300 });
  const boost = useTransform(smoothV, [-3000, 0, 3000], [5, 0, 5]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const row = rowRef.current;
    const section = wrap?.closest("section");
    if (!wrap || !track || !row || !section) return;

    let x = 0;
    let speed = BASE_SPEED;
    let rowW = row.offsetWidth;
    let raf = 0;
    let last = 0;
    let visible = false;
    /* reasons to hold still: mouse hover, keyboard focus, a finger on it, a tap toggle */
    let hover = false;
    let focus = false;
    let touch = false;
    let tapped = false;
    let touchT = 0;
    const held = () => hover || focus || touch || tapped;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const hold = held();
      const target = hold ? 0 : BASE_SPEED * (1 + Math.min(5, boost.get()));
      speed += (target - speed) * (1 - Math.exp(-dt * (hold ? 7 : 3.5)));
      x -= speed * dt;
      if (rowW > 0 && x <= -rowW) x += rowW;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    };
    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // site-level "pause motion" (WCAG 2.2.2) freezes the loop where it is
    const sync = () => (visible && !document.hidden && !isMotionPaused() ? start() : stop());

    const ro = new ResizeObserver(() => {
      rowW = row.offsetWidth;
    });
    ro.observe(row);
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      sync();
    });
    io.observe(wrap);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener(MOTION_CHANGE, sync);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hover = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hover = false;
    };
    // touch: holds while a finger is down and a moment after; a tap toggles a sticky pause
    const onTouchStart = () => {
      window.clearTimeout(touchT);
      touch = true;
    };
    const onTouchEnd = () => {
      window.clearTimeout(touchT);
      touchT = window.setTimeout(() => (touch = false), 1600);
    };
    let downType = "";
    const onDown = (e: PointerEvent) => {
      downType = e.pointerType;
    };
    const onClick = () => {
      if (downType && downType !== "mouse") tapped = !tapped;
    };
    const onFocusIn = () => (focus = true);
    const onFocusOut = (e: FocusEvent) => {
      if (!section.contains(e.relatedTarget as Node | null)) focus = false;
    };
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchend", onTouchEnd, { passive: true });
    section.addEventListener("touchcancel", onTouchEnd, { passive: true });
    section.addEventListener("pointerdown", onDown, { passive: true });
    section.addEventListener("click", onClick);
    section.addEventListener("focusin", onFocusIn);
    section.addEventListener("focusout", onFocusOut);

    return () => {
      stop();
      window.clearTimeout(touchT);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener(MOTION_CHANGE, sync);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchend", onTouchEnd);
      section.removeEventListener("touchcancel", onTouchEnd);
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("click", onClick);
      section.removeEventListener("focusin", onFocusIn);
      section.removeEventListener("focusout", onFocusOut);
    };
  }, [boost]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      // reduced motion swaps in the static list in CSS (no hydration-time flip); hidden, the
      // IntersectionObserver reports it off-screen and the loop never runs
      className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)] motion-reduce:hidden"
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        <Row rowRef={rowRef} />
        <Row />
      </div>
    </div>
  );
}

export function FocusTicker() {
  return (
    <section id="ticker" aria-label="Research focus" className="relative overflow-hidden border-y border-line py-5 md:py-6">
      <ul className="sr-only">
        {focusTicker.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="container-page hidden flex-wrap items-center justify-center gap-x-7 gap-y-2.5 motion-reduce:flex md:gap-x-10"
      >
        {focusTicker.map((t) => (
          <span key={t} className="inline-flex items-center gap-3 md:gap-4">
            <Glyph className="text-xl md:text-3xl" />
            <span className={cn(item, "text-xl md:text-3xl")}>{t}</span>
          </span>
        ))}
      </div>
      <Marquee />
    </section>
  );
}
