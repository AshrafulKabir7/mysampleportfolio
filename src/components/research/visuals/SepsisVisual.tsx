import { m } from "motion/react";
import { Figure, Label, SETTLE, norm, r2, roundedPolyline, textW, useRun, useScale, useUid, type Stop } from "./shared";

/**
 * 03 · Action grid (schematic).
 * The 5 × 5 treatment space (IV fluid × vasopressor dose bins). Masked cells
 * stand for inadmissible actions (in the benchmark this depends on the state;
 * here one fixed mask keeps the picture legible); the learned policy threads
 * between them, an unmasked policy walks into one and the episode terminates.
 */

const CELL = 68;
const X0 = 170;
const Y0 = 80;
const N = 5;

const cellX = (iv: number) => X0 + iv * CELL;
const cellY = (vaso: number) => Y0 + (N - 1 - vaso) * CELL;
const centre = ([iv, vaso]: [number, number]) => ({ x: cellX(iv) + CELL / 2, y: cellY(vaso) + CELL / 2 });

/** [iv, vaso] — seven inadmissible cells, fixed */
const MASKED: [number, number][] = [
  [0, 4],
  [1, 4],
  [4, 4],
  [3, 3],
  [4, 3],
  [1, 2],
  [4, 0],
];

const POLICY_CELLS: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [2, 1],
  [2, 2],
  [3, 2],
  [4, 2],
];
const CLINICIAN_CELLS: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 3],
  [1, 4],
];

const POLICY = roundedPolyline(POLICY_CELLS.map(centre), 16);
const CLINICIAN = roundedPolyline(CLINICIAN_CELLS.map(centre), 16);
const END = centre(CLINICIAN_CELLS[CLINICIAN_CELLS.length - 1]);
const START = centre(POLICY_CELLS[0]);

const GRID_LINES = (() => {
  let d = "";
  for (let i = 1; i < N; i++) {
    d += `M${X0 + i * CELL} ${Y0} V${Y0 + N * CELL} M${X0} ${Y0 + i * CELL} H${X0 + N * CELL} `;
  }
  return d.trim();
})();

/* ── timeline (seconds in a 12 s cycle) ── */
const CYCLE = 12;
const FADE_OUT = 10.2;
const GONE = 10.9;

/** Step a marker cell-by-cell: hold, move, hold … Returns keyframes for x/y/pathLength + arrival times. */
function stepper(stops: Stop[], start: number, step: number, move: number) {
  const xs = [stops[0].x];
  const ys = [stops[0].y];
  const ls = [0];
  const ts = [0];
  const arrive = [start];
  for (let i = 1; i < stops.length; i++) {
    const t0 = start + (i - 1) * step;
    xs.push(stops[i - 1].x, stops[i].x);
    ys.push(stops[i - 1].y, stops[i].y);
    ls.push(stops[i - 1].f, stops[i].f);
    ts.push(t0, t0 + move);
    arrive.push(t0 + move);
  }
  xs.push(stops[stops.length - 1].x);
  ys.push(stops[stops.length - 1].y);
  ls.push(1);
  ts.push(CYCLE);
  return { xs, ys, ls, times: norm(CYCLE, ts), arrive };
}

const P = stepper(POLICY.stops, 0.8, 0.95, 0.5);
const Q = stepper(CLINICIAN.stops, 1.0, 1.05, 0.55);
const Q_END = Q.arrive[Q.arrive.length - 1];

const SHOW = { opacity: [0, 1, 1, 0, 0], times: norm(CYCLE, [0, 0.4, FADE_OUT, GONE, CYCLE]) };

/** legend row laid out from the (scaled) label widths, centred under the grid and kept inside the frame */
function legend(S: number) {
  const items = [
    { key: "policy", swatch: 22, label: "POLICY" },
    { key: "clinician", swatch: 22, label: "UNMASKED" },
    { key: "inadmissible", swatch: 14, label: "INADMISSIBLE" },
  ].map((it) => ({ ...it, w: it.swatch + 8 + textW(it.label.length, S) }));
  const gap = 22;
  const total = items.reduce((a, it) => a + it.w, 0) + gap * (items.length - 1);
  let x = Math.max(24, Math.min(X0 + (N * CELL) / 2 - total / 2, 576 - total));
  return items.map((it) => {
    const at = r2(x);
    x += it.w + gap;
    return { ...it, x: at, tx: r2(at + it.swatch + 8) };
  });
}

