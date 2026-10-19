import { m } from "motion/react";
import { EASE_DRAW, Figure, Label, SETTLE, loop, mulberry32, norm, r2, trimmed, useRun, useScale, useUid, type Pt } from "./shared";

/**
 * 04 · Variant + molecule (schematic).
 * Top: a reference sequence over four isoforms. One C→T variant (in accent)
 * lands in the isoforms whose exons include it — one isoform splices that exon
 * out — and its conformal prediction set keeps both classes: uncertain.
 * Bottom: a small molecule whose GATv2 attention passes bond by bond into a
 * readout that fans out to 23 ADMET endpoints.
 */

/* ───────────── isoforms ───────────── */

const COLS = 23;
const VAR_J = 11;
const COL_X = (j: number) => 88 + j * 20;
const REF_Y = 104;
const ISO_Y = [140, 166, 192, 218];
const BASES = "ACGT";

type Cell = { j: number; ch: string };

/** [first, last] column covered by each isoform, and the exon each one skips (if any) */
const ISOFORMS: { span: [number, number]; skip?: [number, number] }[] = [
  { span: [0, 22] },
  { span: [2, 22], skip: [16, 18] },
  { span: [0, 18], skip: [9, 13] }, // splices out the variant's exon
  { span: [5, 22] },
];

const TRACKS = (() => {
  const rnd = mulberry32(0x00d1a_2024);
  const ref = Array.from({ length: COLS }, () => BASES[(rnd() * 4) | 0]);
  ref[VAR_J] = "C";
  // break up accidental homopolymer runs around the variant so the column reads clearly
  if (ref[VAR_J - 1] === "C") ref[VAR_J - 1] = "A";
  if (ref[VAR_J + 1] === "C") ref[VAR_J + 1] = "G";
  if (ref[VAR_J - 1] === "T") ref[VAR_J - 1] = "G";
  if (ref[VAR_J + 1] === "T") ref[VAR_J + 1] = "A";

  const isoforms = ISOFORMS.map(({ span: [a, b], skip }) => {
    const plain: Cell[] = [];
    let variant: Cell | null = null;
    for (let j = a; j <= b; j++) {
      if (skip && j >= skip[0] && j <= skip[1]) continue;
      if (j === VAR_J) {
        variant = { j, ch: "T" };
        continue;
      }
      plain.push({ j, ch: ref[j] });
    }
    // intron: a shallow splice caret over the skipped exon
    const intron = skip
      ? (() => {
          const x1 = COL_X(skip[0] - 1) + 7;
          const x2 = COL_X(skip[1] + 1) - 7;
          return { x1, x2, mid: (x1 + x2) / 2 };
        })()
      : null;
    return { plain, variant, intron };
  });

  return { ref, isoforms };
})();

const xs = (cells: Cell[]) => cells.map((c) => COL_X(c.j)).join(" ");
const chars = (cells: Cell[]) => cells.map((c) => c.ch).join("");
/** the prediction set hangs under the variant column */
const SET_X = COL_X(VAR_J);
const REF_CELLS: Cell[] = TRACKS.ref.map((ch, j) => ({ j, ch })).filter((c) => c.j !== VAR_J);

/* ───────────── molecule ───────────── */

type Node = Pt & { el?: string };
const BOND = 38;
const RING_C = { x: 186, y: 456 };
/** hexagon (pointy-top) + zig-zag side chain, laid out on a 30° lattice */
const at = (u: number, v: number, el?: string): Node => ({
  x: Math.round((RING_C.x + u * BOND * 0.866) * 100) / 100,
  y: Math.round((RING_C.y + v * BOND * 0.5) * 100) / 100,
  el,
});
const nodes: Record<string, Node> = {
  a0: at(0, -2),
  a1: at(1, -1),
  a2: at(1, 1),
  a3: at(0, 2),
  a4: at(-1, 1),
  a5: at(-1, -1),
  b1: at(2, -2),
  b2: at(3, -1),
  b3: at(4, -2, "N"),
  b4: at(5, -1),
  b5: at(3, 1, "O"),
  c1: at(-2, 2, "F"),
};

