import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { nav, profile } from "@/content/site";
import { LiveDot, NewTab } from "@/components/primitives/Bits";
import { EASE_IN_OUT, EASE_OUT } from "@/components/primitives/Reveal";
import { ALPHABETS, ScrambleText } from "@/components/primitives/ScrambleText";
import { useIsDesktop, useReducedMotionPref } from "@/lib/hooks";
import { useIntroDone } from "@/lib/intro";
import { lockScroll, NAV_QUIET, scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { Mark, trapTab, useIsMac } from "./ChromeHelpers";
import { prefetchPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

const SPY_IDS = nav.map((n) => n.id);
const FOOTER_KEY = "__footer";

const SOCIALS = [
  { label: "GitHub", href: profile.links.github },
  { label: "LinkedIn", href: profile.links.linkedin },
  { label: "ORCID", href: profile.links.orcid },
  { label: "CV", href: profile.links.cv },
];

/**
 * Section crossing a thin band just above the viewport middle; null on the hero.
 * The footer counts as the last section, so Contact stays marked at the page bottom.
 */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const last = ids[ids.length - 1];
    // the site footer (a direct child of #root), only when the last section is on the page
    const footer = document.getElementById(last) ? document.querySelector("#root > footer") : null;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = e.target === footer ? FOOTER_KEY : e.target.id;
          if (e.isIntersecting) visible.add(key);
          else visible.delete(key);
        }
        let next: string | null = null;
        for (const id of ids) if (visible.has(id)) next = id;
        if (!next && visible.has(FOOTER_KEY)) next = last;
        setActive(next);
      },
      { rootMargin: "-42% 0px -56% 0px" },
    );
    els.forEach((el) => io.observe(el));
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [ids]);
  return active;
}

/**
 * Compact after 80px; hides on a fast downward scroll and returns on any
 * upward nudge. Reads scroll through a motion value and only sets state when
 * a threshold flips. Every programmatic jump (scrollToId → NAV_QUIET) keeps it shown.
 */
function useNavScrollState(pinned: boolean) {
  const { scrollY, scrollYProgress } = useScroll();
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState(false);
  const s = useRef({ compact: false, hidden: false, up: 0, pinned, quietUntil: 0 });
  s.current.pinned = pinned;

  useMotionValueEvent(scrollY, "change", (y) => {
    const st = s.current;
    const prev = scrollY.getPrevious() ?? y;
    const d = y - prev;

    const c = y > 80;
    if (c !== st.compact) {
      st.compact = c;
      setCompact(c);
    }

    st.up = d < 0 ? st.up - d : 0;
    let h = st.hidden;
    if (st.pinned || y < 200 || performance.now() < st.quietUntil) h = false;
    else if (d > 0 && scrollY.getVelocity() > 1100) h = true;
    else if (st.up > 18) h = false;
    if (h !== st.hidden) {
      st.hidden = h;
      setHidden(h);
    }
  });

  // nav links, hero CTAs, research pips and the palette all jump through scrollToId
  useEffect(() => {
    const onQuiet = (e: Event) => {
      const ms = typeof (e as CustomEvent<number>).detail === "number" ? (e as CustomEvent<number>).detail : 1800;
      s.current.quietUntil = performance.now() + ms;
      if (s.current.hidden) {
        s.current.hidden = false;
        setHidden(false);
      }
    };
    window.addEventListener(NAV_QUIET, onQuiet);
    return () => window.removeEventListener(NAV_QUIET, onQuiet);
  }, []);

  return { compact, hidden: hidden && !pinned, progress: scrollYProgress };
}

