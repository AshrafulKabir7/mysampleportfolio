import { useEffect, useRef, useState, type CSSProperties } from "react";
import { profile } from "@/content/site";
import { cn } from "@/lib/cn";

/*
 * The name, with a Bangla rendering behind it. A real toggle button (aria-pressed)
 * crossfades both lines; on a mouse, hovering a line previews that line alone.
 * The Bangla copy is an absolutely positioned overlay, so layout never shifts,
 * and the heading's accessible name stays English.
 *
 * The entrance is CSS (.hero-line, from index.css): the lines rise inside an
 * overflow mask in the prerendered markup, before any JavaScript runs.
 */
const SWAP = "transition-[opacity,filter,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";

const EN_OUT = cn(
  "group-hover/line:-translate-y-[0.12em] group-hover/line:opacity-0 group-hover/line:blur-[6px]",
  "group-data-[bn=true]/name:-translate-y-[0.12em] group-data-[bn=true]/name:opacity-0 group-data-[bn=true]/name:blur-[6px]",
);

const BN_IN = cn(
  "translate-y-[0.12em] opacity-0 blur-[6px]",
  "group-hover/line:translate-y-0 group-hover/line:opacity-100 group-hover/line:blur-[0px]",
  "group-data-[bn=true]/name:translate-y-0 group-data-[bn=true]/name:opacity-100 group-data-[bn=true]/name:blur-[0px]",
);

const LINES = [
  { en: profile.first, bn: profile.bangla.first },
  { en: profile.last, bn: profile.bangla.last },
];

/** phones: oversized against the thesis; tablets in portrait: fill the width; landscape:
 *  bounded by height too, so short laptops keep the fact bar in the first screen */
const SIZE =
  "max-md:text-[17.5vw] md:portrait:text-[14.5vw] md:landscape:text-[clamp(3.3rem,min(12.4vw,37svh_-_150px),13.5rem)]";

/** seconds; the first line starts with the status row, the second follows */
const LINE_DELAY = (i: number) => 0.06 + i * 0.12;

export function HeroName({ className }: { className?: string }) {
  const [bangla, setBangla] = useState(false);
  // the masks clip only while the lines rise; afterwards Bangla matras may overflow
  const [entered, setEntered] = useState(false);
  const lastLine = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = lastLine.current;
    if (!el || typeof el.getAnimations !== "function") {
      setEntered(true);
      return;
    }
    // no running entrance (reduced motion, paused motion, already played) → unclip now
    const anims = el.getAnimations();
    if (!anims.length) {
      setEntered(true);
      return;
    }
    let live = true;
    const done = () => live && setEntered(true);
    Promise.all(anims.map((a) => a.finished)).then(done, done);
    return () => {
      live = false;
    };
  }, []);

  return (
    // the wrapper carries the name's font size, so the toggle can be placed in em of the name
    <div className={cn("relative w-fit", SIZE, className)}>
      <h1
        aria-label={profile.name}
        data-text-edge=""
        data-name=""
        data-bn={bangla ? "true" : "false"}
        className={cn("group/name text-display-xl -ml-[0.04em] w-fit", SIZE)}
      >
        {LINES.map((line, i) => (
          <span
            key={line.en}
            className={cn("-mb-[0.12em] block pb-[0.12em]", entered ? "overflow-visible" : "overflow-hidden")}
          >
            <span
              ref={i === LINES.length - 1 ? lastLine : undefined}
              className="hero-line group/line relative block w-fit"
              style={{ "--hd": `${LINE_DELAY(i)}s` } as CSSProperties}
            >
              <span aria-hidden="true" className={cn("block whitespace-nowrap", SWAP, EN_OUT)}>
                {line.en}
              </span>
              <span
                aria-hidden="true"
                lang="bn"
                className={cn(
                  // narrower than the English on phones, where the toggle sits right after line 2
                  "font-bangla pointer-events-none absolute left-[0.01em] top-[0.12em] whitespace-nowrap text-[0.7em] font-semibold tracking-[-0.005em] max-md:text-[0.62em]",
                  SWAP,
                  BN_IN,
                  i > 0 && "group-data-[bn=true]/name:delay-100",
                )}
              >
                {line.bn}
              </span>
            </span>
          </span>
        ))}
      </h1>

      {/* Phones: on the baseline after line 2. Wider screens: on the baseline of line 1,
          past the end of line 2 — clear of both the English and the (wider) Bangla. */}
      <span className="absolute left-full top-[calc(1.6em-2rem)] ml-3 flex leading-none md:top-[calc(0.74em-2rem)] md:ml-[0.16em]">
        <button
          type="button"
          aria-pressed={bangla}
          data-field-hole=""
          onClick={() => setBangla((v) => !v)}
          className={cn(
            "hero-in group/bn inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 max-md:px-2.5",
            "border-line-strong bg-bg/60 text-muted transition-[background-color,color,border-color] duration-300",
            "hover:border-fg hover:text-fg",
            "aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg",
          )}
          style={{ "--hd": "0.5s", "--hy": "8px" } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full border border-current transition-colors duration-300 group-aria-pressed/bn:bg-current max-md:hidden"
          />
          <span lang="bn" className="font-bangla text-[0.92rem] font-medium leading-none">
            বাংলা
          </span>
          <span className="sr-only"> — show name in Bangla</span>
        </button>
      </span>
    </div>
  );
}
