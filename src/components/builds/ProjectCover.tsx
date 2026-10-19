import { useId, useMemo, type ReactNode } from "react";
import type { Build, CoverMotif } from "@/content/site";
import { cn } from "@/lib/cn";

/* ────────────────────────────────────────────────────────────────────────────
   ProjectCover — a small generative poster per project.
   Deterministic (seeded by slug) so prerendered and hydrated markup match.
   Neutral, theme-aware base (surface-2, hairlines); build.hue is the only colour.
   ──────────────────────────────────────────────────────────────────────────── */

const W = 640;
const H = 400;

/** FNV-1a string hash → 32-bit seed */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — tiny seeded PRNG, returns [0, 1) */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
/** `live`: run the motif's looping detail (only while the cover is actually on screen) */
type MotifProps = { hue: string; rng: Rng; uid: string; live: boolean };

const CAPTION: Record<CoverMotif, string> = {
  legal: "Grounded draft",
  invoice: "OCR · deskew",
  clinic: "Live queue",
  crypto: "AES · ShiftRows",
  map: "Site plan",
  planner: "Activity",
  anomaly: "Anomaly map",
  tracking: "Multi-object tracking",
  citation: "Cited answer",
  arcade: "Stage select",
  storefront: "Menu",
};

const mono = "font-mono";
const r1 = (n: number) => Math.round(n * 10) / 10;

/* ───────────── motifs ───────────── */

function Legal({ hue, rng }: MotifProps) {
  // Draft page: lines with superscript citation markers…
  const lines: { y: number; w: number; mark?: number }[] = [];
  let mark = 0;
  for (let i = 0; i < 11; i++) {
    if (i === 5) continue; // paragraph break
    const y = 112 + i * 20;
    const cited = i === 1 || i === 4 || i === 8;
    const w = r1(cited ? 128 + rng() * 40 : 150 + rng() * 46);
    lines.push({ y, w, mark: cited ? ++mark : undefined });
  }
  // …each tied by a thin line to a highlighted passage on the source page
  const passages = [
    { y: 128, rows: 2 },
    { y: 208, rows: 1 },
    { y: 272, rows: 2 },
  ];
  const srcLines = Array.from({ length: 13 }, (_, j) => ({ y: 114 + j * 16, w: r1(118 + rng() * 46) }));

  return (
    <g>
      {/* source stack */}
      <rect x="398" y="74" width="196" height="262" rx="6" fill="var(--surface)" stroke="var(--line)" transform="rotate(3.5 496 205)" />
      <rect x="384" y="62" width="200" height="274" rx="6" fill="var(--surface)" stroke="var(--line-strong)" />
      <text x="402" y="90" className={mono} fontSize="9" letterSpacing="1.6" fill="var(--muted)">
        SOURCE
      </text>
      {passages.map((p, k) => (
        <g key={k}>
          <rect x="396" y={p.y - 9} width="176" height={p.rows * 16 + 2} rx="3" fill={hue} fillOpacity="0.16" />
          <rect x="390" y={p.y - 9} width="2" height={p.rows * 16 + 2} fill={hue} />
        </g>
      ))}
      {srcLines.map((l, j) => (
        <rect key={j} x="402" y={l.y - 3} width={l.w} height="5" rx="2.5" fill="var(--muted)" fillOpacity="0.3" />
      ))}

      {/* draft */}
      <rect x="56" y="58" width="252" height="284" rx="6" fill="var(--surface)" stroke="var(--line-strong)" />
      <text x="76" y="86" className={mono} fontSize="9" letterSpacing="1.6" fill="var(--muted)">
        DRAFT
      </text>
      <rect x="230" y="78" width="58" height="12" rx="6" fill="none" stroke={hue} strokeOpacity="0.7" />
      <text x="259" y="87" textAnchor="middle" className={mono} fontSize="7" letterSpacing="1" fill={hue}>
        3 CITED
      </text>
      {lines.map((l, i) => (
        <g key={i}>
          <rect
            x="76"
            y={l.y - 3}
            width={l.w}
            height="6"
            rx="3"
            fill={l.mark ? "var(--fg)" : "var(--muted)"}
            fillOpacity={l.mark ? 0.5 : 0.3}
          />
          {l.mark ? (
            <g>
              <circle cx={76 + l.w + 12} cy={l.y - 5} r="6.5" fill={hue} />
              <text
                x={76 + l.w + 12}
                y={l.y - 2.2}
                textAnchor="middle"
                className={mono}
                fontSize="8"
                fontWeight="700"
                fill="var(--surface-2)"
              >
                {l.mark}
              </text>
            </g>
          ) : null}
        </g>
      ))}

      {/* grounding links */}
      {lines
        .filter((l) => l.mark)
        .map((l, k) => {
          const x0 = 76 + l.w + 18.5;
          const y0 = l.y - 5;
          const p = passages[k];
          const y1 = p.y - 9 + (p.rows * 16 + 2) / 2;
          return (
            <g key={k}>
              <path
                d={`M${x0} ${y0} C ${x0 + 60} ${y0}, ${330} ${y1}, ${388} ${y1}`}
                fill="none"
                stroke={hue}
                strokeOpacity="0.8"
                strokeWidth="1.1"
              />
              <circle cx="388" cy={y1} r="2.4" fill={hue} />
            </g>
          );
        })}
    </g>
  );
}

