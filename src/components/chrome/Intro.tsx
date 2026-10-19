import { useEffect, useRef } from "react";
import { profile } from "@/content/site";
import { finishIntro, INTRO_DONE, isIntroPending } from "@/lib/intro";
import { isMotionPaused } from "@/lib/motionPref";
import { getLenis } from "@/lib/scroll";
import "./intro.css";

/* ───────────── The mark: a seeded halftone coronagraph frame ─────────────
   Computed once at module load with a fixed seed, so the prerendered SVG and
   the client render are byte-identical. Same optics as the hero field
   (occulter, halo, Airy rings, rolled JWST spikes) in ~170 dots. */

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();

const FIELD_R = 104;
const STEP = 13.5;
const R_OCC = 23;
const ORB = { a: 74, b: 34, rot: -0.98 };
const ROLL = -0.28;
const SPIKES = [
  { ang: Math.PI / 2 + ROLL, amp: 1, len: 74 },
  { ang: Math.PI / 6 + ROLL, amp: 0.8, len: 56 },
  { ang: (5 * Math.PI) / 6 + ROLL, amp: 0.8, len: 56 },
  { ang: ROLL, amp: 0.3, len: 26 },
];

/** the companion sits on the drawn orbit, upper right, between the 2nd and 3rd ring */
const COMP = (() => {
  const phi = 0.35;
  const ex = ORB.a * Math.cos(phi);
  const ey = ORB.b * Math.sin(phi);
  const c = Math.cos(ORB.rot);
  const s = Math.sin(ORB.rot);
  return { x: ex * c - ey * s, y: ex * s + ey * c };
})();

type Dot = { x: string; y: string; r: string; cls: string };

const DOTS: Dot[] = (() => {
  const rand = mulberry32(1012);
  const out: Dot[] = [];
  const rowH = STEP * 0.8660254;
  const rows = Math.ceil(FIELD_R / rowH);
  const axes = SPIKES.map((sp) => ({ ux: Math.cos(sp.ang), uy: Math.sin(sp.ang), amp: sp.amp, len: sp.len }));
  const r1 = 1.75 * R_OCC;
  const r2 = 2.6 * R_OCC;
  const r3 = 3.45 * R_OCC;
  const ring = (d: number, r: number) => Math.exp(-((d - r) * (d - r)) / (2 * 4.6 * 4.6));
  for (let row = -rows; row <= rows; row++) {
    const y = row * rowH;
    const off = row & 1 ? STEP / 2 : 0;
    const cols = Math.ceil(FIELD_R / STEP) + 1;
    for (let col = -cols; col <= cols; col++) {
      const x = col * STEP + off;
      const d = Math.hypot(x, y);
      if (d > FIELD_R) continue;
      const o = smooth(R_OCC * 0.8, R_OCC * 1.06, d);
      const halo = d > R_OCC * 0.7 ? Math.min(0.7, 0.55 * Math.exp(-(d - R_OCC) / 8)) : 0;
      const rg = 0.4 * ring(d, r1) + 0.24 * ring(d, r2) + 0.13 * ring(d, r3);
      let sp = 0;
      for (const a of axes) {
        const along = Math.abs(x * a.ux + y * a.uy);
        const perp = Math.abs(x * a.uy - y * a.ux);
        const w = 3.4 + 2.6 * Math.exp(-along / 30);
        sp += a.amp * Math.exp(-(perp * perp) / (2 * w * w)) * Math.exp(-along / a.len);
      }
      const noise = rand();
      let b = (halo + rg + sp + noise * 0.1) * o * smooth(FIELD_R, FIELD_R - 24, d);
      // a clean patch for the companion
      b *= 1 - Math.exp(-((x - COMP.x) ** 2 + (y - COMP.y) ** 2) / (2 * 9 * 9));

      const q = b < 0.045 ? 0 : b < 0.12 ? 1 : b < 0.24 ? 2 : b < 0.4 ? 3 : b < 0.6 ? 4 : 5;
      const r = q ? 0.8 + 4.3 * Math.sqrt(Math.min(1, b)) : 1.5 + rand() * 1.3;
      // noise phase: random size + brightness, independent of what the dot resolves to
      const noiseR = 0.9 + rand() * 3;
      const kr = noiseR / r;
      const k = kr < 0.4 ? 0 : kr < 0.62 ? 1 : kr < 0.87 ? 2 : kr < 1.2 ? 3 : kr < 1.7 ? 4 : 5;
      const z = Math.min(3, Math.floor(rand() * 4));
      const w = Math.min(6, Math.floor((d / FIELD_R) * 6.4 + rand() * 0.8));
      out.push({ x: f1(x), y: f1(y), r: f1(r), cls: `i-dot z${z} k${k} q${q} w${w}` });
    }
  }
  return out;
})();

/** halftone companion: a small hex cluster, as the hero draws its planet */
const COMP_DOTS = [
  { x: 0, y: 0, r: 3.6 },
  ...Array.from({ length: 6 }, (_, i) => ({
    x: 6.4 * Math.cos((i * Math.PI) / 3),
    y: 6.4 * Math.sin((i * Math.PI) / 3),
    r: 1.9,
  })),
];

const RET = 15;
const ARM = 5;
const RET_PATH = [-1, 1]
  .flatMap((qx) => [-1, 1].map((qy) => [qx, qy] as const))
  .map(([qx, qy]) => {
    const cx = COMP.x + qx * RET;
    const cy = COMP.y + qy * RET;
    return `M${f1(cx - qx * ARM)} ${f1(cy)}H${f1(cx)}V${f1(cy - qy * ARM)}`;
  })
  .join("");

