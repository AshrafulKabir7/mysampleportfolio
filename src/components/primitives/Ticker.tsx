import { animate, useInView } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import type { Metric } from "@/content/site";

const formatters = new Map<number, Intl.NumberFormat>();
function formatter(decimals: number) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f;
}

/**
 * Counts up to a real number the first time it scrolls into view.
 * Prerendered HTML holds the final value, so crawlers and no-JS readers see the truth.
 */
export function Ticker({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 1.1,
}: Omit<Metric, "label"> & { className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduce = useReducedMotionPref();
  const fmt = useMemo(() => formatter(decimals), [decimals]);
  const final = `${prefix}${fmt.format(value)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        // snap the long easing tail so no near-miss value (e.g. 0.793 for 0.794) lingers on screen
        el.textContent = v >= value * 0.995 ? final : `${prefix}${fmt.format(v)}${suffix}`;
      },
      onComplete: () => {
        el.textContent = final;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, prefix, suffix, fmt, duration, final]);

  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}
