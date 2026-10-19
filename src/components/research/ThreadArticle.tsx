import { useInView } from "motion/react";
import { useRef, type RefObject } from "react";
import type { ResearchThread } from "@/content/site";
import { Chip, TextLink } from "@/components/primitives/Bits";
import { Ticker } from "@/components/primitives/Ticker";
import { cn } from "@/lib/cn";
import { FIGURE_LABELS, SCHEMATIC_NOTE } from "./visuals/labels";
import { CornerTicks, DotGrid } from "./Frame";
import { LazyVisual } from "./LazyVisual";

type Props = {
  thread: ResearchThread;
  articleRef: RefObject<HTMLElement>;
  /** this article is crossing the viewport centre */
  active: boolean;
  /**
   * quiet the article while another one is active (lg+, after hydration, never
   * under reduced motion or prefers-contrast: more — decided in Research.tsx)
   */
  dim: boolean;
  /** mount the inline figure (below lg, after hydration) */
  showFigure: boolean;
  /** first article: start on the stage's top line instead of centring in its band */
  first?: boolean;
};

/** Same status vocabulary as Papers: neutral outline, dashed while work is still in progress */
const inProgress = (status: string) => /in progress/i.test(status);

const FADE = "transition-opacity duration-700 ease-out-expo";

export function ThreadArticle({ thread, articleRef, active, dim, showFigure, first }: Props) {
  const titleId = `thread-${thread.id}-title`;
  // Dimming never takes text below 0.8 (fg stays ≥ 9:1); muted text is never dimmed,
  // so it keeps AA in both themes. Purely decorative hairlines may fade further.
  const lift = "group-hover/thread:opacity-100 group-focus-within/thread:opacity-100";
  const quiet = dim ? cn("opacity-80", lift) : "opacity-100";
  const deco = dim ? cn("opacity-30", lift) : "opacity-100";

  return (
    <article
      id={`thread-${thread.id}`}
      ref={articleRef}
      data-thread={thread.id}
      aria-labelledby={titleId}
      className={cn(
        "group/thread relative flex flex-col justify-center lg:min-h-[80svh] lg:py-16",
        first && "lg:justify-start lg:pt-0",
      )}
    >
      {/* index — kicker ─────── status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="label-mono text-muted">
          <span className={cn("transition-colors duration-500", active ? "text-accent-text" : "text-fg")}>
            {thread.index}
          </span>
          <span aria-hidden="true"> — </span>
          <span className="sr-only">, </span>
          {thread.kicker}
        </p>
        <span aria-hidden="true" className={cn("h-px min-w-8 flex-1 bg-line", FADE, deco)} />
        <Chip className={cn(inProgress(thread.status) && "border-dashed")}>{thread.status}</Chip>
      </div>

      <InlineFigure thread={thread} show={showFigure} />

      <h3
        id={titleId}
        className={cn(
          "mt-7 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,3rem)] font-semibold leading-[1.02] tracking-[-0.032em] md:mt-8 lg:text-[clamp(2rem,3.2vw,3rem)]",
          FADE,
          quiet,
        )}
      >
        {thread.title}
      </h3>

      {/* the research question, as a pull-quote */}
      <div className="relative mt-9 pl-6 md:mt-10 md:pl-8">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-line-strong" />
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-px origin-top bg-accent transition-transform duration-700 ease-out-expo",
            active ? "scale-y-100" : "scale-y-0",
          )}
        />
        <p className="label-mono text-muted">Question</p>
        <p className={cn("em-serif mt-3 text-[1.6rem] leading-[1.18] text-fg md:text-[2rem] md:leading-[1.15]", FADE, quiet)}>
          {thread.question}
        </p>
      </div>

      <dl className="mt-10 grid gap-7 md:mt-12 md:grid-cols-2 md:gap-10">
        <div className="border-t border-line pt-4">
          <dt className="label-mono text-muted">Approach</dt>
          <dd className="mt-3 text-[0.98rem] leading-relaxed text-muted">{thread.approach}</dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="label-mono text-muted">Result</dt>
          <dd className={cn("mt-3 text-[0.98rem] leading-relaxed text-fg", FADE, quiet)}>{thread.result}</dd>
        </div>
      </dl>

      {/* metrics: rows on mobile, columns split by hairlines from md */}
      <dl className="mt-10 grid border-y border-line md:mt-12 md:grid-cols-3">
        {thread.metrics.map((m, i) => (
          <div
            key={m.label}
            className={cn(
              "flex items-baseline justify-between gap-6 py-4 md:flex-col md:items-start md:justify-start md:gap-0 md:py-6",
              i > 0 && "border-t border-line md:border-l md:border-t-0 md:pl-6",
            )}
          >
            <dt className="label-mono order-2 text-right text-muted md:mt-3 md:text-left">{m.label}</dt>
            <dd
              className={cn(
                "order-1 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.035em] md:text-5xl lg:text-[2.6rem] xl:text-5xl",
                FADE,
                quiet,
              )}
            >
              <Ticker value={m.value} decimals={m.decimals} prefix={m.prefix} suffix={m.suffix} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
        <ul aria-label="Topics" className="flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>
        {thread.links.length ? (
          <div className="flex gap-5 md:ml-auto">
            {thread.links.map((l) => (
              <TextLink key={l.href} href={l.href} className="label-mono text-fg">
                {l.label}
                <span className="sr-only"> for {thread.title}</span>
              </TextLink>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Below lg: the thread's figure sits inline under the label row, animating while
 * in view. The frame — with its role="img" description and fixed size — is
 * prerendered; the SVG mounts client-side into it, so nothing shifts. From lg
 * the frame collapses to screen-reader-only (the sticky stage shows the figure)
 * so each thread's description stays in reading order.
 */
function InlineFigure({ thread, show }: { thread: ResearchThread; show: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  return (
    <div
      role="img"
      aria-label={FIGURE_LABELS[thread.id]}
      className="relative mt-6 overflow-hidden rounded-[20px] border border-line bg-surface lg:sr-only"
    >
      <DotGrid />
      <div aria-hidden="true" className="label-mono relative z-10 flex items-center justify-between gap-4 px-4 pb-1.5 pt-4 text-muted md:px-6 md:pt-5">
        {/* the article's kicker already carries the index on phones */}
        <span className="tabular hidden shrink-0 sm:inline">Fig. {thread.index}</span>
        <span className="min-w-0 truncate">{SCHEMATIC_NOTE}</span>
      </div>
      <div ref={ref} className="relative aspect-square md:aspect-[16/10]">
        <div className="absolute inset-0 grid place-items-center p-4 md:p-8 [container-type:size]">
          <div className="relative aspect-square w-[min(100cqw,100cqh)]">
            {show ? <LazyVisual id={thread.id} active={inView} /> : null}
            <CornerTicks className="-inset-2.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
