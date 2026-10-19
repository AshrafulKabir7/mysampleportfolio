import { m } from "motion/react";
import { Check, Copy, Plus } from "lucide-react";
import { forwardRef, Fragment, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Chip, TextLink } from "@/components/primitives/Bits";
import { EASE_OUT } from "@/components/primitives/Reveal";
import { riseClass, useRise } from "@/components/path/useRise";
import { copyText } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { profile, type Paper, type PaperStatus } from "@/content/site";
import { pad2 } from "./StatusFilter";

function StatusChip({ status }: { status: PaperStatus }) {
  if (status === "Published") return <Chip tone="solid">{status}</Chip>;
  if (status === "In preparation") return <Chip className="border-dashed">{status}</Chip>;
  return <Chip>{status}</Chip>;
}

/** "Md. Ashraful Kabir Alif" (any honorific prefix) is the site owner */
const isSelf = (author: string) => author.endsWith(profile.name);

type Props = { paper: Paper; index: number };

/**
 * One publication. A motion <li> so the filter can animate it in/out and
 * slide siblings (position-only layout, so expanding "Cite" never scales it).
 */
export const PaperRow = forwardRef<HTMLLIElement, Props>(function PaperRow({ paper, index }, ref) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  const panelId = useId();
  const [riseRef, rise] = useRise<HTMLDivElement>();

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const onCopy = async () => {
    if (!paper.bibtex) return;
    const ok = await copyText(paper.bibtex);
    if (ok) {
      toast("BibTeX copied");
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast("Couldn’t reach the clipboard — open Cite and select the text");
      setOpen(true);
    }
  };

  const hasActions = paper.links.length > 0 || Boolean(paper.bibtex);

  return (
    <m.li
      ref={ref}
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="group relative border-t border-line print:break-inside-avoid"
    >
      {/* accent rule: draws down on hover / keyboard focus inside the row */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-3 bottom-8 top-8 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-500 ease-out-expo group-focus-within:scale-y-100 group-hover:scale-y-100 md:-left-6 md:bottom-11 md:top-11"
      />

      <div
        ref={riseRef}
        className={cn(
          "grid gap-5 py-8 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10 md:py-11 lg:grid-cols-[10rem_minmax(0,1fr)_3rem]",
          riseClass(rise),
        )}
        style={rise === "shown" ? { transitionDelay: `${Math.min(index, 4) * 70}ms` } : undefined}
      >
        {/* meta column */}
        <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
          <span className="font-display text-2xl font-medium leading-none tracking-[-0.02em] tabular">
            {paper.year}
          </span>
          <StatusChip status={paper.status} />
        </div>

        {/* main column */}
        <div className="min-w-0">
          <h3 className="max-w-4xl font-display text-xl font-medium leading-tight tracking-[-0.02em] text-balance transition-transform duration-500 ease-out-expo group-focus-within:translate-x-1 group-hover:translate-x-1 md:text-2xl">
            {paper.title}
          </h3>

          {paper.authors?.length ? (
            <p className="mt-4 max-w-4xl text-[0.95rem] leading-relaxed text-muted">
              <span className="sr-only">Authors: </span>
              {paper.authors.map((a, i) => (
                <Fragment key={a}>
                  {isSelf(a) ? (
                    <span className="whitespace-nowrap font-medium text-fg underline decoration-accent/70 decoration-1 underline-offset-[5px]">
                      {a}
                    </span>
                  ) : (
                    <span className="whitespace-nowrap">{a}</span>
                  )}
                  {i < paper.authors!.length - 1 ? ", " : null}
                </Fragment>
              ))}
            </p>
          ) : null}

          {paper.venue ? <p className="em-serif mt-2 text-lg leading-snug text-fg md:text-xl">{paper.venue}</p> : null}

          <p className="mt-3 max-w-[64ch] text-muted">{paper.tldr}</p>

          {hasActions ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
              {paper.links.map((l) => (
                <TextLink key={l.href} href={l.href} className="label-mono text-fg">
                  {l.label}
                  <span className="sr-only"> — {paper.title}</span>
                </TextLink>
              ))}
              {paper.bibtex ? (
                <>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="label-mono inline-flex items-center gap-1.5 pb-0.5 text-muted transition-colors hover:text-fg"
                  >
                    {copied ? (
                      <Check aria-hidden="true" className="size-3.5 text-fg" />
                    ) : (
                      <Copy aria-hidden="true" className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy BibTeX"}
                  </button>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen((v) => !v)}
                    className="label-mono inline-flex items-center gap-1.5 pb-0.5 text-muted transition-colors hover:text-fg aria-expanded:text-fg"
                  >
                    <Plus
                      aria-hidden="true"
                      className={cn("size-3.5 transition-transform duration-300 ease-out-expo", open && "rotate-45")}
                    />
                    Cite
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          {paper.bibtex ? (
            <div
              id={panelId}
              role="region"
              aria-label={`BibTeX for “${paper.title}”`}
              className={cn(
                "grid transition-[grid-template-rows,visibility] duration-500 ease-out-expo",
                open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <pre
                  tabIndex={open ? 0 : -1}
                  className="mt-5 max-w-4xl overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-fg/90 md:p-5"
                >
                  <code>{paper.bibtex}</code>
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        {/* catalogue number, decorative */}
        <span aria-hidden="true" className="label-mono hidden pt-1.5 text-right text-subtle tabular lg:block">
          {pad2(index + 1)}
        </span>
      </div>
    </m.li>
  );
});
