import { useInView } from "motion/react";
import { Briefcase, FlaskConical, GraduationCap, Presentation, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { Chip, LiveDot } from "@/components/primitives/Bits";
import { cn } from "@/lib/cn";
import type { PathEntry } from "@/content/site";
import { riseClass, useRise } from "./useRise";

const KIND: Record<PathEntry["kind"], { label: string; Icon: LucideIcon }> = {
  work: { label: "Work", Icon: Briefcase },
  research: { label: "Research", Icon: FlaskConical },
  teaching: { label: "Teaching", Icon: Presentation },
  education: { label: "Education", Icon: GraduationCap },
};

/** Gutter that holds the timeline rail; the node is centred on it. Keep in sync with Path. */
export const RAIL_PAD = "pl-9 md:pl-16";
const NODE_OFFSET = "-left-9 md:-left-16";

/**
 * One CV entry. The node sits inside the (sticky, desktop) period label so it
 * rides down the rail with the entry you're reading. It lights once it has
 * crossed the same 60% viewport line the rail's progress tip is drawn to.
 */
export function TimelineEntry({ entry, forceActive }: { entry: PathEntry; forceActive: boolean }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const reached = useInView(nodeRef, { margin: "9999px 0px -40% 0px" });
  const active = forceActive || reached;
  const [riseRef, rise] = useRise<HTMLDivElement>();
  const { label, Icon } = KIND[entry.kind];

  const [when, ...notes] = entry.period.split(" · ");
  const current = /\bnow$/i.test(when);

  return (
    <li
      className={cn(
        "relative grid gap-y-4 pb-16 last:pb-0 md:grid-cols-12 md:gap-x-8 md:pb-28 print:break-inside-avoid",
        RAIL_PAD,
      )}
    >
      <div className="md:sticky md:top-28 md:col-span-4 md:self-start lg:col-span-3">
        <p className="label-mono relative flex items-center gap-2.5 text-fg tabular">
          <span
            ref={nodeRef}
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 grid size-[11px] -translate-y-1/2 place-items-center rounded-full border bg-bg transition-[border-color,box-shadow] duration-500 print:hidden",
              NODE_OFFSET,
              active
                ? "border-accent shadow-[0_0_0_4px_var(--accent-soft)]"
                : "border-line-strong shadow-[0_0_0_0_transparent]",
            )}
          >
            <span
              className={cn(
                "size-[5px] rounded-full bg-accent transition-transform duration-500 ease-out-expo",
                active ? "scale-100" : "scale-0",
              )}
            />
          </span>
          <span>{when}</span>
          {current ? <LiveDot className="size-1.5" /> : null}
        </p>
        {notes.length ? (
          <p className="label-mono mt-2 text-muted tabular">{notes.join(" · ")}</p>
        ) : null}
      </div>

      <div ref={riseRef} className={cn("min-w-0 md:col-span-8 lg:col-span-9", riseClass(rise))}>
        <p className="label-mono flex items-center gap-2 text-muted">
          <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          {label}
        </p>
        <h3 className="text-display-md mt-4 md:mt-5">{entry.role}</h3>
        <p className="em-serif mt-2 text-xl leading-snug text-muted md:text-2xl">
          {entry.org}
          {entry.place ? <span> — {entry.place}</span> : null}
        </p>

        <ul className="mt-6 max-w-[68ch] space-y-3 md:mt-8">
          {entry.points.map((pt) => (
            <li
              key={pt}
              className="relative pl-6 text-fg/85 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-1.5 before:bg-muted"
            >
              {pt}
            </li>
          ))}
        </ul>

        {entry.tags?.length ? (
          <ul aria-label="Tools" className="mt-6 flex flex-wrap gap-2">
            {entry.tags.map((t) => (
              <li key={t}>
                <Chip>{t}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
