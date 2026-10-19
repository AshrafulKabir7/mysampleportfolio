import { createRef, useMemo } from "react";
import { researchIntro, threads } from "@/content/site";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { useMediaQuery, useMounted, useReducedMotionPref } from "@/lib/hooks";
import { ResearchStage } from "@/components/research/ResearchStage";
import { ThreadArticle } from "@/components/research/ThreadArticle";
import { SideExperiments } from "@/components/research/SideExperiments";
import { useActiveThread } from "@/components/research/useActiveThread";

/**
 * §01 Research — a pinned scrollytelling moment.
 * lg+: a sticky stage on the left swaps each thread's figure as its article
 * crosses the viewport centre. Below lg: each article carries its own figure.
 * Every word (and every figure description) is in the prerendered HTML; the
 * figures themselves mount client-side, and only the copy that can be seen.
 */
export function Research() {
  const refs = useMemo(() => threads.map(() => createRef<HTMLElement>()), []);
  const active = useActiveThread(refs, threads[0].id);
  // server value false → during hydration these read false, then flip; everything
  // below is derived in render, so a flip simply re-renders (no effects to undo)
  const isLg = useMediaQuery("(min-width: 1024px)", false);
  const reduce = useReducedMotionPref();
  const moreContrast = useMediaQuery("(prefers-contrast: more)", false);
  const mounted = useMounted();
  const canDim = mounted && isLg && !reduce && !moreContrast;

  return (
    <section id="research" aria-labelledby="research-title" className="container-page section-pad">
      <SectionHeader
        index="01"
        label="Research"
        headingId="research-title"
        title={[
          { text: "Four threads," },
          { br: true },
          { text: "one question:" },
          { text: "can you trust it?", em: true },
        ]}
        intro={researchIntro.body}
      />

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="hidden [container-type:inline-size] lg:col-span-5 lg:block">
          <ResearchStage active={active} articleRefs={refs} showFigure={mounted && isLg} />
        </div>
        <div className="flex flex-col gap-24 md:gap-32 lg:col-span-7 lg:gap-0">
          {threads.map((t, i) => (
            <ThreadArticle
              key={t.id}
              thread={t}
              articleRef={refs[i]}
              first={i === 0}
              active={mounted && active === t.id}
              dim={canDim && active !== t.id}
              showFigure={mounted && !isLg}
            />
          ))}
        </div>
      </div>

      <SideExperiments />
    </section>
  );
}
