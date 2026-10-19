import { m } from "motion/react";
import { EASE_DRAW, Figure, Label, SETTLE, loop, mulberry32, r2, useRun, useScale, useUid } from "./shared";

/**
 * 01 · Coronagraph frame (schematic).
 * A direct-imaging field in the style of a JWST/MIRI coronagraph: the star
 * hidden behind an occulter, residual speckle, six diffraction spikes — and one
 * faint companion boxed as the signal. Drawn, not observed.
 */

const C = 300;
const R = 200;

// companion position: between two big spikes, ~40° above the +x axis
const P_ANGLE = (-40 * Math.PI) / 180;
const P_SEP = 122;
const PX = r2(C + Math.cos(P_ANGLE) * P_SEP);
const PY = r2(C + Math.sin(P_ANGLE) * P_SEP);

// JWST's six big spikes + two faint horizontal ones, rolled so the companion sits in a clear lane
const BIG_SPIKES = [-70, -10, 50, 110, 170, 230];
const SMALL_SPIKES = [-100, 80];

/** opacity buckets for the speckle — each (twinkle group × bucket) is one <path> */
const SPECKLE_O = [0.2, 0.36, 0.53, 0.72];
const bucket = (o: number) => (o < 0.28 ? 0 : o < 0.45 ? 1 : o < 0.62 ? 2 : 3);

/**
 * Residual speckle: denser and brighter toward the star; three twinkle groups.
 * ~230 dots collapse into 12 paths of arc-drawn circles (3 groups × 4 opacities).
 */
const SPECKLE = (() => {
  const rnd = mulberry32(0x5eed_0e1a);
  const groups: string[][] = [
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
  ];
  for (let i = 0; i < 230; i++) {
    const a = rnd() * Math.PI * 2;
    const u = rnd();
    const rad = 44 + (R - 50) * Math.pow(u, 1.65);
    const near = 1 - (rad - 44) / (R - 50);
    const x = C + Math.cos(a) * rad;
    const y = C + Math.sin(a) * rad;
    const size = 0.5 + rnd() * 0.85 + near * 0.95;
    const o = 0.1 + rnd() * 0.32 + near * 0.42;
    if (Math.hypot(x - PX, y - PY) < 24) continue; // keep the signal clean
    const r = r2(size);
    groups[i % 3][bucket(Math.min(0.85, o))] += `M${r2(x - r)} ${r2(y)}a${r} ${r} 0 1 0 ${r2(2 * r)} 0a${r} ${r} 0 1 0 ${r2(-2 * r)} 0`;
  }
  return groups;
})();

/** HUD ticks around the field: every 10°, longer every 30° */
const TICKS = (() => {
  let d = "";
  for (let k = 0; k < 36; k++) {
    const a = (k * 10 * Math.PI) / 180;
    const r1 = R + 8;
    const r2_ = k % 3 === 0 ? R + 20 : R + 14;
    d += `M${r2(C + Math.cos(a) * r1)} ${r2(C + Math.sin(a) * r1)} L${r2(C + Math.cos(a) * r2_)} ${r2(C + Math.sin(a) * r2_)} `;
  }
  return d.trim();
})();

/** four corner brackets around (cx, cy) */
function brackets(cx: number, cy: number, half: number, arm: number) {
  const l = cx - half;
  const r = cx + half;
  const t = cy - half;
  const b = cy + half;
  return [
    `M${l} ${t + arm} L${l} ${t} L${l + arm} ${t}`,
    `M${r - arm} ${t} L${r} ${t} L${r} ${t + arm}`,
    `M${r} ${b - arm} L${r} ${b} L${r - arm} ${b}`,
    `M${l + arm} ${b} L${l} ${b} L${l} ${b - arm}`,
  ];
}

const RET_HALF = 18;
const RETICLE = brackets(PX, PY, RET_HALF, 7);
const STAR_HALF = 56;
const STAR_BOX = brackets(C, C, STAR_HALF, 10);

