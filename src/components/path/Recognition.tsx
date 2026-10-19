import { cn } from "@/lib/cn";
import { recognition } from "@/content/site";
import { riseClass, useRise } from "./useRise";

/** Keep "· Rome" on the same line as the word before it */
const glue = (s: string) => s.replace(/ · /g, "\u00a0· ");

/** Hairline grid of awards, talks and programmes (gap-px over a bg-line field). */
export function Recognition() {
  const [riseRef, rise] = useRise<HTMLUListElement>();

  return (
    <div className="mt-28 md:mt-40">
      <div className="mb-8 flex items-center gap-4 md:mb-10">
        <h3 id="recognition-title" className="label-mono text-fg">
          Recognition
        </h3>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span aria-hidden="true" className="label-mono text-muted tabular">
          {String(recognition.length).padStart(2, "0")}
        </span>
      </div>

      <ul
        ref={riseRef}
        className={cn(
          "grid gap-px overflow-hidden rounded-[20px] border border-line bg-line md:grid-cols-2 lg:grid-cols-3",
          riseClass(rise),
        )}
      >
        {recognition.map((r) => (
          <li
            key={`${r.year}-${r.title}`}
            className="group flex flex-col bg-bg p-6 transition-colors duration-500 hover:bg-surface md:p-8 print:break-inside-avoid"
          >
            <p className="label-mono text-muted tabular">{r.year}</p>
            <h4 className="mt-8 font-display text-xl font-medium leading-tight tracking-[-0.02em] text-fg/85 transition-colors duration-500 group-hover:text-fg md:mt-10">
              {r.title}
            </h4>
            <p className="mt-2 text-[0.95rem] leading-snug text-muted">{glue(r.detail)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
