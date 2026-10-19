import { m, useMotionValue, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { Build } from "@/content/site";
import { Chip, NewTab } from "@/components/primitives/Bits";
import { EASE_OUT, Reveal } from "@/components/primitives/Reveal";
import { useFinePointer, useMounted, useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { ProjectCover } from "./ProjectCover";
import { SHOT_H, SHOT_W, pad } from "./util";

const PREVIEW_W = 320;
const PREVIEW_H = 200;
const GAP = 28;

/** React 18 only forwards the lowercase attribute (camelCase `fetchPriority` arrives in React 19) */
const LOW_PRIORITY = { fetchpriority: "low" } as Record<string, string>;

/** Shared column template so the header row and every entry line up */
const COLS =
  "grid-cols-[2.25rem_minmax(0,1fr)_2.5rem] md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.15fr)_4rem_5.5rem] xl:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.05fr)_4rem_5.5rem]";

/* ───────────── floating preview (fine pointer only) ───────────── */

function FloatingPreview({
  items,
  active,
  last,
  x,
  y,
}: {
  items: Build[];
  active: number | null;
  last: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  const vx = useVelocity(x);
  const rotate = useTransform(vx, [-2400, 0, 2400], [-7, 0, 7]);
  const visible = active !== null;
  const shown = active ?? last;

  return createPortal(
    <m.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[80] overflow-hidden rounded-[16px] border border-line-strong bg-surface-2 shadow-[var(--shadow-card)]"
      style={{ x, y, rotate, width: PREVIEW_W, height: PREVIEW_H }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.72 }}
      transition={{ duration: visible ? 0.5 : 0.3, ease: EASE_OUT }}
    >
      <m.div
        initial={false}
        animate={{ y: -shown * PREVIEW_H }}
        transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.8 }}
      >
        {items.map((b, i) => (
          <div key={b.slug} className="relative overflow-hidden" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
            {b.image ? (
              <img
                src={b.image}
                alt=""
                width={SHOT_W}
                height={SHOT_H}
                decoding="async"
                {...LOW_PRIORITY}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <ProjectCover build={b} live={visible && shown === i} />
            )}
          </div>
        ))}
      </m.div>
    </m.div>,
    document.body,
  );
}

/* ───────────── index list ───────────── */

