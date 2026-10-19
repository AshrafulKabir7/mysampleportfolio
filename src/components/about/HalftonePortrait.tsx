import { animate, m, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { profile } from "@/content/site";
import { EASE_OUT } from "@/components/primitives/Reveal";
import { useFinePointer, useReducedMotionPref } from "@/lib/hooks";
import { cn } from "@/lib/cn";

/* ───────────────────────── halftone field ─────────────────────────
   The photo is sampled into luminance, then redrawn as a hex grid of dots
   whose area follows the ink (darkness) of each cell. On first view the dots
   start as seeded static and settle into the portrait — signal from noise. */

/** Framing in photo coordinates (0..1): the figure's centre, how much of the photo's
 *  width to show when the frame allows it, and where the top of the hair should sit. */
const SUBJECT_U = 0.465;
const SHOW_W = 0.66; // tall frames
const SHOW_W_WIDE = 0.56; // squat (mobile) frames: closer to a bust
const TOP_V = 0.12;
const TOP_AT = 0.1;

type Box = { x: number; y: number; w: number; h: number };

/** Zoom toward the subject but never leave the frame uncovered (cover-fit as the floor). */
function frameBox(w: number, h: number, iw: number, ih: number): Box {
  const s = Math.max(w / ((w / h > 0.75 ? SHOW_W_WIDE : SHOW_W) * iw), h / ih);
  const bw = iw * s;
  const bh = ih * s;
  const clampTo = (v: number, lo: number) => Math.min(0, Math.max(lo, v));
  return {
    x: clampTo(w / 2 - SUBJECT_U * bw, w - bw),
    y: clampTo(TOP_AT * h - TOP_V * bh, h - bh),
    w: bw,
    h: bh,
  };
}

const CELL = 7; // px between dot centres (frames from 420px wide)
const CELL_NARROW = 5; // phones / half-width tiles: more dots across the face
const cellFor = (w: number) => (w < 420 ? CELL_NARROW : CELL);
const LENS = 108; // px radius of the pointer lens
const RESOLVE_S = 1.9; // seconds for noise → portrait
const SSR_RADIUS = 2400; // clip radius that shows the whole photo before hydration

type Field = {
  n: number;
  w: number;
  h: number;
  dpr: number;
  x: Float32Array;
  y: Float32Array;
  r: Float32Array; // final radius
  nr: Float32Array; // noise radius table
  jx: Float32Array;
  jy: Float32Array;
  d: Float32Array; // per-dot delay 0..1
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0: number, e1: number, v: number) => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

function buildField(
  img: HTMLImageElement,
  box: Box,
  w: number,
  h: number,
  dpr: number,
  light: boolean,
  cell: number,
): Field {
  // Luminance at half resolution, cropped exactly like object-fit: cover
  const sw = Math.max(1, Math.round(w / 2));
  const sh = Math.max(1, Math.round(h / 2));
  const off = document.createElement("canvas");
  off.width = sw;
  off.height = sh;
  const octx = off.getContext("2d", { willReadFrequently: true });
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  // where the photo lands in frame coordinates (same box as the <img>)
  const { x: dx, y: dy, w: dw, h: dh } = box;
  let data: Uint8ClampedArray | null = null;
  if (octx && iw && ih) {
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(img, dx / 2, dy / 2, dw / 2, dh / 2);
    data = octx.getImageData(0, 0, sw, sh).data;
  }
  /** mean luminance + saturation of the 3×3 half-res pixels around a dot */
  const sample = (cx: number, cy: number): [number, number] => {
    if (!data) return [1, 0];
    const px = Math.round(cx / 2);
    const py = Math.round(cy / 2);
    let sl = 0;
    let ss = 0;
    let cnt = 0;
    for (let oy = -1; oy <= 1; oy++) {
      const yy = py + oy;
      if (yy < 0 || yy >= sh) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const xx = px + ox;
        if (xx < 0 || xx >= sw) continue;
        const k = (yy * sw + xx) * 4;
        const r = data[k] / 255;
        const g = data[k + 1] / 255;
        const b = data[k + 2] / 255;
        const mx = Math.max(r, g, b);
        sl += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        ss += mx > 0 ? (mx - Math.min(r, g, b)) / mx : 0;
        cnt++;
      }
    }
    return cnt ? [sl / cnt, ss / cnt] : [1, 0];
  };

  const rowH = cell * 0.866;
  const rows = Math.ceil(h / rowH) + 1;
  const cols = Math.ceil(w / cell) + 1;
  const n = rows * cols;
  const f: Field = {
    n,
    w,
    h,
    dpr,
    x: new Float32Array(n),
    y: new Float32Array(n),
    r: new Float32Array(n),
    nr: new Float32Array(n),
    jx: new Float32Array(n),
    jy: new Float32Array(n),
    d: new Float32Array(n),
  };
  const rand = mulberry32(0x5eed1f);
  const maxR = cell * 0.5;
  let i = 0;
  for (let j = 0; j < rows; j++) {
    const y = rowH * (j + 0.25);
    const xo = j % 2 ? cell / 2 : 0;
    for (let c = 0; c < cols; c++) {
      const x = cell * c + xo;
      const [l, sat] = sample(x, y);
      // the pale, colourless wall is background: drop it so only the subject carries ink
      const wall = smooth(0.6, 0.72, l) * (1 - smooth(0.06, 0.12, sat));
      // soft head + torso silhouette (photo coordinates) mutes the wall's corner line
      const u = (x - dx) / dw;
      const v = (y - dy) / dh;
      const hx = (u - 0.448) / 0.15;
      const hy = (v - 0.28) / 0.17;
      const head = 1 - smooth(0.85, 1.05, Math.sqrt(hx * hx + hy * hy));
      const torso = (1 - smooth(0.25, 0.29, Math.abs(u - 0.468))) * smooth(0.34, 0.41, v);
      // the wall light-switch beside the neck sits inside the head ellipse: cut it out
      const sw = Math.hypot((u - 0.562) / 0.032, (v - 0.369) / 0.022);
      const subject = (1 - wall) * Math.max(head, torso) * smooth(0.8, 1, sw);
      // light theme: dark ink marks shadows (newsprint); dark theme: light ink marks highlights,
      // with the mid-tones stretched first so evenly lit skin still shows eyes, brows and beard
      const tone = light ? clamp01((1 - l - 0.04) / 0.86) : 0.06 + 0.94 * Math.pow(smooth(0.22, 0.85, l), 1.35);
      f.x[i] = x;
      f.y[i] = y;
      f.r[i] = maxR * Math.sqrt(tone * subject);
      f.nr[i] = maxR * 0.85 * Math.pow(rand(), 2.2);
      f.jx[i] = (rand() - 0.5) * cell * 2.2;
      f.jy[i] = (rand() - 0.5) * cell * 2.2;
      f.d[i] = 0.62 * (y / h) + 0.38 * rand();
      i++;
    }
  }
  return f;
}

