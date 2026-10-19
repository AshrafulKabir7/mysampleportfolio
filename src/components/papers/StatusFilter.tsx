import { m } from "motion/react";
import { cn } from "@/lib/cn";
import type { PaperStatus } from "@/content/site";

export type FilterKey = "All" | PaperStatus;

const OPTIONS: { key: FilterKey; short?: string }[] = [
  { key: "All" },
  { key: "Published" },
  { key: "Submitted" },
  { key: "In preparation", short: "In prep." },
];

export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Segmented status filter. A group of toggle buttons (aria-pressed), with a
 * shared-layout pill that slides to the active option.
 * Mobile: four equal cells, count under the label. sm+: one inline row.
 */
export function StatusFilter({
  value,
  counts,
  onChange,
  controls,
}: {
  value: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (k: FilterKey) => void;
  controls: string;
}) {
  return (
    <div
      role="group"
      aria-label="Filter papers by status"
      className="grid w-full grid-cols-4 rounded-full border border-line-strong p-1 sm:inline-flex sm:w-auto"
    >
      {OPTIONS.map(({ key, short }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            aria-controls={controls}
            onClick={() => onChange(key)}
            className={cn(
              "relative isolate flex min-w-0 flex-col items-center justify-center gap-1 rounded-full px-2 py-2.5 text-[0.8125rem] leading-none tracking-[-0.01em] transition-colors duration-300",
              "sm:h-10 sm:flex-row sm:gap-2.5 sm:px-4 sm:py-0 sm:text-sm",
              active ? "text-bg" : "text-muted hover:text-fg",
            )}
          >
            {active ? (
              <m.span
                layoutId="papers-filter-pill"
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-full bg-fg"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            ) : null}
            {short ? (
              <>
                <span aria-hidden="true" className="sm:hidden">
                  {short}
                </span>
                <span className="sr-only sm:not-sr-only">{key}</span>
              </>
            ) : (
              <span>{key}</span>
            )}
            <span className={cn("label-mono tabular text-[0.62rem]", active && "opacity-70")}>
              <span aria-hidden="true">{pad2(counts[key])}</span>
              <span className="sr-only">({counts[key]})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
