import { m } from "motion/react";
import { useMemo } from "react";
import { EASE_DRAW, Figure, Label, SETTLE, norm, polarPath, r2, textW, useRun, useScale, useUid } from "./shared";

/**
 * 02 · CT slice + experts (schematic).
 * A stylised axial abdominal CT at kidney level: tumour contoured in accent,
 * a millimetre stone ringed in a second tone — and the class-conditional
 * router that sends each region to one of four LoRA experts.
 */

const BX = 300;
const BY = 222;

/** superellipse body outline — rounder anteriorly, flatter across the back */
function bodyPath(a: number, b: number, nTop: number, nBottom: number, steps = 120) {
  let d = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const n = s < 0 ? nTop : nBottom;
    const x = BX + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
    const y = BY + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    d += `${i ? " L" : "M"}${r2(x)} ${r2(y)}`;
  }
  return `${d} Z`;
}

const BODY = bodyPath(212, 140, 2.1, 2.7);
const WALL = bodyPath(198, 127, 2.1, 2.7);

/** bean with a modest hilum notch toward +x, ~58 × 50 */
const BEAN =
  "M22 -10 C26 -18 18 -25 4 -25 C-14 -25 -34 -16 -35 0 C-34 16 -14 25 4 25 C18 25 26 18 22 10 C18 7 17 3 17 0 C17 -3 18 -7 22 -10 Z";
/** renal sinus + pelvis, in the same local frame */
const SINUS = "M19 -6 C12 -9 7 -5 7 0 C7 5 12 9 19 6";
/** corticomedullary boundary hint */
const CORTEX = "M-28 -5 C-24 -15 -10 -19 4 -19 M-28 5 C-24 15 -10 19 4 19";

const KIDNEY_L = "translate(196 272) rotate(-38) scale(1.12)";
const KIDNEY_R = "translate(404 272) scale(-1 1) rotate(-38) scale(1.12)";

const TUMOUR = { x: 163, y: 254 };
const TUMOUR_D = polarPath(
  TUMOUR.x,
  TUMOUR.y,
  (t) => 18 + 2.2 * Math.sin(3 * t + 0.7) + 1.3 * Math.sin(5 * t + 2.1) + 0.7 * Math.sin(7 * t + 0.3),
  64,
);
const STONE = { x: 392, y: 267 };

/** inferior tip of the liver's right lobe, hugging the flank */
const LIVER = { cx: 136, cy: 186, rx: 44, ry: 58, rot: 24 };
const SPLEEN = "M480 212 C502 236 502 284 478 308 C470 288 466 244 480 212 Z";
/** bowel loops: [cx, cy, rx, ry, rotation] */
const BOWEL: [number, number, number, number, number][] = [
  [314, 146, 16, 13, -20],
  [354, 124, 12, 10, 10],
  [394, 152, 17, 14, 25],
  [344, 186, 11, 9, 0],
  [432, 138, 12, 11, 0],
  [298, 192, 8, 7, 0],
  [452, 192, 14, 15, 0],
  [262, 176, 10, 8, 30],
];

/* ── router ── */
const ROUTER = { x: 300, y: 438 };
const EXPERT_NAMES = ["NORMAL", "TUMOUR", "STONE", "EDGE"];
const EXPERT_Y = 502;

/**
 * Scale-dependent layout. Callout labels rise clear of the body outline as the
 * type grows (baseline 160 at k = 1 → 124 at k = 1.45), with leaders whose
 * horizontal run underlines the label; experts spread so their names never touch.
 */
function layout(k: number, L: number, S: number) {
  const t = Math.min(1, Math.max(0, (k - 1) / 0.45));
  const ly = r2(160 - 36 * t);
  const ey = ly + 8;
  const tEnd = r2(24 + textW(6, L) + 8);
  const sEnd = r2(576 - textW(5, L) - 8);
  const gap = Math.max(90, r2(textW(6, S) + 26));
  const experts = EXPERT_NAMES.map((name, i) => ({ name, x: r2(ROUTER.x + (i - 1.5) * gap), y: EXPERT_Y }));
  return {
    ly,
    tLeader: `M${TUMOUR.x - 13} ${TUMOUR.y - 13} L${tEnd} ${ey} L24 ${ey}`,
    sLeader: `M${STONE.x + 7} ${STONE.y - 7} L${sEnd} ${ey} L576 ${ey}`,
    experts,
    routes: experts.map(
      (e) => `M${ROUTER.x} ${ROUTER.y + 11} C${ROUTER.x} ${ROUTER.y + 38} ${e.x} ${e.y - 36} ${e.x} ${e.y - 9}`,
    ),
  };
}

const CYCLE = 12; // four 3 s phases, one per expert
/** at rest (inactive / reduced motion) the tumour route stays lit */
const RESTING = 1;
const phase = (i: number) => ({ s: i * 3 + 0.2, e: i * 3 + 2.9 });