// planet callout: 45° leader to the top-right margin
const P_ELBOW = { x: r2(PX + RET_HALF + 42), y: r2(PY - RET_HALF - 42) };
const P_LEADER = `M${r2(PX + RET_HALF)} ${r2(PY - RET_HALF)} L${P_ELBOW.x} ${P_ELBOW.y} L576 ${P_ELBOW.y}`;
// star callout: 45° leader to the bottom-left margin
const S_ELBOW = { x: C - STAR_HALF - 80, y: C + STAR_HALF + 80 };
const S_LEADER = `M${C - STAR_HALF} ${C + STAR_HALF} L${S_ELBOW.x} ${S_ELBOW.y} L24 ${S_ELBOW.y}`;

export function ExoplanetVisual({ active, className }: { active: boolean; className?: string }) {
  const run = useRun(active);
  const { L, S } = useScale();
  // two-line callouts: baselines derived from the (scaled) type sizes
  const star1 = S_ELBOW.y + 4 + L;
  const star2 = star1 + S * 1.25;
  const planet2 = P_ELBOW.y - 9;
  const planet1 = planet2 - S * 1.2;
  const uid = useUid("exo");
  const id = {
    clip: uid("clip"),
    grid: uid("grid"),
    halo: uid("halo"),
    spike: uid("spike"),
    spikeS: uid("spikeS"),
    glow: uid("glow"),
  };

  const draw = (delay: number, duration = 0.9) =>
    run
      ? { animate: { pathLength: [0, 1] }, transition: { duration, delay, ease: EASE_DRAW } }
      : { animate: { pathLength: 1 }, transition: SETTLE };
  const fadeIn = (delay: number) =>
    run
      ? { animate: { opacity: [0, 1] }, transition: { duration: 0.6, delay } }
      : { animate: { opacity: 1 }, transition: SETTLE };

  return (
    <Figure className={className}>
      <defs>
        <clipPath id={id.clip}>
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        <pattern id={id.grid} width="20" height="20" patternUnits="userSpaceOnUse" x={C - 10} y={C - 10}>
          <circle cx="10" cy="10" r="0.8" fill="var(--fg)" opacity="0.16" />
        </pattern>
        <radialGradient id={id.halo} cx={C} cy={C} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0.2" />
          <stop offset="0.28" stopColor="var(--fg)" stopOpacity="0.075" />
          <stop offset="0.62" stopColor="var(--fg)" stopOpacity="0.018" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id.spike} x1="40" y1="0" x2={R - 6} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0.62" />
          <stop offset="0.3" stopColor="var(--fg)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id.spikeS} x1="40" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id.glow} cx={PX} cy={PY} r="17" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.6" />
          <stop offset="0.35" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* corner metadata */}
      <Label x={24} y={34} tone="muted">
        CORONAGRAPH
      </Label>
      <Label x={576} y={34} anchor="end" tone="muted">
        DIRECT IMAGING
      </Label>

      {/* ── the field ── */}
      <circle cx={C} cy={C} r={R} fill="var(--bg)" />
      <g clipPath={`url(#${id.clip})`}>
        <rect x={C - R} y={C - R} width={R * 2} height={R * 2} fill={`url(#${id.grid})`} />
        <m.circle
          cx={C}
          cy={C}
          r={R}
          fill={`url(#${id.halo})`}
          initial={false}
          animate={run ? { opacity: [1, 0.72, 1] } : { opacity: 1 }}
          transition={run ? loop(10) : SETTLE}
        />

        {/* speckle, three twinkle phases */}
        {SPECKLE.map((group, gi) => (
          <m.g
            key={gi}
            initial={false}
            animate={run ? { opacity: [1, 0.22, 1] } : { opacity: 1 }}
            transition={run ? loop([7, 9.5, 12][gi], { delay: gi * 1.3 }) : SETTLE}
          >
            {group.map((d, b) => (d ? <path key={b} d={d} fill="var(--fg)" opacity={SPECKLE_O[b]} /> : null))}
          </m.g>
        ))}

        {/* diffraction spikes */}
        <g transform={`translate(${C} ${C})`}>
          {BIG_SPIKES.map((a) => (
            <polygon key={a} points={`40,-1.7 ${R - 6},0 40,1.7`} transform={`rotate(${a})`} fill={`url(#${id.spike})`} />
          ))}
          {SMALL_SPIKES.map((a) => (
            <polygon key={a} points="40,-0.9 140,0 40,0.9" transform={`rotate(${a})`} fill={`url(#${id.spikeS})`} />
          ))}
        </g>

        {/* separation ring through the companion */}
        <circle cx={C} cy={C} r={P_SEP} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="2 6" />
      </g>
      <circle cx={C} cy={C} r={R} stroke="var(--line-strong)" strokeWidth="1.25" />

      {/* HUD ticks, slowly turning (pattern repeats every 30°, so the loop is seamless) */}
      <m.path
        d={TICKS}
        stroke="var(--muted)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={0.7}
        initial={false}
        animate={run ? { rotate: [0, 30] } : { rotate: 0 }}
        transition={run ? { duration: 14, ease: "linear", repeat: Infinity } : SETTLE}
      />

      {/* occulter */}
      <circle cx={C} cy={C} r={48} stroke="var(--subtle)" strokeWidth="1" strokeDasharray="1.5 4.5" />
      <circle cx={C} cy={C} r={38} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.25" />
      <path d={`M${C - 5} ${C} H${C + 5} M${C} ${C - 5} V${C + 5}`} stroke="var(--subtle)" strokeWidth="1" />

      {/* star box + callout */}
      <g stroke="var(--muted)" strokeWidth="1.25" opacity={0.9}>
        {STAR_BOX.map((d, i) => (
          <m.path key={i} d={d} initial={false} {...draw(0.1, 0.7)} />
        ))}
      </g>
      <m.path d={S_LEADER} stroke="var(--subtle)" strokeWidth="1" initial={false} {...draw(0.5, 0.9)} />
      <m.g initial={false} {...fadeIn(1.0)}>
        <Label x={24} y={star1} size={L} tone="fg">
          STAR
        </Label>
        <Label x={24} y={star2} tone="muted">
          MASKED
        </Label>
      </m.g>

      {/* ── the signal ── */}
      <m.g
        initial={false}
        animate={run ? { x: [0, 1.6, -1.2, 0], y: [0, -1.2, 1, 0], opacity: [1, 0.78, 1, 1] } : { x: 0, y: 0, opacity: 1 }}
        transition={run ? loop(12) : SETTLE}
      >
        <circle cx={PX} cy={PY} r="17" fill={`url(#${id.glow})`} />
        <circle cx={PX} cy={PY} r="7.5" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1" />
        <circle cx={PX} cy={PY} r="2.6" fill="var(--accent)" />
      </m.g>

      <m.g
        initial={false}
        animate={run ? { scale: [1, 1, 1.14, 1], opacity: [1, 1, 0.55, 1] } : { scale: 1, opacity: 1 }}
        transition={run ? loop(3.4, { delay: 1.6, times: [0, 0.35, 0.65, 1] }) : SETTLE}
      >
        {RETICLE.map((d, i) => (
          <m.path
            key={i}
            d={d}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={false}
            {...draw(0.35 + i * 0.08, 0.6)}
          />
        ))}
      </m.g>
      <m.path d={P_LEADER} stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="1" initial={false} {...draw(0.9, 0.8)} />
      <m.g initial={false} {...fadeIn(1.35)}>
        <Label x={576} y={planet1} size={L} anchor="end" tone="accent-text">
          EXOPLANET
        </Label>
        <Label x={576} y={planet2} anchor="end" tone="muted">
          DICE 0.90
        </Label>
      </m.g>

      {/* sky compass: north up, east left */}
      <g stroke="var(--subtle)" strokeWidth="1" strokeLinecap="round">
        <path d="M556 560 V528 M552 533 L556 528 L560 533" />
        <path d="M556 560 H524 M529 556 L524 560 L529 564" />
      </g>
      <Label x={556} y={519} anchor="middle" tone="subtle">
        N
      </Label>
      <Label x={514} y={r2(560 + S * 0.35)} anchor="end" tone="subtle">
        E
      </Label>
    </Figure>
  );
}
