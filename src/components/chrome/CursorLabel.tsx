import { m, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/components/primitives/Reveal";
import { useFinePointer, useReducedMotionPref } from "@/lib/hooks";

/**
 * A small pill that trails the pointer over anything marked `data-cursor="Label"`.
 * Mouse/trackpad only, off for reduced motion. The native cursor stays.
 */
export function CursorLabel() {
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  if (!fine || reduce) return null;
  return <Follower />;
}

const OFFSET = 16;
/** fallback for browsers without `scrollend` (and native scrolls Lenis doesn't report) */
const SETTLE_MS = 140;

function Follower() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 560, damping: 44, mass: 0.45 });
  const sy = useSpring(y, { stiffness: 560, damping: 44, mass: 0.45 });

  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const current = useRef<string | null>(null);

  useEffect(() => {
    let placed = false;
    let inside = false;
    let stale = false;
    let settle = 0;
    let lx = 0;
    let ly = 0;

    const update = (target: Element | null) => {
      const host = target && typeof target.closest === "function" ? target.closest("[data-cursor]") : null;
      const next = host?.getAttribute("data-cursor") || null;
      if (next === current.current) return;
      current.current = next;
      setVisible(!!next);
      if (next) setText(next);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lx = e.clientX;
      ly = e.clientY;
      x.set(lx + OFFSET);
      y.set(ly + OFFSET);
      if (!placed) {
        sx.jump(lx + OFFSET);
        sy.jump(ly + OFFSET);
        placed = true;
      }
      inside = true;
      stale = false;
      update(e.target as Element | null);
    };

    // one hit-test once the page has come to rest — never per scroll frame,
    // where it would force a layout right after Lenis and motion wrote styles
    const recheck = () => {
      window.clearTimeout(settle);
      settle = 0;
      if (!stale) return;
      stale = false;
      if (inside) update(document.elementFromPoint(lx, ly));
    };

    // content slides under a still pointer while scrolling: hide the label once
    const onScroll = () => {
      if (!placed) return;
      stale = true;
      if (current.current !== null) {
        current.current = null;
        setVisible(false);
      }
      window.clearTimeout(settle);
      settle = window.setTimeout(recheck, SETTLE_MS);
    };

    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      inside = false;
      update(null);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    // native scrollend, plus the CustomEvent Lenis dispatches when a smooth scroll lands
    window.addEventListener("scrollend", recheck);
    document.addEventListener("pointerout", onOut);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", recheck);
      document.removeEventListener("pointerout", onOut);
    };
  }, [x, y, sx, sy]);

  return (
    <m.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[170]" style={{ x: sx, y: sy }}>
      <m.div
        initial={false}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.5 }}
        transition={{ duration: visible ? 0.32 : 0.2, ease: EASE_OUT }}
        style={{ transformOrigin: "0% 0%" }}
        className="label-mono whitespace-nowrap rounded-full bg-fg px-3 py-1.5 text-[0.66rem] text-bg"
      >
        {text}
      </m.div>
    </m.div>
  );
}
