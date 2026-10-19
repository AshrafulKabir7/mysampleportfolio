import { m } from "motion/react";
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import type { ThreadId } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * The four figures live in their own chunk and never reach the prerendered
 * HTML: the frames around them are fixed-size, so nothing shifts when they
 * arrive. Only ever rendered client-side (parents gate on `useMounted`), so
 * the lazy component never meets renderToString.
 */
let loaded = false;
const ThreadVisual = lazy(() =>
  import("./visuals").then((mod) => {
    loaded = true;
    return { default: mod.ThreadVisual };
  }),
);

/** Label scale from rendered width: ≥ 10.5 CSS px labels down to ~290 px; tidier labels below 360 px */
function scaleFor(w: number) {
  const k = Math.min(1.45, Math.max(1, (10.5 * 600) / (15 * w)));
  return { k: Math.round(k * 20) / 20, compact: w < 360 };
}

type Props = { id: ThreadId; active: boolean; className?: string };

export function LazyVisual({ id, active, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  // fade in only when the chunk arrives; later swaps (stage wipe) bring their own motion
  const [fade] = useState(() => !loaded);

  // layout size (offsetWidth ignores the stage's scale transforms); measured before paint
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const next = Math.round(el.offsetWidth / 4) * 4;
      setW((prev) => (prev === next ? prev : next));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { k, compact } = scaleFor(w || 420);

  return (
    <div ref={ref} className={cn("size-full", className)}>
      {w ? (
        <Suspense fallback={null}>
          <m.div
            className="size-full"
            initial={fade ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ThreadVisual id={id} active={active} k={k} compact={compact} className="size-full" />
          </m.div>
        </Suspense>
      ) : null}
    </div>
  );
}
