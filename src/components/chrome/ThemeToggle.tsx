import { m } from "motion/react";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { prefersReducedMotion } from "@/lib/hooks";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/cn";

const EASE = [0.76, 0, 0.24, 1] as const;

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

/** Keep the browser UI colour in step with the page background */
function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
}

/** Centre of the first visible theme toggle, so palette-triggered switches still radiate from the nav */
function toggleOrigin(): [number, number] {
  const els = document.querySelectorAll<HTMLElement>("[data-theme-toggle]");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return [r.left + r.width / 2, r.top + r.height / 2];
  }
  return [window.innerWidth / 2, window.innerHeight / 2];
}

/**
 * Switch theme. With View Transitions (and motion allowed) the new theme is
 * revealed as a circle growing from (originX, originY); otherwise it swaps instantly.
 */
export function toggleTheme(originX?: number, originY?: number) {
  const next: Theme = readTheme() === "dark" ? "light" : "dark";
  const doc = document as ViewTransitionDoc;
  const reduce = prefersReducedMotion();

  if (!doc.startViewTransition || reduce) {
    applyTheme(next);
    syncThemeColor();
    return;
  }

  const [x, y] = originX != null && originY != null ? [originX, originY] : toggleOrigin();
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  // body colours have a CSS transition; freeze it so the new snapshot is the final state
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";

  const t = doc.startViewTransition(() => {
    document.head.appendChild(freeze);
    applyTheme(next);
    syncThemeColor();
  });
  t.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.76,0,0.24,1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
  t.finished.finally(() => freeze.remove()).catch(() => {});
}

/** Current theme after mount (null during SSR/hydration), kept in sync with every switch */
export function useTheme(): Theme | null {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(readTheme());
    syncThemeColor();
    const on = () => setTheme(readTheme());
    window.addEventListener("themechange", on);
    return () => window.removeEventListener("themechange", on);
  }, []);
  return theme;
}

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const f = (n: number) => Math.round(n * 100) / 100;
  return { x1: f(12 + c * 7.6), y1: f(12 + s * 7.6), x2: f(12 + c * 10), y2: f(12 + s * 10) };
});

/**
 * Sun ↔ moon morph: one disc, a mask circle that slides in to bite a crescent,
 * and rays that spin away. Neutral disc before mount so SSR markup matches.
 */
function ThemeIcon({ theme }: { theme: Theme | null }) {
  const id = `tm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const dark = theme === "dark";
  const light = theme === "light";
  const transition = { duration: 0.6, ease: EASE };

  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" overflow="visible">
      <mask id={id}>
        <rect x="-4" y="-4" width="32" height="32" fill="white" />
        <m.circle
          initial={false}
          animate={dark ? { cx: 17.5, cy: 6.5 } : { cx: 30, cy: -6 }}
          transition={transition}
          r="7"
          fill="black"
        />
      </mask>
      <m.circle
        cx="12"
        cy="12"
        initial={false}
        animate={{ r: dark ? 8.5 : light ? 4.6 : 6 }}
        transition={transition}
        fill="currentColor"
        mask={`url(#${id})`}
      />
      <m.g
        initial={false}
        animate={{ opacity: light ? 1 : 0, rotate: light ? 0 : -60, scale: light ? 1 : 0.55 }}
        transition={transition}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        {RAYS.map((r, i) => (
          <line key={i} {...r} />
        ))}
      </m.g>
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const label =
    theme === "dark" ? "Switch to light theme" : theme === "light" ? "Switch to dark theme" : "Switch colour theme";

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    toggleTheme(r.left + r.width / 2, r.top + r.height / 2);
  };

  return (
    <button
      type="button"
      data-theme-toggle=""
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-fg transition-[background-color,transform] duration-300 hover:bg-fg/[0.07] active:scale-90",
        className,
      )}
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
