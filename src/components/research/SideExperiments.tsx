import { sideExperiments, threads } from "@/content/site";
import { Reveal } from "@/components/primitives/Reveal";
import { TextLink } from "@/components/primitives/Bits";
import { pad2 } from "./Frame";

/**
 * Smaller studies after the four main threads: a compact index.
 * lg+: the label block sits in the stage column (5) and the items continue the
 * article column (7) as index rows; md: three columns; mobile: a stack.
 */
export function SideExperiments() {
  return (
    <div className="mt-24 grid gap-y-8 md:mt-32 lg:mt-28 lg:grid-cols-12 lg:gap-x-12">
      <Reveal
        y={12}
        className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:col-span-5 lg:flex-col lg:items-start lg:gap-3 lg:border-t lg:border-line-strong lg:pt-5"
      >
        <h3 id="side-experiments-title" className="label-mono text-fg">
          Side experiments
        </h3>
        <span aria-hidden="true" className="h-px flex-1 bg-line lg:hidden" />
        <p className="basis-full text-[0.95rem] leading-relaxed text-muted lg:max-w-[22ch] lg:basis-auto">
          Smaller studies alongside the main {threads.length === 4 ? "four" : threads.length}.
        </p>
      </Reveal>
      <ul
        aria-labelledby="side-experiments-title"
        className="grid gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7 lg:grid-cols-1 lg:gap-y-0 lg:border-b lg:border-line"
      >
        {sideExperiments.map((s, i) => (
          <li key={s.title}>
            <Reveal
              delay={i * 0.08}
              className="flex h-full flex-col border-t border-line-strong pt-5 lg:grid lg:grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-baseline lg:gap-x-6 lg:pb-7 lg:pt-6"
            >
              <span aria-hidden="true" className="label-mono tabular text-muted">
                S{pad2(i + 1)}
              </span>
              <h4 className="mt-4 max-w-[24ch] font-display text-xl font-semibold leading-[1.15] tracking-[-0.02em] lg:mt-0 xl:text-[1.35rem]">
                {s.title}
              </h4>
              <div className="flex flex-1 flex-col">
                <p className="mt-3 max-w-[40ch] text-[0.95rem] leading-relaxed text-muted lg:mt-0">{s.note}</p>
                {s.href ? (
                  <div className="mt-auto pt-5 lg:pt-3">
                    <TextLink href={s.href} className="label-mono text-fg">
                      Code
                      <span className="sr-only"> for {s.title}</span>
                    </TextLink>
                  </div>
                ) : null}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