const BONDS: [string, string][] = [
  ["a0", "a1"],
  ["a1", "a2"],
  ["a2", "a3"],
  ["a3", "a4"],
  ["a4", "a5"],
  ["a5", "a0"],
  ["a1", "b1"],
  ["b1", "b2"],
  ["b2", "b3"],
  ["b3", "b4"],
  ["b2", "b5"],
  ["a4", "c1"],
];

/** attention wave: directed edges grouped by hop from the fluorine */
const WAVE: [string, string][][] = [
  [["c1", "a4"]],
  [
    ["a4", "a3"],
    ["a4", "a5"],
  ],
  [
    ["a3", "a2"],
    ["a5", "a0"],
  ],
  [
    ["a2", "a1"],
    ["a0", "a1"],
  ],
  [["a1", "b1"]],
  [["b1", "b2"]],
  [
    ["b2", "b5"],
    ["b2", "b3"],
  ],
  [["b3", "b4"]],
];

const POOL = { x: 432, y: 456 };
const FAN_N = 23; // one readout per ADMET endpoint
const FAN_Y = Array.from({ length: FAN_N }, (_, k) => POOL.y + (k - (FAN_N - 1) / 2) * 7);
const COMB_X = 488;
/** pooled embedding → one shared trunk → a comb of 23 task heads */
const TRUNK_D = `M${POOL.x + 7} ${POOL.y} H${COMB_X} M${COMB_X} ${FAN_Y[0]} V${FAN_Y[FAN_N - 1]}`;
const TICK_D = FAN_Y.map((y) => `M${COMB_X} ${y} H${COMB_X + 14}`).join(" ");
const READOUT = trimmed(nodes.b4, POOL, 6, 8);

const CYCLE = 11;
const HOP = 0.7;
const hopStart = (level: number) => 0.5 + level * HOP;
const FAN_T = hopStart(WAVE.length + 1);

/** first time each node receives a message in the wave */
const ARRIVAL = (() => {
  const m = new Map<string, number>();
  WAVE.forEach((hop, L) => hop.forEach(([, dst]) => (m.has(dst) ? null : m.set(dst, hopStart(L) + 0.45))));
  return [...m.entries()];
})();