/* ───────────── Timeline (ms from the first frame of the CSS animations) ───────────── */
/** the mark has resolved and the name is in: the curtain starts lifting */
const LIFT_AT = 1180;
const LIFT_MS = 780;
/** slow device, skip, or a late mount: lift straight away, quicker */
const FAST_LIFT_MS = 460;
/** past this, a mount is "late": the visitor has looked at the curtain long enough */
const LATE_MOUNT = 1500;
/** never trap the page: hard release this long after mount */
const FAILSAFE_MS = 3200;
const EASE_IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";

/**
 * One-per-session curtain. Always rendered (identical on server and client);
 * CSS hides it unless the inline script set html.intro-pending. The mark
 * resolves in CSS; this effect only schedules the lift, handles skip and
 * guarantees release. No React renders while it runs.
 */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    const html = document.documentElement;
    window.__akaIntroMounted = true;
    window.clearTimeout(window.__akaIntroT);

    if (!root || !inner) return;
    if (!isIntroPending()) {
      // skipped (Esc / tap) before hydration: remember it for the session
      if (window.__akaIntroSkip) finishIntro();
      return;
    }

    let lifting = false;
    let done = false;
    const timers: number[] = [];
    const anims: Animation[] = [];

    const lenisRaf = requestAnimationFrame(() => getLenis()?.stop());

    const release = () => {
      if (done) return;
      done = true;
      finishIntro();
      html.classList.remove("intro-lifting");
      getLenis()?.start();
    };

    const lift = (ms: number) => {
      if (lifting || done) return;
      lifting = true;
      html.classList.add("intro-lifting");
      window.dispatchEvent(new Event(INTRO_DONE));
      getLenis()?.start();
      if (typeof root.animate !== "function") return release();
      anims.push(
        inner.animate(
          [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(-6vh)", opacity: 0 },
          ],
          { duration: ms * 0.8, easing: EASE_IN_OUT, fill: "forwards" },
        ),
      );
      const curtain = root.animate([{ clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)" }], {
        duration: ms,
        easing: EASE_IN_OUT,
        fill: "forwards",
      });
      anims.push(curtain);
      curtain.finished.then(release, () => {});
    };

    // How long has the curtain been on screen? The prerendered mark starts resolving at
    // first paint, so on a slow device most of it has played before this effect runs.
    const ref = nameRef.current?.getAnimations?.()[0];
    const elapsed = typeof ref?.currentTime === "number" ? ref.currentTime : 0;
    // a late mount after a curtain that has already been up a while: don't hold it any longer
    const late = performance.now() > LATE_MOUNT && elapsed > 300;

    if (isMotionPaused()) {
      // motion is switched off for this visitor: no curtain move at all
      timers.push(window.setTimeout(release, 0));
    } else if (late) {
      timers.push(window.setTimeout(() => lift(FAST_LIFT_MS), 0));
    } else {
      timers.push(window.setTimeout(() => lift(LIFT_MS), Math.max(0, LIFT_AT - elapsed)));
    }
    timers.push(window.setTimeout(release, FAILSAFE_MS));

    // something else dropped the flag (another failsafe): stand down cleanly
    const mo = new MutationObserver(() => {
      if (!isIntroPending() && !done) {
        done = true;
        html.classList.remove("intro-lifting");
        getLenis()?.start();
      }
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });

    const skip = () => lift(FAST_LIFT_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    root.addEventListener("pointerdown", skip);

    return () => {
      mo.disconnect();
      cancelAnimationFrame(lenisRaf);
      timers.forEach((t) => window.clearTimeout(t));
      anims.forEach((a) => a.cancel());
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("pointerdown", skip);
      // a remount (StrictMode) re-runs this effect from a clean curtain
      if (!done) html.classList.remove("intro-lifting");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-intro=""
      aria-hidden="true"
      className="fixed inset-0 z-[150] cursor-pointer select-none bg-bg text-fg"
    >
      <div ref={innerRef} className="flex h-full -translate-y-[3vh] flex-col items-center justify-center px-6">
        <svg
          viewBox="-112 -112 224 224"
          className="block aspect-square w-[clamp(176px,28vmin,264px)] overflow-visible"
          focusable="false"
        >
          <g fill="var(--fg)">
            {DOTS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} className={d.cls} />
            ))}
          </g>
          <ellipse
            className="i-orbit"
            rx={ORB.a}
            ry={ORB.b}
            transform={`rotate(${f1((ORB.rot * 180) / Math.PI)})`}
            fill="none"
            stroke="var(--fg)"
            strokeOpacity="0.26"
            strokeWidth="0.8"
            strokeDasharray="1.4 4.2"
          />
          <circle
            className="i-ring"
            r={R_OCC * 0.98}
            pathLength={1}
            fill="none"
            stroke="var(--fg)"
            strokeOpacity="0.5"
            strokeWidth="0.9"
          />
          <circle className="i-core" r="1.8" fill="var(--fg)" fillOpacity="0.6" />
          <g className="i-comp" fill="var(--accent)">
            {COMP_DOTS.map((c, i) => (
              <circle
                key={i}
                cx={f1(COMP.x + c.x)}
                cy={f1(COMP.y + c.y)}
                r={c.r}
                fillOpacity={i ? 0.7 : 1}
              />
            ))}
          </g>
          <path className="i-ret" d={RET_PATH} fill="none" stroke="var(--accent)" strokeWidth="1.1" />
        </svg>

        <p className="mt-8 overflow-hidden pb-[0.08em] md:mt-10">
          <span
            ref={nameRef}
            className="i-name block whitespace-nowrap font-display text-[clamp(2rem,6vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]"
          >
            {profile.name}
          </span>
        </p>
        <p className="i-meta label-mono mt-4 text-[0.66rem] text-muted md:text-[0.72rem]">
          research · builds · papers — {profile.location.split(",")[0]}
        </p>
      </div>
    </div>
  );
}
