import { cn } from "@/lib/cn";

/** Faint dot-grid that fades out toward the card edges. Decorative. */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-image:radial-gradient(circle,var(--line-strong)_1px,transparent_1.3px)] [background-position:center] [background-size:18px_18px]",
        "[mask-image:radial-gradient(ellipse_70%_65%_at_50%_50%,#000_25%,transparent_100%)]",
        className,
      )}
    />
  );
}

/** Viewfinder corner ticks around a figure. Decorative. */
export function CornerTicks({ className }: { className?: string }) {
  const tick = "absolute size-2.5 border-line-strong";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <span className={cn(tick, "left-0 top-0 border-l border-t")} />
      <span className={cn(tick, "right-0 top-0 border-r border-t")} />
      <span className={cn(tick, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(tick, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
