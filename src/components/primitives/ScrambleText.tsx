import { useCallback, useEffect, useRef } from "react";
import { useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export const ALPHABETS = {
  dna: "ACGT",
  binary: "01",
  glyph: "▖▗▘▙▚▛▜▝▞▟░▒▓",
  latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
} as const;

type Props = {
  text: string;
  className?: string;
  alphabet?: string;
  /** "hover" scrambles when the nearest [data-scramble-host] (or itself) is hovered/focused; "mount" runs once after hydration */
  trigger?: "hover" | "mount";
  duration?: number;
  delay?: number;
};

/**
 * Letters resolve from random glyphs, like tokens sampled at falling temperature.
 * Writes straight to textContent (no React renders). Real text stays in aria-label.
 */
export function ScrambleText({
  text,
  className,
  alphabet = ALPHABETS.latin,
  trigger = "hover",
  duration = 520,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const reduce = useReducedMotionPref();

  const run = useCallback(() => {
    const el = ref.current;
    if (!el || reduce) return;
    cancelAnimationFrame(raf.current);
    const start = performance.now() + delay;
    const chars = [...text];
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const settled = Math.floor(t * chars.length);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (i < settled || c === " ") out += c;
        else out += alphabet[(Math.random() * alphabet.length) | 0];
      }
      el.textContent = out;
      if (t < 1) raf.current = requestAnimationFrame(step);
      else el.textContent = text;
    };
    raf.current = requestAnimationFrame(step);
  }, [text, alphabet, duration, delay, reduce]);

  useEffect(() => {
    if (trigger === "mount") run();
    const el = ref.current;
    if (trigger !== "hover" || !el) return;
    const host = (el.closest("[data-scramble-host]") as HTMLElement | null) ?? el;
    host.addEventListener("pointerenter", run);
    host.addEventListener("focusin", run);
    return () => {
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focusin", run);
      cancelAnimationFrame(raf.current);
    };
  }, [trigger, run]);

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      {/* invisible sizer keeps width stable while glyphs swap */}
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span ref={ref} aria-hidden="true" className="absolute inset-0 whitespace-nowrap">
        {text}
      </span>
    </span>
  );
}