export function Nav() {
  const ready = useIntroDone();
  const reduce = useReducedMotionPref();
  const isDesktop = useIsDesktop();
  const isMac = useIsMac();
  const active = useActiveSection(SPY_IDS);

  const [open, setOpen] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  // never auto-hide for reduced motion: a bar that vanishes and reappears is motion too
  const { compact, hidden, progress } = useNavScrollState(open || focusWithin || reduce);
  // the orbiting planet is scroll-linked motion: reduced motion keeps the static mark
  const markProgress = reduce ? undefined : progress;

  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  /** set when a menu link closes the menu: scrollToId moves focus to the section instead */
  const navigatingRef = useRef(false);

  // the overlay is mobile-only: close it if the viewport grows past md
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  // mobile menu: lock scroll, move focus in, trap Tab, Esc closes, focus returns to the button
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const raf = requestAnimationFrame(() => firstLinkRef.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && menuRef.current) {
        trapTab(e, menuRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    const btn = menuBtnRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      if (!navigatingRef.current) btn?.focus({ preventScroll: true });
      navigatingRef.current = false;
    };
  }, [open]);

  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToId(id);
  };

  const goFromMenu = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigatingRef.current = true;
    setOpen(false);
    // the effect cleanup unlocks scrolling on commit; scroll (and move focus) on the next tick
    window.setTimeout(() => scrollToId(id), 40);
  };

  const openPalette = () => window.dispatchEvent(new Event("palette:open"));
  const warmPalette = () => void prefetchPalette().catch(() => {});

  const barMotion = {
    initial: { opacity: 0, y: -18 },
    animate: {
      opacity: ready ? 1 : 0,
      y: !ready ? -18 : hidden ? -104 : 0,
    },
    transition: {
      opacity: { duration: 0.6, ease: EASE_OUT, delay: 0.35 },
      y: { duration: hidden ? 0.45 : 0.7, ease: hidden ? EASE_IN_OUT : EASE_OUT },
      scale: { duration: 0.6, ease: EASE_OUT },
    },
  };

  return (
    <header
      className={cn("pointer-events-none fixed inset-x-0 top-0", open ? "z-[110]" : "z-[100]")}
      onFocus={(e) => {
        // keyboard focus pins the bar on screen; mouse clicks don't
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) setFocusWithin(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      {/* ───────────── Desktop: centred floating pill ───────────── */}
      <div className="absolute inset-x-0 top-4 hidden justify-center md:flex">
        <m.nav
          aria-label="Primary"
          {...barMotion}
          animate={{ ...barMotion.animate, scale: compact ? 0.94 : 1 }}
          style={{ transformOrigin: "50% 0%" }}
          className="glass pointer-events-auto relative flex h-14 items-center rounded-full border border-line pl-2 pr-1.5"
        >
          <a
            href="#top"
            onClick={go("top")}
            aria-label={`${profile.name}, back to top`}
            className="group flex h-10 items-center gap-2 rounded-full pl-2 pr-2 lg:pr-3"
          >
            <Mark progress={markProgress} className="size-6" />
            <span className="hidden font-display text-[1.06rem] font-semibold tracking-[-0.03em] lg:inline">
              {profile.short}
            </span>
          </a>

          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line-strong lg:mx-1.5" />

          <ul className="flex items-center">
            {nav.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={go(item.id)}
                    data-scramble-host=""
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative flex h-10 items-center rounded-full px-2.5 text-[0.875rem] font-medium tracking-[-0.01em] transition-colors duration-300 lg:px-3.5",
                      isActive ? "text-fg" : "text-muted hover:text-fg focus-visible:text-fg",
                    )}
                  >
                    {isActive ? (
                      <m.span
                        layoutId="nav-active"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border border-line bg-fg/[0.07]"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                      />
                    ) : null}
                    <span className="relative flex items-baseline gap-[3px]">
                      <ScrambleText text={item.label} alphabet={ALPHABETS.glyph} duration={420} className="[clip-path:inset(-4px_0)]" />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "label-mono -translate-y-[0.6em] text-[0.54rem] tracking-[0.02em] transition-colors duration-300",
                          isActive ? "text-accent-text" : "text-subtle",
                        )}
                      >
                        {item.index}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <span aria-hidden="true" className="mx-1 h-5 w-px bg-line-strong lg:mx-1.5" />

          <button
            type="button"
            onClick={openPalette}
            onPointerEnter={warmPalette}
            onFocus={warmPalette}
            aria-label="Open command menu"
            aria-keyshortcuts="Meta+K Control+K"
            className="group/k mx-0.5 inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong pl-2.5 pr-3 text-muted transition-colors duration-300 hover:border-fg/40 hover:text-fg"
          >
            <Search aria-hidden="true" className="size-3.5" strokeWidth={2} />
            <kbd className="font-mono text-[0.72rem] font-medium tracking-[0.02em]">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>

          <ThemeToggle />

          {/* reading progress on the pill's bottom border, between the rounded ends */}
          {markProgress ? (
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-7 -bottom-px h-px origin-left bg-fg/45"
              style={{ scaleX: markProgress }}
            />
          ) : null}
        </m.nav>
      </div>

      {/* ───────────── Mobile: top bar + menu. While open, bar and panel are one modal dialog,
          so the Close button lives inside it. ───────────── */}
      <div
        ref={menuRef}
        className="md:hidden"
        {...(open ? { role: "dialog", "aria-modal": true, "aria-label": "Menu" } : {})}
      >
        <m.div {...barMotion} className="pointer-events-auto absolute inset-x-4 top-4 z-10">
          <div
            className={cn(
              "flex h-14 items-center justify-between rounded-full border pl-2 pr-1.5 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500",
              open ? "border-transparent bg-transparent" : "glass border-line",
            )}
          >
            <a
              href="#top"
              onClick={open ? goFromMenu("top") : go("top")}
              aria-label={`${profile.name}, back to top`}
              className="group flex h-10 items-center gap-2 rounded-full pl-2 pr-3"
            >
              <Mark progress={markProgress} className="size-6" />
              <span className="font-display text-[1.06rem] font-semibold tracking-[-0.03em]">{profile.short}</span>
            </a>
            <div className="flex items-center gap-0.5">
              <ThemeToggle />
              <button
                ref={menuBtnRef}
                type="button"
                aria-expanded={open}
                aria-controls={open ? "mobile-menu" : undefined}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((o) => !o)}
                className="relative inline-flex size-10 items-center justify-center rounded-full text-fg transition-colors duration-300 hover:bg-fg/[0.07]"
              >
                <span
                  aria-hidden="true"
                  className="absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
                  style={{ transform: open ? "translate(0px, 0px) rotate(45deg)" : "translate(0px, -3.5px) rotate(0deg)" }}
                />
                <span
                  aria-hidden="true"
                  className="absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
                  style={{
                    transform: open
                      ? "translate(0px, 0px) rotate(-45deg) scaleX(1)"
                      : "translate(3px, 3.5px) rotate(0deg) scaleX(0.66)",
                  }}
                />
              </button>
            </div>
          </div>
        </m.div>

        <AnimatePresence>
          {open ? (
            <m.div
              key="menu"
              id="mobile-menu"
              data-lenis-prevent=""
              initial={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
              animate={reduce ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
              exit={reduce ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
              transition={{ duration: reduce ? 0.2 : 0.75, ease: EASE_IN_OUT }}
              className="pointer-events-auto fixed inset-0 z-0 flex flex-col overflow-y-auto bg-bg px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24"
            >
              {/* halftone corner, decorative */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(var(--line-strong)_1px,transparent_1.2px)] [background-size:12px_12px] [mask-image:radial-gradient(120%_90%_at_100%_100%,black,transparent_70%)]"
              />

              <nav aria-label="Sections" className="relative">
                <p className="label-mono mb-4 flex items-center gap-3 text-muted">
                  <span aria-hidden="true" className="text-accent-text">§</span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  <span>Index</span>
                </p>
                <ol>
                  {nav.map((item, i) => {
                    const isActive = active === item.id;
                    return (
                      <li key={item.id} className="overflow-hidden border-b border-line">
                        <m.a
                          ref={i === 0 ? firstLinkRef : undefined}
                          href={`#${item.id}`}
                          onClick={goFromMenu(item.id)}
                          aria-current={isActive ? "true" : undefined}
                          initial={reduce ? false : { y: "110%" }}
                          animate={{ y: "0%" }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.22 + i * 0.055 }}
                          className="group flex items-start gap-4 py-3 outline-offset-[-2px]"
                        >
                          <span
                            className={cn("label-mono w-6 pt-2 tabular", isActive ? "text-accent-text" : "text-muted")}
                          >
                            {item.index}
                          </span>
                          <span className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.045em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-active:translate-x-1">
                            {item.label}
                          </span>
                          {isActive ? (
                            <span aria-hidden="true" className="ml-auto mt-4 size-2 rounded-full bg-accent" />
                          ) : null}
                        </m.a>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <m.div
                initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.55 }}
                className="relative mt-auto pt-10"
              >
                <p className="label-mono flex items-start gap-3 text-[0.68rem] leading-relaxed text-fg">
                  <LiveDot className="mt-[3px]" />
                  <span>{profile.status}</span>
                </p>
                <ul className="mt-6 grid grid-cols-2 border-l border-t border-line">
                  {SOCIALS.map((s) => (
                    <li key={s.label} className="border-b border-r border-line">
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center justify-between px-4 py-4 text-[0.95rem] font-medium outline-offset-[-2px] transition-colors active:bg-surface"
                      >
                        <span>
                          {s.label}
                          <NewTab />
                        </span>
                        <ArrowUpRight aria-hidden="true" className="size-4 text-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="label-mono mt-6 flex justify-between gap-4 text-muted">
                  <span>{profile.location}</span>
                  <span className="tabular">{profile.coords}</span>
                </p>
              </m.div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
