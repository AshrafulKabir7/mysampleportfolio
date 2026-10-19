import { m, useMotionValue, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useFinePointer, useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";

/**
 * Pulls its child gently toward the pointer. Mouse/trackpad only; inert on
 * touch, keyboard and reduced-motion. Writes to motion values — no re-renders.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const ref = useRef<HTMLSpanElement>(null);
  const rect = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const active = fine && !reduce;

  return (
    <m.span
      ref={ref}
      className={cn("inline-flex", className)}
      style={active ? { x: sx, y: sy } : undefined}
      onPointerEnter={() => {
        if (active && ref.current) rect.current = ref.current.getBoundingClientRect();
      }}
      onPointerMove={(e) => {
        const r = rect.current;
        if (!active || !r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.span>
  );
}