function paintField(ctx: CanvasRenderingContext2D, f: Field, t: number, frame: number, color: string) {
  ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  ctx.clearRect(0, 0, f.w, f.h);
  ctx.fillStyle = color;
  ctx.beginPath();
  const done = t >= 1;
  const shift = frame * 131;
  for (let i = 0; i < f.n; i++) {
    let r: number;
    let x = f.x[i];
    let y = f.y[i];
    if (done) {
      r = f.r[i];
    } else {
      let p = (t - f.d[i] * 0.55) / 0.45;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      const e = 1 - (1 - p) * (1 - p) * (1 - p);
      const nz = f.nr[(i * 7 + shift) % f.n];
      r = nz + (f.r[i] - nz) * e;
      x += f.jx[i] * (1 - e);
      y += f.jy[i] * (1 - e);
    }
    if (r < 0.4) continue;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

function readInk() {
  return getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#edeae4";
}

/* ───────────────────────── component ───────────────────────── */

export function HalftonePortrait({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const [ready, setReady] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [cell, setCell] = useState(CELL);

  // refs mirror state for pointer handlers (no re-render in pointermove)
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const pinnedRef = useRef(false);
  const readyRef = useRef(false);
  const reduceRef = useRef(reduce);
  const fineRef = useRef(fine);
  reduceRef.current = reduce;
  fineRef.current = fine;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 420, damping: 36, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 420, damping: 36, mass: 0.5 });
  const rad = useMotionValue(SSR_RADIUS);
  const ringOpacity = useMotionValue(0);
  // the clip lives in the img box's coordinates, which is offset from the frame
  const offX = useMotionValue(0);
  const offY = useMotionValue(0);
  const cx = useTransform([sx, offX], ([a, b]: number[]) => a + b);
  const cy = useTransform([sy, offY], ([a, b]: number[]) => a + b);
  const clip = useMotionTemplate`circle(${rad}px at ${cx}px ${cy}px)`;
  const ringScale = useTransform(rad, (v) => Math.min(v, 400) / 100);

  const moveTo = (x: number, y: number, snap: boolean) => {
    px.set(x);
    py.set(y);
    if (snap) {
      sx.jump(x);
      sy.jump(y);
    }
  };

  const retarget = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const full = Math.hypot(wrap.clientWidth, wrap.clientHeight) * 1.1;
    let target: number;
    if (reduceRef.current || !readyRef.current) target = full;
    else if (pinnedRef.current || focusRef.current) target = full;
    else if (hoverRef.current) target = LENS;
    else target = 0;
    const quick = reduceRef.current;
    animate(rad, target, quick ? { duration: 0 } : { duration: target === LENS ? 0.5 : 0.75, ease: EASE_OUT });
    const ringOn = !reduceRef.current && readyRef.current && hoverRef.current && !pinnedRef.current && !focusRef.current;
    animate(ringOpacity, ringOn ? 1 : 0, { duration: quick ? 0 : 0.3 });
  };

  /* draw + animate the dot field */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!wrap || !canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let field: Field | null = null;
    let ink = readInk();
    let elapsed = reduce ? RESOLVE_S : 0;
    let started = reduce;
    let visible = false;
    let raf = 0;
    let last = 0;
    let resizeTimer = 0;
    const slow =
      window.matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
    const frameMs = slow ? 1000 / 30 : 0;

    const paint = () => {
      if (field) paintField(ctx, field, Math.min(1, elapsed / RESOLVE_S), Math.floor(elapsed * 14), ink);
    };
    const running = () => !!field && started && visible && !document.hidden && elapsed < RESOLVE_S;
    const tick = (now: number) => {
      raf = 0;
      if (!running()) {
        last = 0;
        return;
      }
      if (last && frameMs && now - last < frameMs - 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      elapsed += dt;
      paint();
      if (elapsed < RESOLVE_S) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && running()) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const rebuild = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h || !img.naturalWidth) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      try {
        // place the photo on the same box the dots are sampled from (written straight to the DOM)
        const box = frameBox(w, h, img.naturalWidth, img.naturalHeight);
        Object.assign(img.style, {
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.w}px`,
          height: `${box.h}px`,
          maxWidth: "none",
        });
        offX.set(-box.x);
        offY.set(-box.y);
        const c = cellFor(w);
        setCell(c);
        field = buildField(img, box, w, h, dpr, document.documentElement.classList.contains("light"), c);
      } catch {
        field = null; // e.g. a tainted canvas: keep the plain photo
        return;
      }
      paint();
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
        moveTo(w / 2, h * 0.32, true);
        retarget();
      }
      kick();
    };

    if (img.complete && img.naturalWidth) rebuild();
    else img.addEventListener("load", rebuild, { once: true });

    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 140);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (entry.intersectionRatio >= 0.3) started = true;
        kick();
      },
      { threshold: [0, 0.3] },
    );
    io.observe(wrap);

    // the tone mapping flips with the theme, so rebuild rather than just recolour
    const onTheme = () => {
      ink = readInk();
      rebuild();
    };
    window.addEventListener("themechange", onTheme);
    document.addEventListener("visibilitychange", kick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      img.removeEventListener("load", rebuild);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("themechange", onTheme);
      document.removeEventListener("visibilitychange", kick);
    };
  }, [reduce]);

  // reduced-motion flips after hydration: settle the clip accordingly
  useEffect(() => {
    if (readyRef.current) retarget();
  }, [reduce]);

  const local = (e: PointerEvent | MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const interactive = ready && !reduce;

  return (
    <div
      ref={wrapRef}
      className={cn("@container absolute inset-0 overflow-hidden", className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse" || !fineRef.current || reduceRef.current) return;
        hoverRef.current = true;
        const p = local(e);
        moveTo(p.x, p.y, !pinnedRef.current && !focusRef.current);
        retarget();
      }}
      onPointerMove={(e) => {
        if (!hoverRef.current) return;
        const p = local(e);
        px.set(p.x);
        py.set(p.y);
      }}
      onPointerLeave={() => {
        if (!hoverRef.current) return;
        hoverRef.current = false;
        retarget();
      }}
    >
      {/* the dot field (underneath the photo, which is clipped to a lens) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 size-full transition-opacity duration-700",
          reduce ? "z-[2] opacity-[0.16]" : "z-0",
          !ready && "opacity-0",
        )}
      />
      <m.img
        ref={imgRef}
        src={profile.portrait}
        alt="Portrait of Ashraful Kabir Alif"
        width={864}
        height={1184}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 z-[1] size-full select-none object-cover object-[46%_22%] grayscale contrast-[1.08]"
        style={{ clipPath: clip, WebkitClipPath: clip }}
      />
      {/* accent reticle that rides the lens edge */}
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[2] -ml-[100px] -mt-[100px] size-[200px] rounded-full border border-accent"
        style={{ x: sx, y: sy, scale: ringScale, opacity: ringOpacity }}
      />

      {/* tap / keyboard toggle — the image itself stays the accessible element */}
      {interactive ? (
        <button
          type="button"
          aria-pressed={pinned}
          aria-label="Resolve portrait (show full photo)"
          data-cursor={fine ? (pinned ? "Halftone" : "Pin photo") : undefined}
          className="absolute inset-0 z-[3] size-full cursor-pointer rounded-[20px] outline-offset-[-4px]"
          onClick={(e) => {
            pinnedRef.current = !pinnedRef.current;
            setPinned(pinnedRef.current);
            if (pinnedRef.current && !hoverRef.current) {
              // keyboard activation reports (0,0): open from the face instead
              const w = wrapRef.current!;
              const p = e.detail === 0 ? null : local(e);
              const inside = p && p.x >= 0 && p.y >= 0 && p.x <= w.clientWidth && p.y <= w.clientHeight;
              if (inside) moveTo(p.x, p.y, true);
              else moveTo(w.clientWidth / 2, w.clientHeight * 0.32, true);
            }
            retarget();
          }}
          onFocus={(e) => {
            if (!e.currentTarget.matches(":focus-visible")) return;
            focusRef.current = true;
            const w = wrapRef.current;
            if (w && !hoverRef.current) moveTo(w.clientWidth / 2, w.clientHeight * 0.32, true);
            retarget();
          }}
          onBlur={() => {
            if (!focusRef.current) return;
            focusRef.current = false;
            retarget();
          }}
        />
      ) : null}

      {/* figure meta, top */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-center justify-between gap-3 p-4 transition-opacity duration-500 md:p-5",
          interactive ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="label-mono whitespace-nowrap rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[0.62rem] text-muted">
          Fig. 05<span className="hidden @min-[26rem]:inline"> — Halftone, {cell} px</span>
        </span>
        <span className="label-mono min-w-0 truncate rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[0.62rem] text-muted">
          {pinned ? (
            <>
              {fine ? "Pinned" : "Photo"}
              <span className="hidden @min-[20rem]:inline">{fine ? " · click to undo" : " · tap to undo"}</span>
            </>
          ) : fine ? (
            "Hover to resolve"
          ) : (
            "Tap to resolve"
          )}
        </span>
      </div>
    </div>
  );
}
