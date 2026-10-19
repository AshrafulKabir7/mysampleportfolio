import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Mark = { match: string; kind: "faint" | "stakes" };

const MARKS: Mark[] = [
  { match: "faint", kind: "faint" },
  { match: "stakes are high", kind: "stakes" },
];

const INK: CSSProperties = {
  backgroundImage: "radial-gradient(circle, var(--accent) 0 1.1px, transparent 1.6px)",
  backgroundSize: "6px 100%",
  backgroundRepeat: "repeat-x",
  backgroundPosition: "0 50%",
};

/**
 * The thesis line with two typographic moments: "faint" is set literally faint
 * (serif italic, muted) and "stakes are high" gets a halftone underline that
 * prints in after the entrance. Falls back to plain text if the copy changes.
 *
 * The entrance is CSS (.hero-rise, translate only — this is an LCP candidate,
 * so it paints at first contentful paint and never waits for JavaScript).
 */
export function Thesis({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const parts: ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (const m of MARKS) {
    const at = rest.indexOf(m.match);
    if (at < 0) continue;
    if (at > 0) parts.push(rest.slice(0, at));
    parts.push(
      m.kind === "faint" ? (
        <span key={key++} className="em-serif pr-[0.04em] text-muted">
          {m.match}
        </span>
      ) : (
        <span key={key++} className="relative whitespace-nowrap">
          {m.match}
          <span
            aria-hidden="true"
            className="hero-ink absolute inset-x-0 -bottom-[0.1em] h-[0.16em]"
            style={{ ...INK, "--hd": `${delay + 0.75}s` } as CSSProperties}
          />
        </span>
      ),
    );
    rest = rest.slice(at + m.match.length);
  }
  if (rest) parts.push(rest);

  return (
    <p
      data-text-edge=""
      data-text-top=""
      className={cn(
        "hero-rise font-display text-[clamp(1.45rem,6.2vw,1.7rem)] font-medium leading-[1.06] tracking-[-0.03em] text-fg md:text-[clamp(1.7rem,2.6vw,2.45rem)]",
        className,
      )}
      style={{ "--hd": `${delay}s`, "--hy": "22px" } as CSSProperties}
    >
      {parts}
    </p>
  );
}
