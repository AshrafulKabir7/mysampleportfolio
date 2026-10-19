import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal, RevealText, type Segment } from "./Reveal";

type Props = {
  index: string;
  label: string;
  title: Segment[];
  intro?: ReactNode;
  className?: string;
  /** id for the h2, used by aria-labelledby on the section */
  headingId: string;
};

/**
 * Section opener used by every section:
 *   §01 ───────────── RESEARCH
 *   Big display title with one serif-italic emphasis
 *                                   short intro paragraph →
 */
export function SectionHeader({ index, label, title, intro, className, headingId }: Props) {
  return (
    <header className={cn("mb-14 md:mb-20", className)}>
      <Reveal y={12} className="mb-8 flex items-center gap-4 text-muted md:mb-10">
        <span className="label-mono text-accent">§{index}</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="label-mono">{label}</span>
      </Reveal>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <RevealText
          as="h2"
          id={headingId}
          segments={title}
          className="text-display-lg lg:col-span-8"
        />
        {intro ? (
          <Reveal delay={0.15} className="text-lede max-w-[46ch] text-muted [text-wrap:pretty] lg:col-span-4 lg:pb-2">
            {intro}
          </Reveal>
        ) : null}
      </div>
    </header>
  );
}
