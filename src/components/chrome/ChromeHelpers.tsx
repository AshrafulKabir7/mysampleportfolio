import { m, useTransform, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/* The mark's geometry (same drawing as the favicon): ring + core centred on
   (29, 35), red planet at (49, 15) — 45° up-right on a 28.28-unit orbit. */
const CX = 29;
const CY = 35;
const ORBIT = 28.28;
/** ring centre as a share of the 64-unit box, for CSS transform-origin */
const ORIGIN = `${(CX / 64) * 100}% ${(CY / 64) * 100}%`;

/**
 * The site mark. Without `progress` it is the static favicon drawing, and the
 * planet swings along its orbit when the mark's `group` is hovered.
 *
 * With `progress` (0–1, e.g. scrollYProgress) the mark doubles as a reading
 * indicator: the planet orbits the ring by progress × 360° and leaves a
 * hairline trail on the orbit behind it. Everything is driven by motion values
 * (transform / pathLength only) — no React renders while scrolling.
 */
export function Mark({ className, progress }: { className?: string; progress?: MotionValue<number> }) {
  if (progress) return <OrbitMark className={className} progress={progress} />;
  return (
    <svg viewBox="0 0 64 64" className={cn("size-[22px] shrink-0", className)} aria-hidden="true">
      <circle cx={CX} cy={CY} r="15" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx={CX} cy={CY} r="5.5" fill="currentColor" />
      <g className="origin-[29px_35px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[125deg] group-focus-visible:rotate-[125deg]">
        <circle cx="49" cy="15" r="6.5" fill="var(--accent)" />
      </g>
    </svg>
  );
}

function OrbitMark({ className, progress }: { className?: string; progress: MotionValue<number> }) {
  const rotate = useTransform(progress, [0, 1], [0, 360]);
  // the orbit only appears once reading starts, so the hero shows the plain mark
  const orbit = useTransform(progress, [0, 0.012], [0, 1]);

  return (
    <span aria-hidden="true" className={cn("relative block size-6 shrink-0", className)}>
      <svg viewBox="0 0 64 64" overflow="visible" className="absolute inset-0 size-full">
        <m.g style={{ opacity: orbit }}>
          <circle cx={CX} cy={CY} r={ORBIT} fill="none" stroke="var(--line-strong)" strokeWidth="2.25" />
          {/* the stroke starts at 3 o'clock: turn it back 45° so the trail begins where the planet starts */}
          <g transform={`rotate(-45 ${CX} ${CY})`}>
            <m.circle
              cx={CX}
              cy={CY}
              r={ORBIT}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.75"
              className="opacity-70 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ pathLength: progress }}
            />
          </g>
        </m.g>
        <circle cx={CX} cy={CY} r="15" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx={CX} cy={CY} r="5.5" fill="currentColor" />
      </svg>
      {/* HTML wrapper so the rotation origin (the ring centre) is plain CSS */}
      <m.span className="absolute inset-0 block" style={{ rotate, transformOrigin: ORIGIN }}>
        <svg viewBox="0 0 64 64" overflow="visible" className="block size-full">
          <circle
            cx="49"
            cy="15"
            r="6.5"
            fill="var(--accent)"
            className="origin-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-box:fill-box] group-hover:scale-125 group-focus-visible:scale-125"
          />
        </svg>
      </m.span>
    </span>
  );
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Defaults to Apple until mounted so SSR markup is stable. */
export function useIsMac(): boolean {
  const [mac, setMac] = useState(true);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const p = nav.userAgentData?.platform || nav.platform || nav.userAgent;
    setMac(/mac|iphone|ipad|ipod/i.test(p));
  }, []);
  return mac;
}

/** true when a key press is meant for a text field, so global shortcuts should stay out of the way */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Keep Tab / Shift+Tab cycling inside `root` (visible focusables only) */
export function trapTab(e: KeyboardEvent, root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
  if (!els.length) return;
  const first = els[0];
  const last = els[els.length - 1];
  const active = document.activeElement;
  const inside = active instanceof Node && root.contains(active);
  if (e.shiftKey && (active === first || !inside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !inside)) {
    e.preventDefault();
    first.focus();
  }
}

/** Open a URL in a new tab without handing it a reference to this window */
export function openExternal(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}
