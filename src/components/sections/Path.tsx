import { m, useScroll } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { TextLink } from "@/components/primitives/Bits";
import { RAIL_PAD, TimelineEntry } from "@/components/path/TimelineEntry";
import { Recognition } from "@/components/path/Recognition";
import { useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { path, pathIntro, profile } from "@/content/site";
import "@/components/path/rail.css";

const FILL = "absolute inset-0 origin-top bg-accent";

/**
 * Fallback for browsers without CSS scroll-driven animations: motion measures
 * the rail on scroll and draws the tip to the same 60% line. Mounted only
 * after a feature check, so supporting browsers run no per-frame JS here.
 */
function MotionRailFill({ target, reduce }: { target: RefObject<HTMLDivElement>; reduce: boolean }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start 0.6", "end 0.6"] });
  return <m.span className={FILL} style={{ scaleY: reduce ? 1 : scrollYProgress }} />;
}

export function Path() {
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  // false in the prerender and the hydration pass (the CSS rail renders), flips only where unsupported
  const [motionRail, setMotionRail] = useState(false);

  useEffect(() => {
    const supported = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    if (!supported) setMotionRail(true);
  }, []);

  return (
    <section id="path" aria-labelledby="path-title" className="container-page section-pad">
      <SectionHeader
        index="04"
        label="Path"
        headingId="path-title"
        title={[{ text: pathIntro.title }, { br: true }, { text: pathIntro.emphasis, em: true }]}
        intro={pathIntro.body}
      />

      <div ref={railRef} className="path-rail relative">
        {/* rail: hairline base + accent progress, from the first node to the terminal node */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[7px] left-[5px] top-[7px] w-px bg-line print:hidden"
        >
          {motionRail ? <MotionRailFill target={railRef} reduce={reduce} /> : <span className={cn("path-rail-fill", FILL)} />}
        </span>

        <ol>
          {path.map((entry) => (
            <TimelineEntry key={`${entry.role}-${entry.org}`} entry={entry} forceActive={reduce} />
          ))}
        </ol>

        {/* terminal node: the rest lives in the full CV */}
        <p className={cn("label-mono relative mt-16 flex items-center text-muted md:mt-24", RAIL_PAD)}>
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 size-[11px] -translate-y-1/2 rounded-full border border-line-strong bg-bg print:hidden"
          />
          <span>
            Continued in the{" "}
            <TextLink href={profile.links.cv} className="text-fg">
              full CV
            </TextLink>
          </span>
        </p>
      </div>

      <Recognition />
    </section>
  );
}
