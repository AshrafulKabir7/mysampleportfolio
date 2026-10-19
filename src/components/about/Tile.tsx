import type { ReactNode } from "react";
import { Reveal } from "@/components/primitives/Reveal";
import { spotlightHandlers } from "@/components/primitives/Bits";
import { cn } from "@/lib/cn";

/** One bento tile: hairline card on the raised surface, pointer spotlight, fade-rise on view. */
export function Tile({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal
      y={28}
      amount={0.12}
      delay={delay}
      className={cn("spotlight min-w-0 rounded-[20px] border bg-surface p-6 md:p-8", className)}
      {...spotlightHandlers}
    >
      {children}
    </Reveal>
  );
}

/** Tile title row: mono label on the left, optional meta on the right */
export function TileHead({ title, meta, className }: { title: ReactNode; meta?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-1", className)}>
      <h3 className="label-mono flex items-center gap-2.5 text-muted">{title}</h3>
      {meta ? <span className="label-mono text-muted">{meta}</span> : null}
    </div>
  );
}
