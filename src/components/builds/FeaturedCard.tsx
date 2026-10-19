import type { CSSProperties } from "react";
import type { Build } from "@/content/site";
import { ButtonLink, Chip, spotlightHandlers } from "@/components/primitives/Bits";
import { Ticker } from "@/components/primitives/Ticker";
import { cn } from "@/lib/cn";
import { ProjectCover } from "./ProjectCover";
import { CheckMark, SHOT_H, SHOT_W, hostOf, pad } from "./util";
import "./builds.css";

const DOT_FIELD: CSSProperties = {
  backgroundImage: "radial-gradient(circle, var(--line-strong) 1px, transparent 1.4px)",
  backgroundSize: "13px 13px",
  maskImage: "radial-gradient(120% 100% at 0% 0%, #000 10%, transparent 70%)",
  WebkitMaskImage: "radial-gradient(120% 100% at 0% 0%, #000 10%, transparent 70%)",
};

const SLOW_ZOOM =
  "transition-transform duration-[1400ms] ease-out-expo will-change-transform group-hover/card:scale-[1.04] motion-reduce:group-hover/card:scale-100";

/**
 * Screenshot inside a minimal browser window that bleeds off the bottom of the panel.
 * The ±4% drift is a CSS scroll-driven animation (builds.css) — static where unsupported
 * and under reduced motion, and never measured from JS on scroll.
 */
function BrowserShot({ build }: { build: Build }) {
  const host = hostOf(build.live ?? build.repo);

  return (
    <>
      <span aria-hidden="true" className="absolute inset-0" style={DOT_FIELD} />
      <div className="build-parallax absolute inset-x-[6.5%] top-[8.5%] -bottom-[12%] overflow-hidden rounded-t-[10px] border border-line-strong bg-surface shadow-[var(--shadow-card)]">
        <div className="flex h-7 items-center gap-3 border-b px-3" aria-hidden="true">
          <span className="flex gap-1.5">
            <span className="size-[7px] rounded-full bg-line-strong" />
            <span className="size-[7px] rounded-full bg-line-strong" />
            <span className="size-[7px] rounded-full bg-line-strong" />
          </span>
          <span className="mx-auto flex min-w-0 items-center gap-2 rounded-full border px-3 py-[3px]">
            <span className="size-[6px] shrink-0 rounded-[2px]" style={{ background: build.hue }} />
            <span className="truncate font-mono text-[0.62rem] leading-none tracking-[0.02em] text-muted">{host}</span>
          </span>
          <span className="w-[33px]" />
        </div>
        <div className="relative h-[calc(100%-1.75rem)] overflow-hidden">
          <img
            src={build.image}
            alt={`Screenshot of ${build.name}`}
            width={SHOT_W}
            height={SHOT_H}
            loading="lazy"
            decoding="async"
            className={cn("h-full w-full origin-top object-cover object-top", SLOW_ZOOM)}
          />
          {/* Dark theme: tone bright product UIs down to the observatory palette; full strength on hover/focus */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-bg opacity-[0.16] transition-opacity duration-700 ease-out-expo group-hover/card:opacity-0 group-focus-within/card:opacity-0 [.light_&]:hidden"
          />
        </div>
      </div>
    </>
  );
}

export function FeaturedCard({
  build,
  index,
  total,
  className,
}: {
  build: Build;
  index: number;
  total: number;
  className?: string;
}) {
  const href = build.live ?? build.repo;
  const metrics = build.metrics ?? [];

  return (
    <article
      {...spotlightHandlers}
      className={cn(
        "build-card group/card spotlight @container flex h-full flex-col overflow-hidden rounded-[20px] border bg-surface transition-colors duration-500 hover:border-line-strong",
        className,
      )}
    >
      {/* media — grows to fill when its row partner is taller, so neither card carries a dead void */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Open ${build.name} (opens in a new tab)`}
        data-cursor="Open ↗"
        className="relative m-2 block aspect-[16/10] shrink-0 grow overflow-hidden rounded-[14px] bg-surface-2 md:m-2.5"
      >
        {build.image ? (
          <BrowserShot build={build} />
        ) : (
          <ProjectCover build={build} className={cn("absolute inset-0 origin-center", SLOW_ZOOM)} />
        )}
      </a>

      {/* body */}
      <div className="flex flex-col px-5 pb-5 pt-4 @lg:px-7 @lg:pb-6 @lg:pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="label-mono tabular text-fg">
            {pad(index)}
            <span className="hidden text-subtle @sm:inline" aria-hidden="true">
              {" "}
              / {pad(total)}
            </span>
          </span>
          {build.inBrowser ? (
            <Chip>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-live" />
              Runs in your browser
            </Chip>
          ) : null}
          <span className="label-mono ml-auto tabular text-muted">{build.year}</span>
        </div>

        <div className="mt-6 grid gap-x-10 gap-y-3 @2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-display-md @xl:text-[2.9rem] @xl:leading-[0.98]">{build.name}</h3>
            <p className="text-lede mt-3 max-w-[30ch] text-pretty text-fg">{build.tagline}</p>
          </div>
          <p className="max-w-[58ch] text-[0.94rem] leading-relaxed text-pretty text-muted @2xl:pt-1">{build.summary}</p>
        </div>

        {/* Evidence: the numbers when there are numbers, otherwise the plain-language proof */}
        {metrics.length ? (
          <dl
            className="mt-7 grid border-y"
            style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}
          >
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className={cn("flex min-w-0 flex-col gap-2 py-4", i > 0 ? "border-l pl-4 @lg:pl-5" : "pr-4")}
              >
                <dt className="label-mono order-last text-[0.64rem] leading-[1.4] text-muted">{m.label}</dt>
                <dd className="font-display text-[1.35rem] font-semibold leading-none tracking-[-0.03em] @sm:text-[1.65rem] @md:text-3xl">
                  <Ticker value={m.value} decimals={m.decimals} prefix={m.prefix} suffix={m.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <ul className="mt-7 space-y-2.5 border-t pt-5">
            {build.proof.map((p) => (
              <li key={p} className="flex gap-3 text-[0.92rem] leading-snug text-muted">
                <CheckMark className="mt-[0.28em] size-3 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        {/* stack + actions share one row (they wrap on narrow cards) */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-5",
            metrics.length ? "mt-0" : "mt-6 border-t",
          )}
        >
          <ul className="flex flex-wrap gap-1.5" aria-label={`${build.name} stack`}>
            {build.stack.map((s) => (
              <li key={s}>
                <Chip>{s}</Chip>
              </li>
            ))}
          </ul>
          <div className={cn("flex items-center gap-1", build.live && "-mr-3")}>
            {build.live ? (
              <ButtonLink
                variant="outline"
                href={build.live}
                className="h-10 px-5 text-[0.9rem]"
                aria-label={`${build.name} live demo (opens in a new tab)`}
              >
                Live demo
              </ButtonLink>
            ) : null}
            <ButtonLink
              variant={build.live ? "ghost" : "outline"}
              href={build.repo}
              className={cn("h-10 text-[0.9rem]", build.live ? "px-3" : "px-5")}
              aria-label={`${build.name} source code on GitHub (opens in a new tab)`}
            >
              Code
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
