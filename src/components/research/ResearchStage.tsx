import { AnimatePresence, m, useInView, useIsPresent, useScroll } from "motion/react";
import { useRef, type MouseEvent, type ReactNode, type RefObject } from "react";
import { threads, type ResearchThread, type ThreadId } from "@/content/site";
import { EASE_IN_OUT, EASE_OUT } from "@/components/primitives/Reveal";
import { useReducedMotionPref } from "@/lib/hooks";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { SCHEMATIC_NOTE } from "./visuals/labels";
import { CornerTicks, DotGrid, pad2 } from "./Frame";
import { LazyVisual } from "./LazyVisual";

/**
 * Stage height: 4:5 of the column (cqw — the parent column is an inline-size
 * container), capped by the viewport with nav clearance. Known in CSS, so the
 * sticky `top` can centre the card exactly on the viewport's centre band.
 */
const STAGE_H = "min(125cqw, 78svh, 640px, calc(100svh - 12rem))";
const WIPE = { duration: 0.75, ease: EASE_IN_OUT };

type Props = {
  active: ThreadId;
  /** article refs, same order as `threads` — drive the progress segments */
  articleRefs: RefObject<HTMLElement>[];
  /**
   * Mount the figure: true only after hydration and at lg+, where the stage is
   * visible. Below lg the stage is display:none and each article mounts its own.
   */
  showFigure: boolean;
};

/**
 * Sticky "observatory" stage for the Research section (lg+ only).
 * The active thread's figure is revealed by a scan-line wipe while the
 * previous one blurs out underneath; the counter rolls to the new index.
 */
export function ResearchStage({ active, articleRefs, showFigure }: Props) {
  const reduce = useReducedMotionPref();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const idx = Math.max(
    0,
    threads.findIndex((t) => t.id === active),
  );

  return (
    // the parent column must be an inline-size container (see Research.tsx)
    <div
      ref={ref}
      className="sticky isolate flex w-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface"
      style={{ height: STAGE_H, top: `calc((100svh - ${STAGE_H}) / 2)` }}
    >
      <DotGrid />

      {/* top label row: rolling index + the schematic marker */}
      <div aria-hidden="true" className="label-mono relative z-10 flex items-center justify-between gap-4 px-5 pt-5 text-muted xl:px-6">
        <span className="tabular flex shrink-0 items-center gap-2">
          <Roller index={idx} />
          <span className="text-subtle">/</span>
          <span>{pad2(threads.length)}</span>
        </span>
        <span className="min-w-0 truncate text-right">{SCHEMATIC_NOTE}</span>
      </div>

      {/* figure — decorative here: each article carries the prerendered description */}
      <div aria-hidden="true" className="relative z-0 min-h-0 flex-1 p-6 xl:p-10">
        <div className="relative size-full [container-type:size]">
          <div className="absolute left-1/2 top-1/2 aspect-square w-[min(100cqw,100cqh)] -translate-x-1/2 -translate-y-1/2">
            {showFigure ? (
              <>
                <AnimatePresence initial={false}>
                  <StageLayer key={active} reduce={reduce}>
                    <LazyVisual id={active} active={inView} />
                  </StageLayer>
                </AnimatePresence>
                {!reduce ? (
                  <AnimatePresence initial={false}>
                    <ScanLine key={active} />
                  </AnimatePresence>
                ) : null}
              </>
            ) : null}
            <CornerTicks className="-inset-3" />
          </div>
        </div>
      </div>

      {/* progress segments — in-page links to each thread */}
      <nav aria-label="Research threads" className="relative z-10 px-5 pb-5 xl:px-6">
        <ol className="grid grid-cols-4 gap-3">
          {threads.map((t, i) => (
            <li key={t.id}>
              <Segment thread={t} isActive={i === idx} done={i < idx} target={articleRefs[i]} reduce={reduce} />
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

/** One figure layer. Entering layer sits on top and is wiped in; the leaving one blurs out below. */
function StageLayer({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  const isPresent = useIsPresent();
  return (
    <m.div
      className="absolute inset-0"
      style={{ zIndex: isPresent ? 2 : 1 }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.035, clipPath: "inset(0% 0% 100% 0%)" }}
      animate={
        reduce
          ? { opacity: 1 }
          : {
              opacity: 1,
              scale: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              transition: { clipPath: WIPE, opacity: { duration: 0.3 }, scale: { duration: 1, ease: EASE_OUT } },
            }
      }
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0.3 } }
          : { opacity: 0, scale: 0.96, filter: "blur(10px)", transition: { duration: 0.55, ease: EASE_IN_OUT } }
      }
    >
      {children}
    </m.div>
  );
}

/** Accent hairline riding the leading edge of the wipe. Starts at rest (invisible) on first render. */
function ScanLine() {
  return (
    <m.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[3]"
      initial={{ y: "-100%" }}
      animate={{ y: "0%" }}
      transition={WIPE}
    >
      <m.div
        className="absolute inset-x-[-12px] bottom-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: 0.95, times: [0, 0.78, 1] }}
      >
        <div className="h-10 bg-linear-to-t from-accent/12 to-transparent" />
        <div className="h-px bg-accent" />
      </m.div>
    </m.div>
  );
}

/** Rolling two-digit counter: a column of indices translated by whole rows. */
function Roller({ index }: { index: number }) {
  return (
    <span className="relative inline-block h-[1.2em] overflow-hidden text-fg">
      <m.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-index * 1.2}em` }}
        transition={{ duration: 0.6, ease: EASE_IN_OUT }}
      >
        {threads.map((t) => (
          <span key={t.id} className="block h-[1.2em] leading-[1.2em]">
            {t.index}
          </span>
        ))}
      </m.span>
    </span>
  );
}

function Segment({
  thread,
  isActive,
  done,
  target,
  reduce,
}: {
  thread: ResearchThread;
  isActive: boolean;
  done: boolean;
  target: RefObject<HTMLElement>;
  reduce: boolean;
}) {
  // 0 → 1 while this article crosses the viewport centre; clamped either side
  const { scrollYProgress } = useScroll({ target, offset: ["start center", "end center"] });
  const href = `#thread-${thread.id}`;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToId(`thread-${thread.id}`);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={isActive ? "step" : undefined}
      className="group flex flex-col gap-2.5 rounded-md py-1.5"
    >
      <span className="flex items-baseline gap-2">
        <span
          className={cn(
            "label-mono text-[0.66rem] transition-colors duration-300",
            isActive ? "text-fg" : "text-muted group-hover:text-fg group-focus-visible:text-fg",
          )}
        >
          {thread.index}
        </span>
        <span className="sr-only">{thread.title}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative block h-[2px] w-full overflow-hidden rounded-full transition-colors duration-500",
          isActive ? "bg-accent/25" : "bg-line-strong group-hover:bg-fg/30",
        )}
      >
        <m.span
          key={reduce ? "static" : "scroll"}
          className={cn(
            "absolute inset-0 origin-left rounded-full transition-colors duration-500",
            isActive ? "bg-accent" : "bg-fg/45",
          )}
          style={{ scaleX: reduce ? (isActive || done ? 1 : 0) : scrollYProgress }}
        />
      </span>
    </a>
  );
}