export function BuildIndex({ items, startIndex }: { items: Build[]; startIndex: number }) {
  const mounted = useMounted();
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const preview = mounted && fine && !reduce;

  const rootRef = useRef<HTMLDivElement>(null);
  /** The preview layer (and its ~125 KB of screenshots) mounts only once the list is approached */
  const [armed, setArmed] = useState(false);
  const near = useRef(false);

  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  const last = useRef(0);
  /** Last known mouse position (viewport coords), null when the pointer left the page */
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const show = useCallback((i: number | null) => {
    if (activeRef.current === i) return;
    activeRef.current = i;
    if (i !== null) last.current = i;
    setActive(i);
  }, []);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 320, damping: 32, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 320, damping: 32, mass: 0.6 });

  const place = useCallback(
    (cx: number, cy: number, jump: boolean) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let nx = cx + GAP;
      if (nx + PREVIEW_W > vw - 16) nx = cx - GAP - PREVIEW_W;
      // sit above-right of the pointer so the hovered row stays readable
      const ny = Math.min(Math.max(cy - PREVIEW_H - 18, 12), vh - PREVIEW_H - 12);
      px.set(nx);
      py.set(ny);
      if (jump) {
        sx.jump(nx);
        sy.jump(ny);
      }
    },
    [px, py, sx, sy],
  );

  // Arm when the list comes within half a viewport; keep tracking whether it is near.
  useEffect(() => {
    const el = rootRef.current;
    if (!preview || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        near.current = entry.isIntersecting;
        if (entry.isIntersecting) setArmed(true);
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      near.current = false;
    };
  }, [preview]);

  // Wheel-scrolling under a still pointer fires no pointer events, and hit-testing on
  // every scroll frame forces a layout. So: hide the preview once when a scroll starts,
  // then hit-test a single time after it settles (or on the next pointer move).
  useEffect(() => {
    if (!preview || !armed) return;
    let timer = 0;
    const settle = () => {
      const p = pointer.current;
      if (!p || !near.current) return;
      const row = document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>("[data-build-row]");
      if (!row) return;
      place(p.x, p.y, true);
      show(Number(row.dataset.buildRow));
    };
    const onScroll = () => {
      if (activeRef.current !== null) show(null);
      window.clearTimeout(timer);
      if (pointer.current && near.current) timer = window.setTimeout(settle, 140);
    };
    const onPointer = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "touch") pointer.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointer.current = null;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [preview, armed, place, show]);

  const onMove = (e: PointerEvent<HTMLOListElement>) => {
    if (!preview || e.pointerType === "touch") return;
    pointer.current = { x: e.clientX, y: e.clientY };
    if (activeRef.current === null) {
      // hidden by a scroll while still over a row: come back on the first move
      const row = (e.target as Element).closest<HTMLElement>("[data-build-row]");
      if (row) {
        place(e.clientX, e.clientY, true);
        show(Number(row.dataset.buildRow));
      }
      return;
    }
    place(e.clientX, e.clientY, false);
  };

  const onEnterRow = (i: number) => (e: PointerEvent<HTMLAnchorElement>) => {
    if (!preview || e.pointerType === "touch") return;
    pointer.current = { x: e.clientX, y: e.clientY };
    // first entry: appear at the pointer instead of flying in from the corner
    if (activeRef.current === null) place(e.clientX, e.clientY, true);
    show(i);
  };

  return (
    <div ref={rootRef} className="mt-24 md:mt-36">
      <Reveal y={12} className="mb-5 flex items-center gap-4 md:mb-8">
        <h3 className="label-mono text-fg">More builds</h3>
        <span className="label-mono tabular text-subtle" aria-hidden="true">
          ({pad(items.length)})
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="label-mono hidden text-muted md:inline">Source & demos</span>
      </Reveal>

      <div aria-hidden="true" className={cn("label-mono hidden gap-x-6 pb-3 text-[0.62rem] text-muted md:grid", COLS)}>
        <span>No.</span>
        <span>Project</span>
        <span>What it is</span>
        <span className="hidden xl:block">Stack</span>
        <span>Year</span>
        <span className="text-right">Open</span>
      </div>

      <ol
        className="group/list border-t"
        onPointerEnter={(e) => {
          if (preview && e.pointerType !== "touch") setArmed(true);
        }}
        onPointerMove={onMove}
        onPointerLeave={() => show(null)}
      >
        {items.map((b, i) => {
          const href = b.live ?? b.repo;
          const dest = b.live ? "Live" : "Code";
          return (
            <li
              key={b.slug}
              className={cn(
                "relative border-b transition-[opacity,border-color] duration-500 ease-out-expo",
                "pointer-fine:group-has-[a:hover]/list:opacity-35 group-has-[a:focus-visible]/list:opacity-35",
                "has-[a:hover]:border-line-strong has-[a:hover]:opacity-100! has-[a:focus-visible]:opacity-100!",
              )}
            >
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                data-build-row={i}
                onPointerEnter={onEnterRow(i)}
                onFocus={() => {
                  last.current = i;
                }}
                className={cn("group/row relative grid items-center gap-x-4 py-6 md:gap-x-6 md:py-7", COLS)}
              >
                <span className="label-mono tabular self-start pt-[0.6em] text-muted md:self-center md:pt-0">
                  {pad(startIndex + i + 1)}
                </span>

                <span className="min-w-0 transition-transform duration-500 ease-out-expo group-hover/row:translate-x-2 group-focus-visible/row:translate-x-2">
                  <span className="block font-display text-[1.65rem] font-semibold leading-[1.02] tracking-[-0.03em] text-balance md:text-[1.9rem] lg:text-[2.15rem]">
                    {b.name}
                  </span>
                  <span className="mt-2 block text-[0.92rem] leading-snug text-muted md:hidden">{b.tagline}</span>
                  <span className="label-mono mt-3 block text-[0.62rem] text-muted md:hidden" aria-hidden="true">
                    {b.year} · {dest}
                  </span>
                </span>

                <span className="hidden min-w-0 text-[0.95rem] leading-snug text-muted transition-transform delay-[40ms] duration-500 ease-out-expo group-hover/row:translate-x-2 group-focus-visible/row:translate-x-2 md:block">
                  {b.tagline}
                </span>

                <span className="hidden min-w-0 items-center gap-1.5 xl:flex">
                  {b.stack.slice(0, 2).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                  {b.stack.length > 2 ? (
                    <span className="label-mono pl-1 text-[0.62rem] text-muted">
                      +{b.stack.length - 2}
                      <span className="sr-only"> more: {b.stack.slice(2).join(", ")}</span>
                    </span>
                  ) : null}
                </span>

                <span className="label-mono tabular hidden text-muted md:block">{b.year}</span>

                <span className="flex items-center justify-end gap-3 self-start md:self-center">
                  <span className="label-mono hidden text-[0.62rem] text-muted transition-colors duration-300 group-hover/row:text-fg md:inline">
                    {dest}
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong transition-[color,border-color,background-color] duration-300 group-hover/row:border-accent group-hover/row:text-accent group-focus-visible/row:border-accent group-focus-visible/row:text-accent">
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-500 ease-out-expo group-hover/row:rotate-45 group-focus-visible/row:rotate-45"
                    />
                  </span>
                </span>

                <NewTab />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-fg/50 transition-transform duration-700 ease-out-expo group-hover/row:scale-x-100 group-focus-visible/row:scale-x-100"
                />
              </a>
            </li>
          );
        })}
      </ol>

      {preview && armed ? <FloatingPreview items={items} active={active} last={last.current} x={sx} y={sy} /> : null}
    </div>
  );
}
