import { AnimatePresence, m } from "motion/react";
import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { PaperRow } from "@/components/papers/PaperRow";
import { pad2, StatusFilter, type FilterKey } from "@/components/papers/StatusFilter";
import { papers, papersIntro } from "@/content/site";

const LIST_ID = "papers-list";

const COUNTS: Record<FilterKey, number> = {
  All: papers.length,
  Published: papers.filter((p) => p.status === "Published").length,
  Submitted: papers.filter((p) => p.status === "Submitted").length,
  "In preparation": papers.filter((p) => p.status === "In preparation").length,
};

export function Papers() {
  const [filter, setFilter] = useState<FilterKey>("All");
  const visible = useMemo(
    () => (filter === "All" ? papers : papers.filter((p) => p.status === filter)),
    [filter],
  );

  return (
    <section id="papers" aria-labelledby="papers-title" className="container-page section-pad">
      <SectionHeader
        index="03"
        label="Publications"
        headingId="papers-title"
        title={[{ text: papersIntro.title }, { text: papersIntro.emphasis, em: true }]}
        intro={papersIntro.body}
      />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-10">
        <StatusFilter value={filter} counts={COUNTS} onChange={setFilter} controls={LIST_ID} />
        <p aria-live="polite" className="label-mono text-muted tabular">
          <span aria-hidden="true">
            Showing {pad2(visible.length)} / {pad2(papers.length)}
          </span>
          <span className="sr-only">
            Showing {visible.length} of {papers.length} papers
          </span>
        </p>
      </div>

      <ol id={LIST_ID} className="relative border-b border-line">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p) => (
            <PaperRow key={p.title} paper={p} index={papers.indexOf(p)} />
          ))}
        </AnimatePresence>
      </ol>

      <m.p layout="position" className="label-mono mt-8 leading-relaxed text-muted [text-wrap:pretty] md:mt-10">
        Statuses as of Oct&nbsp;2026&nbsp;· submitted manuscripts available on request
      </m.p>
    </section>
  );
}
