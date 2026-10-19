import { createContext, useContext, useId, type ReactNode, type SVGProps } from "react";
import type { Transition } from "motion/react";
import { useMounted, useReducedMotionPref } from "@/lib/hooks";
import { useMotionPaused } from "@/lib/motionPref";
import { cn } from "@/lib/cn";

/**
 * Shared kit for the four research "figures".
 * Every figure is a 600 × 600 viewBox drawn in theme tokens only, so it
 * flips with html.light. Pseudo-random texture comes from a seeded PRNG
 * evaluated once at module level — server and client markup always match.
 */

/* label sizes in viewBox units at scale 1 — tuned for a figure rendered ≥ 420 px wide */
export const FONT_L = 17;
export const FONT_S = 15;

/** Mono advance per character in em: Geist Mono 0.6em + 0.12em label tracking */
export const CHAR_EM = 0.72;

/**
 * Rendered-size awareness. `k` scales label type so a figure drawn at ~290 px
 * still sets labels at ≥ 10 CSS px (1 at ≥ 420 px wide, up to 1.45).
 * `compact` additionally hides the least important labels (axis ticks etc.).
 */
export type FigureScale = { k: number; compact: boolean };
export const ScaleContext = createContext<FigureScale>({ k: 1, compact: false });

export function useScale() {
  const { k, compact } = useContext(ScaleContext);
  return { k, compact, L: r2(FONT_L * k), S: r2(FONT_S * k) };
}

/** Approximate rendered width of a mono label (viewBox units) */
export const textW = (chars: number, size: number, em = CHAR_EM) => chars * size * em;

/** Deterministic PRNG (mulberry32). Same seed → same sequence, on server and client. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round to 2 decimals — keeps markup small and identical across runtimes */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Loops run only after mount, while the figure is active, and never under
 * reduced motion. Before that (SSR, hydration, inactive) every element sits in
 * its finished static state.
 */
export function useRun(active: boolean) {
  const mounted = useMounted();
  const reduce = useReducedMotionPref();
  const paused = useMotionPaused();
  return mounted && active && !reduce && !paused;
}

/** Stable, url()-safe ids for gradients / patterns / masks (unique per instance) */
export function useUid(prefix: string) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (name: string) => `${prefix}-${raw}-${name}`;
}

/** Pen-stroke ease for pathLength draw-ins */
export const EASE_DRAW: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** Ease back to the static state when a figure goes inactive */
export const SETTLE: Transition = { duration: 0.7, ease: [0.16, 1, 0.3, 1] };

export function loop(duration: number, extra: Transition = {}): Transition {
  return { duration, repeat: Infinity, ease: "easeInOut", ...extra };
}

/** Normalise absolute seconds to keyframe `times` within a cycle */
export const norm = (cycle: number, ts: number[]) => ts.map((t) => Math.min(1, Math.max(0, t / cycle)));

/** label tones; `accent-text` is the accent tuned for small text (AA in both themes) */
type Tone = "fg" | "muted" | "subtle" | "accent-text";

type LabelProps = {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  tone?: Tone;
  size?: number;
  weight?: number;
} & Omit<SVGProps<SVGTextElement>, "x" | "y" | "children" | "ref">;

/** Mono uppercase HUD label in viewBox units (defaults to the scaled small size) */
export function Label({ x, y, children, anchor = "start", tone = "muted", size, weight = 500, style, ...rest }: LabelProps) {
  const { S } = useScale();
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={`var(--${tone})`}
      fontSize={size ?? S}
      fontWeight={weight}
      style={{ letterSpacing: "0.12em", ...style }}
      {...rest}
    >
      {children}
    </text>
  );
}

/**
 * Root <svg> shared by every figure. Decorative to assistive tech: the
 * description lives on the prerendered role="img" frame around it
 * (see visuals/labels.ts), so it is in the HTML even before the figure mounts.
 */
export function Figure({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-full w-full select-none font-mono", className)}
      fill="none"
    >
      {children}
    </svg>
  );
}

/* ───────────── geometry ───────────── */

export type Pt = { x: number; y: number };

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

function quadLength(a: Pt, c: Pt, b: Pt, steps = 24) {
  let len = 0;
  let prev = a;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const p = { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
    len += dist(prev, p);
    prev = p;
  }
  return len;
}

export type Stop = Pt & { f: number };

/**
 * Polyline through `pts` with rounded corners (quadratic, radius `radius`).
 * Returns the path, plus one stop per vertex: the point on the path nearest the
 * vertex and its fraction of total length — used to sync a moving marker with
 * a pathLength draw.
 */
export function roundedPolyline(pts: Pt[], radius: number) {
  let d = `M${r2(pts[0].x)} ${r2(pts[0].y)}`;
  let len = 0;
  let cur = pts[0];
  const stops: (Pt & { at: number })[] = [{ ...pts[0], at: 0 }];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (i === pts.length - 1) {
      len += dist(cur, p);
      d += ` L${r2(p.x)} ${r2(p.y)}`;
      stops.push({ ...p, at: len });
      break;
    }
    const prev = pts[i - 1];
    const next = pts[i + 1];
    const li = dist(prev, p);
    const lo = dist(p, next);
    const din = { x: (p.x - prev.x) / li, y: (p.y - prev.y) / li };
    const dout = { x: (next.x - p.x) / lo, y: (next.y - p.y) / lo };
    if (Math.abs(din.x * dout.y - din.y * dout.x) < 1e-6) {
      len += dist(cur, p);
      d += ` L${r2(p.x)} ${r2(p.y)}`;
      stops.push({ ...p, at: len });
      cur = p;
      continue;
    }
    const a = { x: p.x - din.x * radius, y: p.y - din.y * radius };
    const b = { x: p.x + dout.x * radius, y: p.y + dout.y * radius };
    len += dist(cur, a);
    d += ` L${r2(a.x)} ${r2(a.y)}`;
    const ql = quadLength(a, p, b);
    stops.push({ x: 0.25 * a.x + 0.5 * p.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * p.y + 0.25 * b.y, at: len + ql / 2 });
    len += ql;
    d += ` Q${r2(p.x)} ${r2(p.y)} ${r2(b.x)} ${r2(b.y)}`;
    cur = b;
  }
  return { d, total: len, stops: stops.map((s): Stop => ({ x: r2(s.x), y: r2(s.y), f: s.at / len })) };
}

/** Closed smooth-ish blob from a polar radius function (sampled densely) */
export function polarPath(cx: number, cy: number, radius: (theta: number) => number, steps = 72) {
  let d = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius(t);
    d += `${i ? " L" : "M"}${r2(cx + Math.cos(t) * r)} ${r2(cy + Math.sin(t) * r)}`;
  }
  return `${d} Z`;
}

/** Segment between two node centres, trimmed by each node's radius */
export function trimmed(a: Pt, b: Pt, ra: number, rb: number) {
  const l = dist(a, b);
  const ux = (b.x - a.x) / l;
  const uy = (b.y - a.y) / l;
  return {
    x1: r2(a.x + ux * ra),
    y1: r2(a.y + uy * ra),
    x2: r2(b.x - ux * rb),
    y2: r2(b.y - uy * rb),
  };
}
