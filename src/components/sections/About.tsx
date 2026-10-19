import type { ReactNode } from "react";
import { modelCard, profile, receipts, stack } from "@/content/site";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Chip, LiveDot } from "@/components/primitives/Bits";
import { Ticker } from "@/components/primitives/Ticker";
import { Tile, TileHead } from "@/components/about/Tile";
import { HalftonePortrait } from "@/components/about/HalftonePortrait";
import { DhakaClock } from "@/components/about/DhakaClock";
import { cn } from "@/lib/cn";

function SpecRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6 md:py-[1.1rem] xl:grid-cols-[10.5rem_minmax(0,1fr)]">
      <dt className="label-mono pt-[0.32em] text-muted">{k}</dt>
      <dd className="min-w-0 text-[1rem] leading-snug text-fg">{children}</dd>
    </div>
  );
}

const stackCount = stack.reduce((n, g) => n + g.items.length, 0);

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="container-page section-pad">
      <SectionHeader
        index="05"
        label="About"
        headingId="about-title"
        title={[{ text: "Every model needs a" }, { text: "model card.", em: true }]}
        intro="Here is mine — what I’m built for, what I’m good at, and a few known quirks."
      />

      {/* phones: one shrinkable column · md: portrait beside Now + clock, the card full width · lg: 12-col bento */}
      <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-6 md:gap-4 lg:grid-cols-12">
        {/* 1 — portrait */}
        <Tile
          className={cn(
            "relative overflow-hidden p-0 md:p-0",
            "aspect-[4/5] md:col-span-3 md:col-start-1 md:row-span-2 md:row-start-1 md:aspect-auto md:min-h-[520px]",
            "lg:col-span-5 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:min-h-0",
          )}
        >
          <figure className="absolute inset-0 m-0">
            <HalftonePortrait />
            {/* the location drops under the name when the tile is too narrow for both */}
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t bg-surface px-5 py-4 md:px-6">
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-fg">
                  {profile.name}
                </span>
                <span lang="bn" className="mt-0.5 block font-bangla text-[0.95rem] leading-snug text-muted">
                  {profile.bangla.first} {profile.bangla.last}
                </span>
              </span>
              <span className="label-mono shrink-0 pb-1 text-right text-muted">{profile.location}</span>
            </figcaption>
          </figure>
        </Tile>

        {/* 2 — model card */}
        <Tile
          delay={0.06}
          className="md:col-span-6 md:col-start-1 md:row-start-3 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1"
        >
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b pb-5">
            <div className="min-w-0">
              <h3 className="label-mono text-muted">Model card</h3>
              <p className="mt-3 font-mono [overflow-wrap:anywhere] text-[clamp(1rem,1.5vw,1.2rem)] leading-tight tracking-[-0.01em] text-fg">
                <span className="text-muted">model:</span> {modelCard.model}
              </p>
            </div>
            <div className="flex gap-2">
              <Chip>research</Chip>
              <Chip>engineering</Chip>
            </div>
          </div>
          <dl className="divide-y">
            <SpecRow k="Architecture">{modelCard.architecture}</SpecRow>
            <SpecRow k="Training data">{modelCard.training}</SpecRow>
            <SpecRow k="Intended use">
              <span className="flex flex-wrap gap-1.5">
                {modelCard.intendedUse.map((u) => (
                  <Chip key={u} className="whitespace-normal text-left text-fg">
                    {u}
                  </Chip>
                ))}
              </span>
            </SpecRow>
            <SpecRow k="Strengths">
              <ul className="space-y-1.5">
                {modelCard.strengths.map((s) => (
                  <li key={s} className="flex gap-3">
                    <span aria-hidden="true" className="font-mono text-muted">
                      +
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </SpecRow>
            <SpecRow k="Known limitations">
              <ul className="space-y-1">
                {modelCard.limitations.map((s) => (
                  <li key={s} className="flex gap-3">
                    <span aria-hidden="true" className="font-mono text-[1rem] text-muted">
                      −
                    </span>
                    <span className="em-serif text-[1.3rem] leading-[1.2]">{s}</span>
                  </li>
                ))}
              </ul>
            </SpecRow>
          </dl>
        </Tile>

        {/* 3 — now */}
        <Tile
          delay={0.1}
          className="md:col-span-3 md:col-start-4 md:row-start-1 lg:col-span-4 lg:col-start-6 lg:row-start-3 lg:p-6 xl:p-8"
        >
          <TileHead
            title={
              <>
                <LiveDot />
                <span className="text-fg">Now</span>
              </>
            }
            meta={profile.updated}
          />
          <dl className="mt-5 divide-y">
            {modelCard.now.map((n) => (
              <div key={n.label} className="py-3 first:pt-0 last:pb-0">
                <dt className="label-mono text-muted">{n.label}</dt>
                <dd className="mt-1.5 text-[0.98rem] leading-snug text-fg">{n.value}</dd>
              </div>
            ))}
          </dl>
        </Tile>

        {/* 4 — clock */}
        <Tile
          delay={0.14}
          className="md:col-span-3 md:col-start-4 md:row-start-2 lg:col-span-3 lg:col-start-10 lg:row-start-3 lg:p-6 xl:p-8"
        >
          <DhakaClock />
        </Tile>

        {/* 5 — receipts */}
        <Tile delay={0.06} className="md:col-span-6 lg:col-span-7 lg:col-start-1 lg:row-start-4">
          <TileHead title="Receipts" meta="From Crossref & the CV" />
          <dl className="mt-7 grid grid-cols-[repeat(2,minmax(0,1fr))] md:grid-cols-[repeat(4,minmax(0,1fr))] lg:grid-cols-[repeat(2,minmax(0,1fr))]">
            {receipts.map((m, i) => (
              <div
                key={m.label}
                className={cn(
                  "flex flex-col-reverse justify-end gap-2.5",
                  i < 2 ? "pb-6 md:pb-0 lg:pb-6" : "border-t pt-6 md:border-t-0 md:pt-0 lg:border-t lg:pt-6",
                  i % 2 === 1 && "border-l pl-5 sm:pl-6",
                  i === 2 && "md:border-l md:pl-6 lg:border-l-0 lg:pl-0",
                )}
              >
                <dt className="text-[0.92rem] leading-snug text-muted">{m.label}</dt>
                <dd className="font-display text-[clamp(2.4rem,12vw,3rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-fg md:text-[clamp(3rem,5vw,4.5rem)]">
                  <Ticker value={m.value} decimals={m.decimals} prefix={m.prefix} suffix={m.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </Tile>

        {/* 6 — stack */}
        <Tile delay={0.1} className="md:col-span-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-4">
          <TileHead title="Stack" meta={`${stackCount} tools & methods`} />
          {/* subgrid rows keep every group's rule on one line when a label wraps */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:grid-cols-2">
            {stack.map((g) => (
              <div key={g.group} className="row-span-2 grid grid-rows-subgrid gap-y-0">
                <p className="label-mono mb-3 self-end border-b pb-3 text-muted">{g.group}</p>
                <ul className="space-y-1">
                  {g.items.map((it) => (
                    <li key={it} className="font-display text-[1.05rem] leading-snug tracking-[-0.015em] text-fg md:text-lg">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Tile>

        {/* 7 — motto */}
        <Tile
          delay={0.06}
          className="flex flex-col justify-between gap-8 md:col-span-6 lg:col-span-7 lg:col-start-1 lg:row-start-5"
        >
          <TileHead title="Motto" />
          <figure className="m-0">
            <blockquote className="em-serif text-3xl leading-[1.08] text-fg md:text-[2.6rem]">
              <p className="[text-wrap:balance]">{profile.motto}</p>
            </blockquote>
            <figcaption className="label-mono mt-5 text-muted">— GitHub bio</figcaption>
          </figure>
        </Tile>
      </div>
    </section>
  );
}
