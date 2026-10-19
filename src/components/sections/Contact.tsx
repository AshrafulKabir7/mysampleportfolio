import { useInView } from "motion/react";
import { useRef } from "react";
import { profile } from "@/content/site";
import { Reveal, RevealText } from "@/components/primitives/Reveal";
import { ButtonLink, LiveDot, TextLink } from "@/components/primitives/Bits";
import { EmailCopy } from "@/components/contact/EmailCopy";

const ELSEWHERE = [
  { label: "GitHub", href: profile.links.github },
  { label: "LinkedIn", href: profile.links.linkedin },
  { label: "ORCID", href: profile.links.orcid },
  { label: "CV", href: profile.links.cv },
];

export function Contact() {
  // Observe an unclipped wrapper, then (re)mount the heading in "onMount" mode so the
  // masked words always rise — even if the words themselves are clipped from the observer.
  const headRef = useRef<HTMLDivElement>(null);
  const headIn = useInView(headRef, { once: true, amount: 0.35 });

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="container-page section-pad"
      // the footer wordmark follows directly, so close the section a little tighter
      style={{ paddingBottom: "clamp(56px, 7vw, 112px)" }}
    >
      <Reveal y={12} className="mb-10 flex items-center gap-4 text-muted md:mb-14">
        <span className="label-mono text-accent">§06</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="label-mono">Contact</span>
      </Reveal>

      <div ref={headRef}>
        <RevealText
          key={headIn ? "in" : "out"}
          onMount={headIn}
          as="h2"
          id="contact-title"
          segments={[{ text: "Let’s find the" }, { text: "signal", em: true, accent: true }, { text: "together." }]}
          stagger={0.07}
          className="max-w-[12ch] font-display text-[clamp(3rem,9vw,9.5rem)] font-semibold leading-[0.9] tracking-[-0.045em]"
        />
      </div>

      <Reveal delay={0.2} className="mt-10 flex items-start gap-3 md:mt-14 md:items-center">
        <LiveDot className="mt-[0.55em] md:mt-0" />
        <p className="text-[1.05rem] leading-snug text-fg md:text-lede">{profile.status}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-14 border-y py-8 md:mt-20 md:py-12">
        <EmailCopy />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 md:mt-8">
          <TextLink href={`mailto:${profile.email}`} className="label-mono text-muted hover:text-fg">
            Open mail app
          </TextLink>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex flex-col gap-5 md:mt-10 md:flex-row md:items-center md:justify-between">
        <p className="label-mono text-muted">Elsewhere</p>
        <ul className="flex flex-wrap gap-2.5 md:gap-3">
          {ELSEWHERE.map((l) => (
            <li key={l.label}>
              <ButtonLink href={l.href} variant="outline" magnetic data-cursor="Open">
                {l.label}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