export function GenomeVisual({ active, className }: { active: boolean; className?: string }) {
  const run = useRun(active);
  const uid = useUid("genome");
  const id = { scan: uid("scan") };
  const { k, L, S } = useScale();
  // atoms grow a little with the labels so element symbols stay legible
  const ka = Math.min(k, 1.2);
  const atomR = r2(11 * ka);
  const nodeR = (key: string) => (nodes[key].el ? atomR + 1 : 6);
  // prediction-set block: two lines, then the divider
  const setY = 314;
  const noteY = r2(setY + S * 1.4);
  const ruleY = r2(noteY + 22);

  const pulse = (start: number, hold = 0.45, fade = 0.6) =>
    run
      ? {
          animate: { pathLength: [0, 0, 1, 1, 1, 0], opacity: [1, 1, 1, 1, 0, 0] },
          transition: {
            duration: CYCLE,
            times: norm(CYCLE, [0, start, start + 0.45, start + 0.45 + hold, start + 0.45 + hold + fade, CYCLE]),
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        }
      : { animate: { pathLength: 1, opacity: 0 }, transition: SETTLE };

  const flash = (at: number) =>
    run
      ? {
          animate: { opacity: [0, 0, 0.9, 0, 0], scale: [0.6, 0.6, 1, 1.5, 1.5] },
          transition: { duration: CYCLE, times: norm(CYCLE, [0, at, at + 0.15, at + 0.9, CYCLE]), repeat: Infinity },
        }
      : { animate: { opacity: 0, scale: 1 }, transition: SETTLE };

  return (
    <Figure className={className}>
      <defs>
        <linearGradient id={id.scan} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0.07" />
        </linearGradient>
      </defs>

      <Label x={24} y={34} tone="muted">
        VARIANT EFFECT
      </Label>
      <Label x={576} y={34} anchor="end" tone="muted">
        VARIANTFUSION
      </Label>

      {/* ── reference + isoforms ── */}
      <rect x={66} y={80} width={484} height={156} fill="var(--surface)" />

      {/* variant column */}
      <rect x={COL_X(VAR_J) - 12} y={82} width={24} height={150} rx={4} fill="var(--accent)" fillOpacity="0.07" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1" />
      <m.rect
        x={COL_X(VAR_J) - 12}
        y={82}
        width={24}
        height={150}
        rx={4}
        fill="var(--accent)"
        initial={false}
        animate={run ? { opacity: [0, 0, 0.16, 0, 0] } : { opacity: 0 }}
        transition={run ? { duration: 10, times: [0, 0.47, 0.52, 0.66, 1], repeat: Infinity } : SETTLE}
      />

      <Label x={24} y={REF_Y + 5} tone="muted">
        REF
      </Label>
      <Label x={0} y={0} anchor="middle" tone="muted" transform={`translate(44 ${(ISO_Y[0] + ISO_Y[3]) / 2}) rotate(-90)`}>
        ISOFORMS
      </Label>
      <path d={`M58 ${ISO_Y[0] - 10} V${ISO_Y[3] + 4}`} stroke="var(--line-strong)" strokeWidth="1" />

      <g fontSize={r2(16 * ka)} textAnchor="middle" fontWeight={500}>
        <text x={xs(REF_CELLS)} y={REF_Y + 5} fill="var(--muted)">
          {chars(REF_CELLS)}
        </text>
        <text x={COL_X(VAR_J)} y={REF_Y + 5} fill="var(--fg)">
          C
        </text>
        <path d={`M68 ${REF_Y + 18} H548`} stroke="var(--line)" strokeWidth="1" />

        {TRACKS.isoforms.map((iso, i) => (
          <g key={i}>
            <text x={xs(iso.plain)} y={ISO_Y[i] + 5} fill="var(--subtle)">
              {chars(iso.plain)}
            </text>
            {iso.variant ? (
              <text x={COL_X(iso.variant.j)} y={ISO_Y[i] + 5} fill="var(--accent)" fontWeight={650}>
                {iso.variant.ch}
              </text>
            ) : null}
          </g>
        ))}
      </g>
      {/* skipped exons: splice carets */}
      <g stroke="var(--muted)" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
        {TRACKS.isoforms.map((iso, i) =>
          iso.intron ? (
            <path
              key={i}
              d={`M${iso.intron.x1} ${ISO_Y[i]} L${iso.intron.mid} ${ISO_Y[i] - 7} L${iso.intron.x2} ${ISO_Y[i]}`}
            />
          ) : null,
        )}
      </g>

      {/* scan line sweeping the isoforms */}
      <m.g
        initial={false}
        animate={run ? { x: [0, 470], opacity: [0, 1, 1, 0] } : { x: 0, opacity: 0 }}
        transition={
          run
            ? { x: { duration: 10, ease: "linear", repeat: Infinity }, opacity: { duration: 10, times: [0, 0.05, 0.95, 1], repeat: Infinity } }
            : SETTLE
        }
      >
        <rect x={40} y={84} width={30} height={146} fill={`url(#${id.scan})`} />
        <line x1={70} y1={84} x2={70} y2={230} stroke="var(--fg)" strokeOpacity="0.3" strokeWidth="1" />
      </m.g>

      {/* variant marker */}
      <m.g
        initial={false}
        animate={run ? { y: [0, -3, 0] } : { y: 0 }}
        transition={run ? loop(2.8) : SETTLE}
      >
        <path
          d={`M${COL_X(VAR_J)} 262 V246 M${COL_X(VAR_J) - 4.5} 251 L${COL_X(VAR_J)} 246 L${COL_X(VAR_J) + 4.5} 251`}
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </m.g>
      <Label x={COL_X(VAR_J) + 14} y={261} size={L} tone="accent-text">
        VARIANT
        <tspan fill="var(--muted)" fontSize={S} dx="10">
          C → T
        </tspan>
      </Label>

      {/* conformal prediction set */}
      <m.path
        d={`M${SET_X - 104} 280 V286 H${SET_X + 104} V280 M${SET_X} 286 V292`}
        stroke="var(--muted)"
        strokeWidth="1.1"
        initial={false}
        animate={{ pathLength: run ? [0, 1] : 1 }}
        transition={run ? { duration: 1, delay: 0.3, ease: EASE_DRAW } : SETTLE}
      />
      <Label x={SET_X} y={setY} anchor="middle" tone="muted">
        PREDICTION SET{" "}
        <tspan fill="var(--fg)" style={{ letterSpacing: "0.04em" }}>
          {"{benign, pathogenic}"}
        </tspan>
      </Label>
      <Label x={SET_X} y={noteY} anchor="middle" tone="muted" style={{ letterSpacing: "0.04em" }}>
        both kept → uncertain
      </Label>

      <path d={`M24 ${ruleY} H576`} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" />

      {/* ── molecule ── */}
      <circle cx={RING_C.x} cy={RING_C.y} r={22} stroke="var(--line-strong)" strokeWidth="1" />
      <g stroke="var(--muted)" strokeWidth="1.25" strokeLinecap="round">
        {BONDS.map(([a, b]) => (
          <line key={`${a}${b}`} {...trimmed(nodes[a], nodes[b], nodeR(a), nodeR(b))} />
        ))}
        {/* C=O second line */}
        <line x1={nodes.b2.x + 5} y1={nodes.b2.y + 8} x2={nodes.b5.x + 5} y2={nodes.b5.y - 11} />
      </g>

      {/* attention wave */}
      {WAVE.map((hop, L) =>
        hop.map(([a, b]) => (
          <m.line
            key={`${a}${b}`}
            {...trimmed(nodes[a], nodes[b], nodeR(a), nodeR(b))}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            {...pulse(hopStart(L))}
          />
        )),
      )}

      {Object.entries(nodes).map(([k, n]) =>
        n.el ? (
          <g key={k}>
            <circle cx={n.x} cy={n.y} r={atomR} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1" />
            <text x={n.x} y={r2(n.y + 5 * ka)} textAnchor="middle" fontSize={r2(17 * ka)} fontWeight={600} fill="var(--fg)">
              {n.el}
            </text>
          </g>
        ) : (
          <circle key={k} cx={n.x} cy={n.y} r={3.4} fill="var(--fg)" fillOpacity="0.8" />
        ),
      )}
      {ARRIVAL.map(([key, at]) => (
        <m.circle
          key={`f-${key}`}
          cx={nodes[key].x}
          cy={nodes[key].y}
          r={nodes[key].el ? r2(atomR + 4) : 9}
          stroke="var(--accent)"
          strokeWidth="1.25"
          initial={false}
          {...flash(at)}
        />
      ))}

      {/* readout → 23 endpoints */}
      <line {...READOUT} stroke="var(--muted)" strokeWidth="1.1" strokeDasharray="2 3" />
      <m.line
        {...READOUT}
        stroke="var(--accent)"
        strokeWidth="1.5"
        initial={false}
        {...pulse(hopStart(WAVE.length), 0.6, 0.6)}
      />
      <path d={TRUNK_D} stroke="var(--line-strong)" strokeWidth="1.1" />
      <path d={TICK_D} stroke="var(--muted)" strokeWidth="1.1" />
      <m.g
        initial={false}
        animate={run ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 0 }}
        transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, FAN_T, FAN_T + 0.3, FAN_T + 1.9, FAN_T + 2.5, CYCLE]), repeat: Infinity } : SETTLE}
      >
        <path d={TRUNK_D} stroke="var(--accent)" strokeWidth="1.25" />
      </m.g>
      {/* endpoints light top → bottom */}
      {FAN_Y.map((y, k) => {
        const t = FAN_T + 0.25 + k * 0.05;
        return (
          <m.path
            key={k}
            d={`M${COMB_X} ${y} H${COMB_X + 14}`}
            stroke="var(--accent)"
            strokeWidth="1.5"
            initial={false}
            animate={run ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 0 }}
            transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, t, t + 0.12, FAN_T + 1.9, FAN_T + 2.5, CYCLE]), repeat: Infinity } : SETTLE}
          />
        );
      })}
      <rect x={POOL.x - 7} y={POOL.y - 7} width={14} height={14} rx={2} fill="var(--surface)" stroke="var(--fg)" strokeWidth="1.25" />
      <Label x={COMB_X + 24} y={r2(POOL.y + S * 0.35)} tone="muted">
        ×23
      </Label>

      <Label x={24} y={576} tone="muted">
        GATv2 · 23 ADMET ENDPOINTS
      </Label>
    </Figure>
  );
}
