import { m, type HTMLMotionProps } from "motion/react";
import { createElement, Fragment, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

/** Treat everything above the viewport as "seen", so a nav jump past a block never leaves it hidden */
const PAST_TOP = "100000px 0px 0px 0px";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  /** viewport amount before triggering */
  amount?: number;
};

/** Fade + rise once when scrolled into view. Content is in the HTML either way. */
export function Reveal({ children, delay = 0, y = 24, amount = 0.25, className, ...rest }: RevealProps) {
  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: PAST_TOP }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      className={className}
      {...rest}
    >
      {children}
    </m.div>
  );
}

const WORD = { hidden: { y: "110%" }, shown: { y: "0%" } };

export type Segment = { text: string; em?: boolean; accent?: boolean } | { br: true };

type RevealTextProps = {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  segments: Segment[];
  className?: string;
  /** seconds between words */
  stagger?: number;
  delay?: number;
  /** animate on mount instead of in view (hero) */
  onMount?: boolean;
  id?: string;
};

/**
 * Masked word-by-word rise for headings. Screen readers get the plain string
 * via aria-label; the animated spans are aria-hidden.
 * `{ em: true }` renders a serif-italic segment, `{ accent: true }` colours it.
 */
export function RevealText({
  as = "h2",
  segments,
  className,
  stagger = 0.055,
  delay = 0,
  onMount = false,
  id,
}: RevealTextProps) {
  const label = segments
    .map((s) => ("br" in s ? " " : s.text))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  let wordIndex = 0;
  const content: ReactNode[] = [];
  segments.forEach((seg, si) => {
    if ("br" in seg) {
      content.push(<br key={`br-${si}`} />);
      return;
    }
    const words = seg.text.split(" ").filter(Boolean);
    words.forEach((word, wi) => {
      const i = wordIndex++;
      content.push(
        <Fragment key={`${si}-${wi}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <m.span
              className={cn("inline-block", seg.em && "em-serif", seg.accent && "text-accent")}
              variants={WORD}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: delay + i * stagger }}
            >
              {word}
            </m.span>
          </span>
          {wi < words.length - 1 || si < segments.length - 1 ? " " : null}
        </Fragment>,
      );
    });
  });

  return createElement(
    as,
    { className, id },
    <span className="sr-only">{label}</span>,
    // The trigger lives on this unclipped wrapper: each word starts translated out of
    // its own overflow mask, so observing the words themselves would never fire.
    <m.span
      aria-hidden="true"
      initial="hidden"
      {...(onMount ? { animate: "shown" } : { whileInView: "shown", viewport: { once: true, amount: 0.3, margin: PAST_TOP } })}
    >
      {content}
    </m.span>,
  );
}