export function SepsisVisual({ active, className }: { active: boolean; className?: string }) {
  const run = useRun(active);
  const uid = useUid("sepsis");
  const id = { hatch: uid("hatch"), mask: uid("mask") };
  const last = POLICY.stops[POLICY.stops.length - 1];

  const { S, compact } = useScale();
  const leg = legend(S);
  const [lp, lc, li] = leg;

  const show = run
    ? { animate: { opacity: SHOW.opacity }, transition: { duration: CYCLE, times: SHOW.times, repeat: Infinity } }
    : { animate: { opacity: 1 }, transition: SETTLE };

  return (
    <Figure className={className}>
      <defs>
        <pattern id={id.hatch} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="1" />
        </pattern>
        <mask id={id.mask} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
          <m.path
            d={CLINICIAN.d}
            stroke="#fff"
            strokeWidth="8"
            fill="none"
            initial={false}
            animate={run ? { pathLength: Q.ls } : { pathLength: 1 }}
            transition={run ? { duration: CYCLE, times: Q.times, repeat: Infinity, ease: "easeInOut" } : SETTLE}
          />
        </mask>
      </defs>

      <Label x={24} y={34} tone="muted">
        ICU-SEPSIS
      </Label>
      <Label x={576} y={34} anchor="end" tone="muted">
        25 ACTIONS
      </Label>

      {/* ── grid ── */}
      <rect x={X0} y={Y0} width={N * CELL} height={N * CELL} fill="var(--surface)" />
      {MASKED.map(([iv, vaso]) => {
        const x = cellX(iv);
        const y = cellY(vaso);
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        return (
          <g key={`${iv}-${vaso}`}>
            <rect x={x} y={y} width={CELL} height={CELL} fill={`url(#${id.hatch})`} />
            <rect x={cx - 9} y={cy - 9} width={18} height={18} fill="var(--surface)" />
            <path d={`M${cx - 5} ${cy - 5} L${cx + 5} ${cy + 5} M${cx + 5} ${cy - 5} L${cx - 5} ${cy + 5}`} stroke="var(--subtle)" strokeWidth="1.25" strokeLinecap="round" />
          </g>
        );
      })}
      <path d={GRID_LINES} stroke="var(--line)" strokeWidth="1" />
      <rect x={X0} y={Y0} width={N * CELL} height={N * CELL} stroke="var(--line-strong)" strokeWidth="1.25" />

      {/* policy trail: visited cells tint as the marker lands */}
      {POLICY_CELLS.map(([iv, vaso], i) => (
        <m.rect
          key={`v-${i}`}
          x={cellX(iv) + 1}
          y={cellY(vaso) + 1}
          width={CELL - 2}
          height={CELL - 2}
          fill="var(--accent)"
          initial={false}
          animate={run ? { opacity: [0, 0, 0.1, 0.1, 0, 0] } : { opacity: 0.1 }}
          transition={
            run
              ? { duration: CYCLE, times: norm(CYCLE, [0, P.arrive[i], P.arrive[i] + 0.35, FADE_OUT, GONE, CYCLE]), repeat: Infinity }
              : SETTLE
          }
        />
      ))}

      {/* axes — dose-bin ticks drop out on small renders */}
      {!compact
        ? Array.from({ length: N }, (_, i) => (
            <g key={i}>
              <Label x={cellX(i) + CELL / 2} y={Y0 + N * CELL + 22} anchor="middle" tone="subtle">
                {i}
              </Label>
              <Label x={X0 - 14} y={cellY(i) + CELL / 2 + 4.5} anchor="end" tone="subtle">
                {i}
              </Label>
            </g>
          ))
        : null}
      <Label x={X0 + N * CELL} y={compact ? r2(Y0 + N * CELL + 12 + S) : Y0 + N * CELL + 50} anchor="end" tone="muted">
        IV FLUID →
      </Label>
      <Label
        x={0}
        y={0}
        anchor="middle"
        tone="muted"
        transform={`translate(${compact ? X0 - 14 : X0 - 44} ${Y0 + (N * CELL) / 2}) rotate(-90)`}
      >
        VASOPRESSOR →
      </Label>

      {/* ── unmasked policy: dashed ghost, revealed through a drawing mask ── */}
      <m.g initial={false} {...show}>
        <path
          d={CLINICIAN.d}
          mask={`url(#${id.mask})`}
          stroke="var(--muted)"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
        <m.g
          initial={false}
          animate={run ? { opacity: [0, 0, 1, 1], scale: [0.4, 0.4, 1, 1] } : { opacity: 1, scale: 1 }}
          transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, Q_END, Q_END + 0.3, CYCLE]), repeat: Infinity } : SETTLE}
        >
          <rect x={END.x - 13} y={END.y - 13} width={26} height={26} fill="var(--surface)" />
          <path
            d={`M${END.x - 8} ${END.y - 8} L${END.x + 8} ${END.y + 8} M${END.x + 8} ${END.y - 8} L${END.x - 8} ${END.y + 8}`}
            stroke="var(--fg)"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </m.g>
        <m.g
          initial={false}
          animate={run ? { opacity: [0, 0, 1, 1] } : { opacity: 1 }}
          transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, Q_END + 0.2, Q_END + 0.6, CYCLE]), repeat: Infinity } : SETTLE}
        >
          <Label x={END.x} y={Y0 - 14} anchor="middle" tone="fg">
            TERMINATE
          </Label>
        </m.g>
      </m.g>

      {/* ── learned policy: the signal ── */}
      <m.g initial={false} {...show}>
        <circle cx={START.x} cy={START.y} r={9} fill="var(--surface)" stroke="var(--fg)" strokeOpacity="0.6" strokeWidth="1.25" />
        <m.path
          d={POLICY.d}
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={false}
          animate={run ? { pathLength: P.ls } : { pathLength: 1 }}
          transition={run ? { duration: CYCLE, times: P.times, repeat: Infinity, ease: "easeInOut" } : SETTLE}
        />
        <m.g
          initial={false}
          animate={run ? { x: P.xs, y: P.ys } : { x: last.x, y: last.y }}
          transition={run ? { duration: CYCLE, times: P.times, repeat: Infinity, ease: "easeInOut" } : SETTLE}
        >
          <circle cx={0} cy={0} r={12} fill="var(--accent)" opacity={0.16} />
          <circle cx={0} cy={0} r={5.5} fill="var(--accent)" />
        </m.g>
      </m.g>

      {/* legend, centred under the grid */}
      <g transform="translate(0 526)">
        <path d={`M${lp.x} 0 h${lp.swatch}`} stroke="var(--accent)" strokeWidth="2" />
        <Label x={lp.tx} y={r2(S * 0.35)} tone="muted">
          {lp.label}
        </Label>
        <path d={`M${lc.x} 0 h${lc.swatch}`} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 5" />
        <Label x={lc.tx} y={r2(S * 0.35)} tone="muted">
          {lc.label}
        </Label>
        <rect x={li.x} y={-7} width={li.swatch} height={14} fill={`url(#${id.hatch})`} stroke="var(--line-strong)" />
        <Label x={li.tx} y={r2(S * 0.35)} tone="muted">
          {li.label}
        </Label>
      </g>

      <Label x={24} y={576} tone="muted">
        MASKED · <tspan fill="var(--fg)">0% INADMISSIBLE</tspan>
      </Label>
      {!compact ? (
        <Label x={576} y={576} anchor="end" tone="subtle">
          DOSE BINS 0–4
        </Label>
      ) : null}
    </Figure>
  );
}
