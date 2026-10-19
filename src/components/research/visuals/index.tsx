import { useMemo } from "react";
import type { ThreadId } from "@/content/site";
import { ExoplanetVisual } from "./ExoplanetVisual";
import { RenalVisual } from "./RenalVisual";
import { SepsisVisual } from "./SepsisVisual";
import { GenomeVisual } from "./GenomeVisual";
import { ScaleContext } from "./shared";

export { ExoplanetVisual, RenalVisual, SepsisVisual, GenomeVisual };

export type ThreadVisualProps = {
  id: ThreadId;
  active: boolean;
  className?: string;
  /** label scale for the rendered size (see shared.tsx · FigureScale) */
  k?: number;
  /** hide the least important labels on small renders */
  compact?: boolean;
};

/**
 * The research section's figures, one per thread. Each is a 600 × 600 SVG that
 * fills its container, flips with the theme, loops subtly only while `active`,
 * and rests in a finished static state otherwise (and under reduced motion).
 * Client-only: loaded lazily by research/LazyVisual.
 */
export function ThreadVisual({ id, active, className, k = 1, compact = false }: ThreadVisualProps) {
  const scale = useMemo(() => ({ k, compact }), [k, compact]);
  return <ScaleContext.Provider value={scale}>{pick(id, active, className)}</ScaleContext.Provider>;
}

function pick(id: ThreadId, active: boolean, className?: string) {
  switch (id) {
    case "exoplanet":
      return <ExoplanetVisual active={active} className={className} />;
    case "renal":
      return <RenalVisual active={active} className={className} />;
    case "sepsis":
      return <SepsisVisual active={active} className={className} />;
    case "genome":
      return <GenomeVisual active={active} className={className} />;
  }
}