function Invoice({ hue, rng }: MotifProps) {
  const left = 176;
  const right = 336;
  const top = 56;
  const bottom = 324;
  let zig = `M${left} ${top} H${right} V${bottom}`;
  const steps = 16;
  const step = (right - left) / steps;
  for (let i = 1; i <= steps; i++) zig += ` L${right - i * step} ${i % 2 ? bottom + 9 : bottom}`;
  zig += " Z";

  const rows = Array.from({ length: 6 }, (_, i) => ({
    y: 126 + i * 26,
    lw: r1(46 + rng() * 34),
    vw: r1(26 + rng() * 20),
    boxed: i !== 1 && i !== 4,
    conf: (0.86 + rng() * 0.13).toFixed(2),
  }));

  return (
    <g>
      {/* where the page will land once deskewed */}
      <rect x={left} y={top} width={right - left} height={bottom - top + 9} rx="2" fill="none" stroke="var(--line-strong)" strokeDasharray="4 5" />
      <g transform="rotate(-7 256 190)">
        <path d={zig} fill="var(--surface)" stroke="var(--line-strong)" strokeLinejoin="round" />
        <text x={left + 18} y={top + 34} className="font-display" fontSize="19" fontWeight="600" fill="var(--fg)" fillOpacity="0.85">
          INVOICE
        </text>
        <rect x={left + 18} y={top + 44} width="64" height="4" rx="2" fill="var(--muted)" fillOpacity="0.35" />
        <line x1={left + 18} x2={right - 18} y1={top + 58} y2={top + 58} stroke="var(--line-strong)" />
        {rows.map((r, i) => {
          const vx = right - 18 - r.vw;
          return (
            <g key={i}>
              <rect x={left + 18} y={r.y - 2.5} width={r.lw} height="5" rx="2.5" fill="var(--muted)" fillOpacity="0.32" />
              <rect x={vx} y={r.y - 2.5} width={r.vw} height="5" rx="2.5" fill="var(--fg)" fillOpacity="0.5" />
              {r.boxed ? (
                <g>
                  <rect x={vx - 6} y={r.y - 9} width={r.vw + 12} height="18" rx="3" fill={hue} fillOpacity="0.1" stroke={hue} strokeWidth="1.1" />
                  <text x={vx - 9} y={r.y + 3} textAnchor="end" className={mono} fontSize="7.5" fill={hue}>
                    {r.conf}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        <line x1={left + 18} x2={right - 18} y1="286" y2="286" stroke="var(--line-strong)" />
        <text x={left + 18} y="306" className={mono} fontSize="9" letterSpacing="1.4" fill="var(--muted)">
          TOTAL
        </text>
        <rect x={right - 78} y="294" width="60" height="18" rx="3" fill={hue} fillOpacity="0.18" stroke={hue} strokeWidth="1.4" />
        <rect x={right - 70} y="300.5" width="44" height="5" rx="2.5" fill="var(--fg)" fillOpacity="0.7" />
      </g>

      {/* deskew arrow */}
      <path d="M352 84 A 190 190 0 0 1 384 170" fill="none" stroke={hue} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M377 163 L384.5 171 L389 160.5" fill="none" stroke={hue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="396" y="122" className={mono} fontSize="9" letterSpacing="1.4" fill={hue}>
        DESKEW
      </text>

      {/* consistency checks */}
      <text x="446" y="232" className="font-display" fontSize="44" fontWeight="600" letterSpacing="-1.5" fill="var(--fg)">
        4/4
      </text>
      <text x="448" y="252" className={mono} fontSize="8.5" letterSpacing="1.4" fill="var(--muted)">
        CHECKS PASSED
      </text>
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i} transform={`translate(${448 + i * 26} 266)`}>
          <rect width="18" height="18" rx="4" fill={hue} fillOpacity="0.16" stroke={hue} />
          <path d="M5 9.5 L8 12.5 L13.5 6" fill="none" stroke={hue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
}

function Clinic({ hue }: MotifProps) {
  const queue = ["A-013", "A-014", "A-015", "A-016", "A-017"];
  return (
    <g>
      <rect x="48" y="58" width="372" height="282" rx="16" fill="var(--surface)" stroke="var(--line-strong)" />
      <text x="76" y="98" className={mono} fontSize="11" letterSpacing="3" fill="var(--muted)">
        NOW SERVING
      </text>
      <circle cx="384" cy="94" r="4" fill={hue} />
      <text x="372" y="97.5" textAnchor="end" className={mono} fontSize="9" letterSpacing="1.6" fill={hue}>
        LIVE
      </text>
      <text x="70" y="236" className="font-display" fontSize="118" fontWeight="600" letterSpacing="-5" fill={hue}>
        A-012
      </text>
      <line x1="76" x2="392" y1="272" y2="272" stroke="var(--line-strong)" />
      <text x="76" y="304" className={mono} fontSize="10" letterSpacing="1.8" fill="var(--muted)">
        PLEASE PROCEED TO COUNTER
      </text>
      <text x="392" y="306" textAnchor="end" className="font-display" fontSize="22" fontWeight="600" fill="var(--fg)">
        02
      </text>

      <text x="456" y="86" className={mono} fontSize="9" letterSpacing="1.8" fill="var(--muted)">
        QUEUE
      </text>
      {queue.map((t, k) => {
        const y = 128 + k * 44;
        return (
          <g key={t} opacity={1 - k * 0.15}>
            <text x="456" y={y} className={mono} fontSize="17" fontWeight="500" fill="var(--fg)">
              {t}
            </text>
            {k === 0 ? (
              <text x="596" y={y - 1} textAnchor="end" className={mono} fontSize="8" letterSpacing="1.4" fill={hue}>
                NEXT
              </text>
            ) : (
              <rect x={560} y={y - 6} width={36 - k * 4} height="4" rx="2" fill="var(--muted)" fillOpacity="0.35" />
            )}
            <line x1="456" x2="596" y1={y + 16} y2={y + 16} stroke="var(--line)" />
          </g>
        );
      })}
    </g>
  );
}

function Crypto({ hue, rng }: MotifProps) {
  const cell = 52;
  const gap = 8;
  const x0 = 112;
  const y0 = 76;
  const bytes = Array.from({ length: 16 }, () =>
    Math.floor(rng() * 256)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase(),
  );
  const shiftRow = 1;
  const shift = 30; // mid-shift, to the left
  const steps = ["SubBytes", "ShiftRows", "MixColumns", "AddRoundKey"];

  return (
    <g>
      {Array.from({ length: 4 }, (_, r) => (
        <text key={r} x={x0 - 42} y={y0 + r * (cell + gap) + cell / 2 + 3} textAnchor="end" className={mono} fontSize="9" fill="var(--subtle)">
          r{r}
        </text>
      ))}
      {bytes.map((b, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        const active = r === shiftRow;
        const x = x0 + c * (cell + gap) - (active ? shift : 0);
        const y = y0 + r * (cell + gap);
        const leaving = active && c === 0;
        return (
          <g key={i} opacity={leaving ? 0.35 : 1}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx="8"
              fill={active ? hue : "var(--surface)"}
              fillOpacity={active ? 0.14 : 1}
              stroke={active ? hue : "var(--line-strong)"}
            />
            <text x={x + cell / 2} y={y + cell / 2 + 6} textAnchor="middle" className={mono} fontSize="17" fontWeight="500" fill="var(--fg)" fillOpacity="0.88">
              {b}
            </text>
          </g>
        );
      })}
      {/* the byte that wraps around to the end of the row */}
      {(() => {
        const y = y0 + shiftRow * (cell + gap);
        const x = x0 + 4 * (cell + gap) - shift;
        return (
          <g>
            <rect x={x} y={y} width={cell} height={cell} rx="8" fill="none" stroke={hue} strokeDasharray="3 4" />
            <text x={x + cell / 2} y={y + cell / 2 + 6} textAnchor="middle" className={mono} fontSize="17" fontWeight="500" fill={hue}>
              {bytes[4]}
            </text>
          </g>
        );
      })()}
      <path d={`M${x0 + 150} ${y0 + cell + gap - 7} H${x0 + 70}`} stroke={hue} strokeWidth="1.4" strokeLinecap="round" />
      <path d={`M${x0 + 76} ${y0 + cell + gap - 11} L${x0 + 70} ${y0 + cell + gap - 7} L${x0 + 76} ${y0 + cell + gap - 3}`} fill="none" stroke={hue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

      {/* round structure */}
      <text x="420" y="120" className="font-display" fontSize="46" fontWeight="600" letterSpacing="-1.5" fill="var(--fg)">
        AES
      </text>
      <text x="422" y="142" className={mono} fontSize="8.5" letterSpacing="1.6" fill="var(--muted)">
        ONE ROUND, FROM SCRATCH
      </text>
      {steps.map((s, i) => {
        const y = 182 + i * 34;
        const on = i === 1;
        return (
          <g key={s}>
            <circle cx="425" cy={y - 4} r="3.5" fill={on ? hue : "none"} stroke={on ? hue : "var(--line-strong)"} />
            {i < steps.length - 1 ? <line x1="425" x2="425" y1={y + 2} y2={y + 26} stroke="var(--line-strong)" /> : null}
            <text x="441" y={y} className={mono} fontSize="12" fill={on ? hue : "var(--muted)"}>
              {s}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SitePlan({ hue, rng, live }: MotifProps) {
  const posts = [
    { x: 150, y: 124 },
    { x: 340, y: 112 },
    { x: 498, y: 104 },
    { x: 172, y: 280 },
    { x: 366, y: 266 },
    { x: 506, y: 288 },
  ].map((p, i) => ({ ...p, staffed: i === 2 ? true : i === 3 ? false : rng() > 0.35 }));
  const pulse = 2;
  return (
    <g>
      {/* blueprint grid */}
      {Array.from({ length: 33 }, (_, i) => (
        <line key={`v${i}`} x1={i * 20} x2={i * 20} y1="0" y2={H} stroke={i % 5 === 0 ? "var(--line-strong)" : "var(--line)"} strokeWidth={i % 5 === 0 ? 1 : 0.6} />
      ))}
      {Array.from({ length: 21 }, (_, i) => (
        <line key={`h${i}`} y1={i * 20} y2={i * 20} x1="0" x2={W} stroke={i % 5 === 0 ? "var(--line-strong)" : "var(--line)"} strokeWidth={i % 5 === 0 ? 1 : 0.6} />
      ))}
      {/* floor plan */}
      <g fill="none" stroke="var(--fg)" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="square">
        <path d="M80 60 H560 V340 H80 Z" />
        <path d="M260 60 V150 M260 190 V200 M80 200 H200 M240 200 H420 M420 140 V250 M420 290 V340 M460 200 H560" />
      </g>
      <g fill="none" stroke="var(--fg)" strokeOpacity="0.25" strokeWidth="1">
        <path d="M260 150 A 40 40 0 0 1 300 190" />
        <path d="M200 200 A 40 40 0 0 0 240 160" />
      </g>
      {posts.map((p, i) => (
        <g key={i}>
          {i === pulse && live ? (
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              fill={hue}
              fillOpacity="0.35"
              className="animate-ping motion-reduce:hidden"
              style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: "2.2s" }}
            />
          ) : null}
          {p.staffed ? (
            <>
              <circle cx={p.x} cy={p.y} r="13" fill="none" stroke={hue} strokeOpacity="0.35" />
              <circle cx={p.x} cy={p.y} r="6.5" fill={hue} />
            </>
          ) : (
            <circle cx={p.x} cy={p.y} r="6.5" fill="var(--surface-2)" stroke={hue} strokeWidth="1.5" strokeDasharray="2.6 2.6" />
          )}
          <text x={p.x + 18} y={p.y + 3.5} className={mono} fontSize="8.5" letterSpacing="1" fill="var(--muted)">
            P-0{i + 1}
          </text>
        </g>
      ))}
      <g transform="translate(456 36)">
        <circle cx="0" cy="-3" r="4" fill={hue} />
        <text x="9" y="0" className={mono} fontSize="8.5" letterSpacing="1.4" fill="var(--muted)">
          STAFFED
        </text>
        <circle cx="86" cy="-3" r="4" fill="none" stroke={hue} strokeDasharray="2 2" />
        <text x="95" y="0" className={mono} fontSize="8.5" letterSpacing="1.4" fill="var(--muted)">
          VACANT
        </text>
      </g>
    </g>
  );
}

function Planner({ hue, rng }: MotifProps) {
  const cols = 28;
  const rows = 7;
  const s = 14;
  const g = 4;
  const x0 = (W - (cols * (s + g) - g)) / 2;
  const y0 = 108;
  const levels = [0, 0.25, 0.48, 0.72, 1];
  return (
    <g>
      {["M", "W", "F"].map((d, i) => (
        <text key={d} x={x0 - 14} y={y0 + (i * 2 + 1) * (s + g) + 10} textAnchor="end" className={mono} fontSize="8.5" fill="var(--subtle)">
          {d}
        </text>
      ))}
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = Math.floor(i / rows);
        const r = i % rows;
        const weekend = r === 5 || r === 6;
        const v = rng() * (weekend ? 0.6 : 1) + c / cols / 3;
        const lvl = v < 0.3 ? 0 : v < 0.55 ? 1 : v < 0.75 ? 2 : v < 0.9 ? 3 : 4;
        return (
          <rect
            key={i}
            x={x0 + c * (s + g)}
            y={y0 + r * (s + g)}
            width={s}
            height={s}
            rx="3"
            fill={lvl ? hue : "var(--line)"}
            fillOpacity={lvl ? levels[lvl] : 1}
          />
        );
      })}
      <g transform={`translate(${W - x0 - 112} ${y0 + rows * (s + g) + 22})`}>
        <text x="-8" y="10" textAnchor="end" className={mono} fontSize="8.5" fill="var(--muted)">
          LESS
        </text>
        {levels.map((l, i) => (
          <rect key={i} x={i * 18} y="0" width="14" height="14" rx="3" fill={i ? hue : "var(--line)"} fillOpacity={i ? l : 1} />
        ))}
        <text x="96" y="10" className={mono} fontSize="8.5" fill="var(--muted)">
          MORE
        </text>
      </g>
    </g>
  );
}

function Anomaly({ hue, rng }: MotifProps) {
  const cols = 16;
  const rows = 9;
  const s = 26;
  const g = 4;
  const x0 = (W - (cols * (s + g) - g)) / 2;
  const y0 = 64;
  const cx = 10.5;
  const cy = 4.2;
  return (
    <g>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const d2 = (c - cx) ** 2 + ((r - cy) * 1.2) ** 2;
        const score = Math.exp(-d2 / 5) + rng() * 0.06;
        const hot = score > 0.1;
        return (
          <rect
            key={i}
            x={x0 + c * (s + g)}
            y={y0 + r * (s + g)}
            width={s}
            height={s}
            rx="4"
            fill={hot ? hue : "var(--surface)"}
            fillOpacity={hot ? Math.min(1, score) : 1}
            stroke={hot ? "none" : "var(--line)"}
          />
        );
      })}
      <circle cx={x0 + cx * (s + g) + s / 2} cy={y0 + cy * (s + g) + s / 2} r="78" fill="none" stroke={hue} strokeDasharray="4 5" />
      <text x={x0 + cx * (s + g) + 70} y={y0 + cy * (s + g) - 62} className={mono} fontSize="9" letterSpacing="1.6" fill={hue}>
        ANOMALY
      </text>
    </g>
  );
}

function Tracking({ hue, rng }: MotifProps) {
  const boxes = [
    { x: 96, y: 150, w: 64, h: 128, id: 3 },
    { x: 214, y: 120, w: 58, h: 116, id: 7 },
    { x: 404, y: 166, w: 70, h: 140, id: 4 },
    { x: 520, y: 132, w: 54, h: 106, id: 9 },
  ];
  return (
    <g>
      <line x1="40" x2="600" y1="320" y2="320" stroke="var(--line-strong)" />
      <line x1="340" x2="340" y1="60" y2="336" stroke="var(--fg)" strokeOpacity="0.45" strokeDasharray="5 6" />
      <text x="350" y="74" className={mono} fontSize="8.5" letterSpacing="1.6" fill="var(--muted)">
        COUNT LINE
      </text>
      {boxes.map((b, i) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const dir = i % 2 ? -1 : 1;
        const trail = Array.from({ length: 5 }, (_, k) => ({
          x: r1(cx - dir * (k + 1) * 18),
          y: r1(cy + (rng() - 0.5) * 10 + k * 2),
        }));
        return (
          <g key={b.id}>
            <polyline points={[{ x: cx, y: cy }, ...trail].map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={hue} strokeOpacity="0.45" strokeDasharray="3 4" />
            {trail.map((p, k) => (
              <circle key={k} cx={p.x} cy={p.y} r={2.2 - k * 0.3} fill={hue} fillOpacity={0.6 - k * 0.1} />
            ))}
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={hue} fillOpacity="0.07" stroke={hue} strokeWidth="1.5" />
            <rect x={b.x - 0.75} y={b.y - 16} width="38" height="15" rx="2" fill={hue} />
            <text x={b.x + 5} y={b.y - 5.5} className={mono} fontSize="8.5" fontWeight="700" fill="var(--surface-2)">
              ID {b.id}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Citation({ hue, rng }: MotifProps) {
  const lines = Array.from({ length: 6 }, (_, i) => ({ y: 186 + i * 20, w: r1(250 + rng() * 120) }));
  return (
    <g>
      <rect x="140" y="58" width="360" height="40" rx="20" fill="var(--surface)" stroke="var(--line-strong)" />
      <circle cx="164" cy="78" r="9" fill="none" stroke={hue} />
      <text x="164" y="82" textAnchor="middle" className={mono} fontSize="10" fontWeight="700" fill={hue}>
        ?
      </text>
      <rect x="184" y="75" width="220" height="6" rx="3" fill="var(--fg)" fillOpacity="0.5" />
      <rect x="104" y="124" width="432" height="212" rx="14" fill="var(--surface)" stroke="var(--line-strong)" />
      <text x="128" y="156" className={mono} fontSize="9" letterSpacing="1.6" fill="var(--muted)">
        ANSWER · FROM YOUR DOCUMENTS
      </text>
      {lines.map((l, i) => {
        const cited = i === 1 || i === 4;
        return (
          <g key={i}>
            {cited ? <rect x="122" y={l.y - 8} width={l.w + 12} height="16" rx="3" fill={hue} fillOpacity="0.16" /> : null}
            <rect x="128" y={l.y - 3} width={l.w} height="6" rx="3" fill={cited ? "var(--fg)" : "var(--muted)"} fillOpacity={cited ? 0.55 : 0.3} />
            {cited ? (
              <text x={128 + l.w + 12} y={l.y - 1} className={mono} fontSize="9" fontWeight="700" fill={hue}>
                [{i === 1 ? 1 : 2}]
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

function Arcade({ hue, rng }: MotifProps) {
  const u = 16;
  const back: number[] = [];
  const front: number[] = [];
  let hb = 6;
  let hf = 3;
  for (let i = 0; i < W / u; i++) {
    hb = Math.max(3, Math.min(10, hb + Math.round((rng() - 0.5) * 3)));
    hf = Math.max(1, Math.min(6, hf + Math.round((rng() - 0.5) * 2.4)));
    back.push(hb);
    front.push(hf);
  }
  const ground = 304;
  return (
    <g>
      {back.map((h, i) => (
        <rect key={`b${i}`} x={i * u} y={ground - h * u} width={u} height={h * u} fill={hue} fillOpacity="0.18" />
      ))}
      {front.map((h, i) => (
        <rect key={`f${i}`} x={i * u} y={ground - h * u} width={u} height={h * u} fill={hue} fillOpacity="0.42" />
      ))}
      <rect x="0" y={ground} width={W} height={u / 2} fill={hue} />
      {/* pixel sun */}
      {[
        [2, 0, 3],
        [1, 1, 5],
        [0, 2, 7],
        [0, 3, 7],
        [0, 4, 7],
        [1, 5, 5],
        [2, 6, 3],
      ].map(([x, y, w], i) => (
        <rect key={i} x={470 + x * 8} y={64 + y * 8} width={w * 8} height="8" fill="var(--fg)" fillOpacity="0.75" />
      ))}
      <text x="64" y="96" className={mono} fontSize="10" letterSpacing="2" fill="var(--muted)">
        CHAPTER
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} transform={`translate(${64 + i * 26} 108)`}>
          <rect width="18" height="18" fill={i === 0 ? hue : "none"} stroke={i === 0 ? hue : "var(--line-strong)"} />
          <text x="9" y="12.5" textAnchor="middle" className={mono} fontSize="9" fontWeight="700" fill={i === 0 ? "var(--surface-2)" : "var(--muted)"}>
            {i + 1}
          </text>
        </g>
      ))}
    </g>
  );
}

function Storefront({ hue }: MotifProps) {
  const cx = 320;
  const cy = 196;
  let d = "";
  for (let t = 0; t <= Math.PI * 5; t += 0.08) {
    const r = 6 + 9.2 * t;
    d += `${d ? " L" : "M"}${r1(cx + r * Math.cos(t))} ${r1(cy + r * Math.sin(t))}`;
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r="156" fill={hue} fillOpacity="0.1" stroke={hue} strokeOpacity="0.4" />
      <path d={d} fill="none" stroke={hue} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={hue} />
    </g>
  );
}

const MOTIFS: Record<CoverMotif, (p: MotifProps) => ReactNode> = {
  legal: Legal,
  invoice: Invoice,
  clinic: Clinic,
  crypto: Crypto,
  map: SitePlan,
  planner: Planner,
  anomaly: Anomaly,
  tracking: Tracking,
  citation: Citation,
  arcade: Arcade,
  storefront: Storefront,
};

export function ProjectCover({
  build,
  className,
  live = false,
}: {
  build: Build;
  className?: string;
  /** true only while the cover is visible — gates looping details such as the site-plan ping */
  live?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const draw = MOTIFS[build.motif] ?? Anomaly;
  // Motifs are plain functions called with a fresh PRNG on every evaluation,
  // so server, client and StrictMode double-renders all produce identical art.
  const art = useMemo(
    () => draw({ hue: build.hue, rng: mulberry32(hash(build.slug)), uid, live }),
    [draw, build.hue, build.slug, uid, live],
  );

  // Art fills the frame (slice); the poster furniture is pinned to the top-left and
  // bottom edges (meet) so it never crops when a card stretches its media taller than 16:10.
  const layer = "absolute inset-0 block h-full w-full";
  return (
    <span aria-hidden="true" className={cn("relative block h-full w-full overflow-hidden", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false" className={layer}>
        <defs>
          <pattern id={`${uid}-dots`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="0.9" fill="var(--line-strong)" />
          </pattern>
          <radialGradient id={`${uid}-fade`} cx="0.15" cy="0.1" r="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.75" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={`${uid}-mask`}>
            <rect width={W} height={H} fill={`url(#${uid}-fade)`} />
          </mask>
        </defs>
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="var(--surface-2)" />
        <rect width={W} height={H} fill={`url(#${uid}-dots)`} mask={`url(#${uid}-mask)`} />
        {art}
      </svg>

      {/* poster furniture */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMin meet" focusable="false" className={layer}>
        <g className={mono} fontSize="10.5" letterSpacing="1.8">
          <rect x="24" y="27" width="7" height="7" rx="1.5" fill={build.hue} />
          <text x="39" y="34" fill="var(--muted)">
            {CAPTION[build.motif].toUpperCase()}
          </text>
        </g>
      </svg>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMax meet" focusable="false" className={layer}>
        <g className={mono} fontSize="10.5" letterSpacing="1.8">
          <line x1="24" x2={W - 24} y1="354" y2="354" stroke="var(--line)" />
          <text x="24" y="379" fill="var(--fg)" fillOpacity="0.8">
            {build.name.toUpperCase()}
          </text>
        </g>
      </svg>
    </span>
  );
}