export function RenalVisual({ active, className }: { active: boolean; className?: string }) {
  const run = useRun(active);
  const uid = useUid("renal");
  const id = { clip: uid("clip"), hatch: uid("hatch"), scan: uid("scan") };
  const { k, L, S } = useScale();
  const { ly, tLeader, sLeader, experts, routes } = useMemo(() => layout(k, L, S), [k, L, S]);

  return (
    <Figure className={className}>
      <defs>
        <clipPath id={id.clip}>
          <path d={WALL} />
        </clipPath>
        <pattern id={id.hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--fg)" strokeOpacity="0.13" strokeWidth="1" />
        </pattern>
        <linearGradient id={id.scan} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <Label x={24} y={34} tone="muted">
        AXIAL CT
      </Label>
      <Label x={576} y={34} anchor="end" tone="muted">
        MoE-RenalSAM
      </Label>

      {/* ── body ── */}
      <path
        d={BODY}
        fill="color-mix(in srgb, var(--fg) 5%, var(--surface))"
        stroke="var(--muted)"
        strokeOpacity="0.7"
        strokeWidth="1.25"
      />
      <path d={WALL} stroke="var(--line-strong)" strokeWidth="1" />

      <g clipPath={`url(#${id.clip})`}>
        {/* liver + spleen: hatched parenchyma */}
        <ellipse
          cx={LIVER.cx}
          cy={LIVER.cy}
          rx={LIVER.rx}
          ry={LIVER.ry}
          transform={`rotate(${LIVER.rot} ${LIVER.cx} ${LIVER.cy})`}
          fill={`url(#${id.hatch})`}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        <path d={SPLEEN} fill={`url(#${id.hatch})`} stroke="var(--line-strong)" strokeWidth="1" />

        {/* bowel loops */}
        <g stroke="var(--line-strong)" strokeWidth="1">
          {BOWEL.map(([x, y, rx, ry, rot], i) => (
            <g key={i} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
              <ellipse cx={x} cy={y} rx={rx} ry={ry} />
              {rx > 13 ? <ellipse cx={x} cy={y} rx={rx - 5} ry={ry - 5} strokeDasharray="1.5 3.5" /> : null}
            </g>
          ))}
        </g>

        {/* vessels */}
        <circle cx={316} cy={246} r={10} fill="color-mix(in srgb, var(--fg) 12%, transparent)" stroke="var(--muted)" strokeWidth="1" />
        <ellipse cx={276} cy={245} rx={12} ry={8} fill="color-mix(in srgb, var(--fg) 8%, transparent)" stroke="var(--muted)" strokeOpacity="0.7" strokeWidth="1" />

        {/* psoas + paraspinal muscles */}
        <g fill="color-mix(in srgb, var(--fg) 4%, transparent)" stroke="var(--line-strong)" strokeWidth="1">
          <ellipse cx={262} cy={292} rx={13} ry={19} transform="rotate(-16 262 292)" />
          <ellipse cx={338} cy={292} rx={13} ry={19} transform="rotate(16 338 292)" />
          <ellipse cx={266} cy={334} rx={23} ry={14} />
          <ellipse cx={334} cy={334} rx={23} ry={14} />
        </g>

        {/* vertebra */}
        <g stroke="var(--muted)" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round">
          <circle cx={300} cy={281} r={22} fill="color-mix(in srgb, var(--fg) 14%, transparent)" />
          <circle cx={300} cy={281} r={14} stroke="var(--line-strong)" strokeWidth="1" />
          <path d="M286 298 L282 312 Q288 330 300 332 Q312 330 318 312 L314 298" fill="color-mix(in srgb, var(--fg) 10%, transparent)" />
          <circle cx={300} cy={313} r={7.5} fill="var(--surface)" strokeWidth="1" />
          <path d="M300 332 L300 348 M283 309 L254 316 M317 309 L346 316" />
        </g>

        {/* kidneys */}
        <g fill="color-mix(in srgb, var(--fg) 10%, transparent)" stroke="var(--muted)" strokeWidth="1.25">
          <path d={BEAN} transform={KIDNEY_L} />
          <path d={BEAN} transform={KIDNEY_R} />
        </g>
        <g stroke="var(--line-strong)" strokeWidth="1" strokeLinecap="round">
          <path d={SINUS} transform={KIDNEY_L} />
          <path d={SINUS} transform={KIDNEY_R} />
          <path d={CORTEX} transform={KIDNEY_L} strokeDasharray="1.5 3" />
          <path d={CORTEX} transform={KIDNEY_R} strokeDasharray="1.5 3" />
        </g>

        {/* scanner sweep */}
        <m.g
          initial={false}
          animate={run ? { y: [0, 286], opacity: [0, 1, 1, 0] } : { y: 0, opacity: 0 }}
          transition={
            run
              ? { y: { duration: 9, ease: "linear", repeat: Infinity }, opacity: { duration: 9, times: [0, 0.08, 0.9, 1], repeat: Infinity } }
              : SETTLE
          }
        >
          <rect x={88} y={52} width={424} height={30} fill={`url(#${id.scan})`} />
          <line x1={88} y1={82} x2={512} y2={82} stroke="var(--fg)" strokeOpacity="0.28" strokeWidth="1" />
        </m.g>
      </g>

      {/* ── tumour: the signal ── */}
      <m.path
        d={TUMOUR_D}
        fill="var(--accent)"
        stroke="none"
        initial={false}
        animate={run ? { opacity: [0.16, 0.16, 0.36, 0.36, 0.16, 0.16] } : { opacity: 0.16 }}
        transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, 3.7, 4.1, 5.5, 5.9, CYCLE]), repeat: Infinity } : SETTLE}
      />
      <m.path
        d={TUMOUR_D}
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: run ? [0, 1] : 1 }}
        transition={run ? { duration: 1.4, delay: 0.3, ease: EASE_DRAW } : SETTLE}
      />

      {/* ── stone: second tone ── */}
      <circle cx={STONE.x} cy={STONE.y} r={3.2} fill="var(--fg)" />
      <m.circle
        cx={STONE.x}
        cy={STONE.y}
        r={10}
        stroke="var(--fg)"
        strokeWidth="1.1"
        strokeDasharray="2.5 2.5"
        initial={false}
        animate={run ? { scale: [1, 1, 1.35, 1, 1], rotate: [0, 0, 45, 90, 90] } : { scale: 1, rotate: 0 }}
        transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, 6.7, 7.3, 8.2, CYCLE]), repeat: Infinity } : SETTLE}
      />

      {/* callouts */}
      <path d={tLeader} stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="1" />
      <Label x={24} y={ly} size={L} tone="accent-text">
        TUMOUR
      </Label>
      <path d={sLeader} stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
      <Label x={576} y={ly} size={L} anchor="end" tone="fg">
        STONE
      </Label>

      {/* ── mixture-of-experts router ── */}
      <path d={`M${ROUTER.x} 374 V${ROUTER.y - 17}`} stroke="var(--line-strong)" strokeWidth="1.25" />
      <path
        d={`M${ROUTER.x - 4} ${ROUTER.y - 22} L${ROUTER.x} ${ROUTER.y - 16} L${ROUTER.x + 4} ${ROUTER.y - 22}`}
        stroke="var(--muted)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Label x={ROUTER.x + 14} y={398} tone="muted">
        ENCODER · FROZEN
      </Label>

      {routes.map((d, i) => (
        <path key={i} d={d} stroke="var(--line-strong)" strokeWidth="1.25" />
      ))}
      {routes.map((d, i) => {
        const { s, e } = phase(i);
        return (
          <m.path
            key={i}
            d={d}
            stroke="var(--accent)"
            strokeWidth="1.5"
            initial={false}
            animate={run ? { pathLength: [0, 0, 1, 1, 1, 0], opacity: [1, 1, 1, 1, 0, 0] } : { pathLength: 1, opacity: i === RESTING ? 1 : 0 }}
            transition={run ? { duration: CYCLE, times: norm(CYCLE, [0, s, s + 0.7, e - 0.4, e, CYCLE]), repeat: Infinity, ease: "easeInOut" } : SETTLE}
          />
        );
      })}

      {/* router node + pulse */}
      <m.circle
        cx={ROUTER.x}
        cy={ROUTER.y}
        r={14}
        stroke="var(--accent)"
        strokeWidth="1"
        initial={false}
        animate={run ? { scale: [1, 1, 1.7], opacity: [0, 0.7, 0] } : { scale: 1, opacity: 0 }}
        transition={run ? { duration: 3, times: [0, 0.06, 0.45], repeat: Infinity, ease: "easeOut" } : SETTLE}
      />
      <path
        d={`M${ROUTER.x} ${ROUTER.y - 11} L${ROUTER.x + 11} ${ROUTER.y} L${ROUTER.x} ${ROUTER.y + 11} L${ROUTER.x - 11} ${ROUTER.y} Z`}
        fill="var(--surface)"
        stroke="var(--fg)"
        strokeWidth="1.25"
      />
      <Label x={ROUTER.x - 22} y={r2(ROUTER.y + S * 0.33)} anchor="end" tone="muted">
        ROUTER
      </Label>

      {experts.map((ex, i) => {
        const { s, e } = phase(i);
        const lit = run
          ? { animate: { opacity: [0, 0, 1, 1, 0, 0] }, transition: { duration: CYCLE, times: norm(CYCLE, [0, s + 0.55, s + 0.8, e - 0.4, e, CYCLE]), repeat: Infinity } }
          : { animate: { opacity: i === RESTING ? 1 : 0 }, transition: SETTLE };
        return (
          <g key={ex.name}>
            <circle cx={ex.x} cy={ex.y} r={7} fill="var(--surface)" stroke="var(--muted)" strokeWidth="1.25" />
            <Label x={ex.x} y={ex.y + 15 + S} anchor="middle" tone="muted">
              {ex.name}
            </Label>
            <m.g initial={false} {...lit}>
              <circle cx={ex.x} cy={ex.y} r={7} fill="var(--accent)" />
              <circle cx={ex.x} cy={ex.y} r={12} stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1" />
              <Label x={ex.x} y={ex.y + 15 + S} anchor="middle" tone="accent-text">
                {ex.name}
              </Label>
            </m.g>
          </g>
        );
      })}

      <Label x={24} y={576} tone="muted">
        DICE 88.2 · 84.1 · SAM2 + LoRA
      </Label>
    </Figure>
  );
}
