/**
 * SignalField — a halftone "coronagraph" frame rendered on a 2D canvas.
 *
 * A hex lattice of dots whose size/alpha encode brightness:
 *   speckle noise (drifting value noise)  +  a star PSF (halo, Airy rings,
 *   JWST-style hexagonal diffraction spikes) hidden behind an occulter mask
 *   +  one faint planet on a slow elliptical orbit, drawn in the accent colour.
 * A pointer "attention" gaussian gently lifts dots near the cursor.
 *
 * Everything that does not move is precomputed per dot on resize; the frame
 * loop only adds noise, the planet and attention. No per-frame allocations;
 * dots are bucketed by level in one counting pass, then drawn one path per level.
 */

export type FieldRect = { l: number; t: number; r: number; b: number };

/**
 * Where the foreground copy sits, in canvas CSS px (layout boxes, transforms ignored).
 * Read on every rebuild so the star, its orbit and the calm zones follow the real layout.
 */
export type TextLayout = {
  /** right edge of the text column (wide layouts keep the field calm left of it) */
  right: number;
  /** top of the copy under the name (thesis) — narrow layouts are calm below it */
  top: number;
  /** top of the whole copy column (status row) */
  copyTop: number;
  /** top / bottom / right edge of the name */
  nameTop: number;
  nameBottom: number;
  nameRight: number;
  /** small text the field keeps clear of (status line, captions, toggles) */
  holes: FieldRect[];
};

export type SignalFieldOptions = {
  /** draw one static frame and never animate */
  reducedMotion?: boolean;
  /** start paused (site-level "pause motion"); toggle later with setPaused */
  paused?: boolean;
  /** mouse/trackpad: attention follows the pointer; otherwise it drifts by itself */
  finePointer?: boolean;
  /** cap at 30fps (coarse pointer / few cores) */
  lowPower?: boolean;
  /** optional DOM label that tracks the planet (positioned with transform) */
  label?: HTMLElement | null;
  textBox?: () => TextLayout | null;
};

export type SignalFieldHandle = {
  destroy: () => void;
  /** client coordinates; `active=false` when the pointer leaves */
  setPointer: (clientX: number, clientY: number, active?: boolean) => void;
  /** freeze on the current frame (true) or resume (false) */
  setPaused: (paused: boolean) => void;
};

const TAU = Math.PI * 2;
/** brightness levels for the ink colour (one path + fill per level) */
const LEVELS = 9;
/** levels for planet (accent) dots */
const P_LEVELS = 3;
const ALL_LEVELS = LEVELS + P_LEVELS + 1;
const NOISE_GAIN = 0.2;
const ORBIT_DASH = [1.5, 6];
const NO_DASH: number[] = [];
/** seconds of simulated time used for a static (reduced / paused) first frame */
const STATIC_T = 5;
/** device pixels: soft dots are indistinguishable above this, and fill cost is linear in it */
const MAX_PIXELS = 4e6;
const ORB_ROT = -0.98;
const ORB_RATIO = 0.46;
/** vertical half-extent of the rotated orbit ellipse, per unit of semi-major axis */
const ORB_Y = Math.sqrt(Math.sin(ORB_ROT) ** 2 + (ORB_RATIO * Math.cos(ORB_ROT)) ** 2);

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/* ── value noise on a 64×64 seeded lattice ── */
const LN = 64;
const LM = LN - 1;
const lattice = (() => {
  const r = mulberry32(20240915);
  const a = new Float32Array(LN * LN);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
})();

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = xi & LM;
  const y0 = yi & LM;
  const x1 = (x0 + 1) & LM;
  const y1 = (y0 + 1) & LM;
  const a = lattice[y0 * LN + x0];
  const b = lattice[y0 * LN + x1];
  const c = lattice[y1 * LN + x0];
  const d = lattice[y1 * LN + x1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/* JWST: six spikes from the hexagonal segments (three axes) + a faint horizontal pair
   from the strut. The whole pattern is rolled a little, as a telescope roll would. */
const ROLL = -0.28;
const SPIKES: { ang: number; amp: number; len: number }[] = [
  { ang: Math.PI / 2 + ROLL, amp: 0.72, len: 0.5 },
  { ang: Math.PI / 6 + ROLL, amp: 0.58, len: 0.36 },
  { ang: (5 * Math.PI) / 6 + ROLL, amp: 0.58, len: 0.36 },
  { ang: ROLL, amp: 0.26, len: 0.16 },
];

/** right edge of the name row, including anything sitting beside it (the Bangla toggle) */
const nameBandRight = (L: TextLayout) => {
  let r = L.nameRight;
  for (const h of L.holes) if (h.t < L.nameBottom && h.b > L.nameTop) r = Math.max(r, h.r);
  return r;
};

const sameLayout = (a: TextLayout | null, b: TextLayout | null) => {
  if (!a || !b) return a === b;
  const k: (keyof Omit<TextLayout, "holes">)[] = ["right", "top", "copyTop", "nameTop", "nameBottom", "nameRight"];
  for (const key of k) if (Math.abs(a[key] - b[key]) > 1) return false;
  if (a.holes.length !== b.holes.length) return false;
  for (let i = 0; i < a.holes.length; i++) {
    const p = a.holes[i];
    const q = b.holes[i];
    if (Math.abs(p.l - q.l) > 1 || Math.abs(p.t - q.t) > 1 || Math.abs(p.r - q.r) > 1 || Math.abs(p.b - q.b) > 1) return false;
  }
  return true;
};

export function initSignalField(canvas: HTMLCanvasElement, opts: SignalFieldOptions = {}): SignalFieldHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => {}, setPointer: () => {}, setPaused: () => {} };

  const reduced = !!opts.reducedMotion;
  const fine = !!opts.finePointer;
  const minFrameMs = opts.lowPower ? 1000 / 30 - 1.5 : 0;
  const label = opts.label ?? null;
  let paused = !!opts.paused;

  /* geometry */
  let W = 0;
  let H = 0;
  let dpr = 1;
  let S = 12;
  let N = 0;
  let cap = 0;
  let wide = true;
  let sx = 0;
  let sy = 0;
  let rOcc = 0;
  let orbA = 0;
  let orbB = 0;
  let pSigma = 0;
  let rMin = 0.45;
  let rMax = 5;
  /** planet / reticle centre must stay inside [orbYMin, orbYMax] (canvas px) */
  let orbYMin = -Infinity;
  let orbYMax = Infinity;
  /** the planet's label stays inside [labelMinX, labelMaxX] (clear of the copy), else it hides */
  let labelMinX = 12;
  let labelMaxX = 1e9;
  let tfAt: (x: number, y: number) => number = () => 1;
  let vigAt: (x: number, y: number) => number = () => 1;
  let layout: TextLayout | null = null;

  /* per-dot buffers */
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let env = new Float32Array(0);
  let occ = new Float32Array(0);
  let psf = new Float32Array(0);
  let halo = new Float32Array(0);
  let grain = new Float32Array(0);
  let phase = new Float32Array(0);
  let rad = new Float32Array(0);
  let lvl = new Uint8Array(0);
  let order = new Int32Array(0);
  const counts = new Uint32Array(ALL_LEVELS);
  const starts = new Uint32Array(ALL_LEVELS + 1);
  const cursor = new Uint32Array(ALL_LEVELS);
  const alphaFor = new Float32Array(LEVELS + 1);

  /* colours */
  let fg = "#edeae4";
  let accent = "#f42a41";
  let inkGain = 1;

  /* dynamic state */
  let simT = 0;
  let lastNow = 0;
  let lastDraw = 0;
  let raf = 0;
  let running = false;
  let inView = true;
  let destroyed = false;
  let built = false;
  let firstFrame = true;
  let pointerX = 0;
  let pointerY = 0;
  let pointerOn = false;
  let rect: DOMRect | null = null;
  let ax = -1e4;
  let ay = -1e4;
  let attS = 0;
  let retX = 0;
  let retY = 0;
  let retInit = false;
  let labelShown = -1;
  /** -1 = measure on next frame; 0 = label not displayed (below md) */
  let labelW = -1;
  let labelH = 0;
  /** bit 0: left of the reticle, bit 1: bottom-aligned (kept on the side away from the star) */
  let labelSide = -1;
  /** sim time when the label started fading out to change sides (-1 = idle) */
  let labelSwitchT = -1;

  function readColors() {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    fg = cs.getPropertyValue("--fg").trim() || fg;
    accent = cs.getPropertyValue("--accent").trim() || accent;
    const light = root.classList.contains("light");
    // dark ink on paper reads heavier than light ink on black
    inkGain = light ? 0.86 : 1;
    for (let l = 1; l <= LEVELS; l++) {
      const k = (l - 0.5) / LEVELS;
      alphaFor[l] = Math.min(1, (0.1 + 0.9 * Math.pow(k, 0.85)) * inkGain);
    }
  }

  function alloc(n: number) {
    if (n <= cap) return;
    cap = Math.ceil(n * 1.2);
    px = new Float32Array(cap);
    py = new Float32Array(cap);
    env = new Float32Array(cap);
    occ = new Float32Array(cap);
    psf = new Float32Array(cap);
    halo = new Float32Array(cap);
    grain = new Float32Array(cap);
    phase = new Float32Array(cap);
    rad = new Float32Array(cap);
    lvl = new Uint8Array(cap);
    order = new Int32Array(cap);
  }

  /** star position, size and orbit for the current layout */
  function placeStar(refH: number, vmin: number, mobile: boolean) {
    const L = layout;
    // keep the system clear of the fixed nav
    const navB = Math.min(96, 0.09 * refH);
    const hs = S * 2.3;
    rOcc = 0.07 * vmin;
    orbA = 0.22 * vmin;
    orbYMin = -Infinity;
    orbYMax = Infinity;

    if (wide) {
      const midDesk = W < 1280;
      sx = W * (midDesk ? 0.745 : 0.72);
      sy = refH * (midDesk ? 0.4 : 0.44);
    } else if (mobile) {
      // phones: top-right, between the status line and the name; the orbit stays
      // above the thesis so the planet and its reticle never sit on the copy
      orbYMin = navB + hs;
      orbYMax = L ? L.top - 2 * S - hs : refH * 0.36;
      sx = W * 0.8;
      sy = L ? L.copyTop + (L.nameTop - L.copyTop) * 0.62 : refH * 0.2;
      // leave the orbit room to swing above the star
      sy = Math.max(sy, orbYMin + 0.15 * vmin);
      rOcc = 0.066 * vmin;
    } else if (L && L.copyTop - navB > 0.22 * refH) {
      // tablets in portrait: the copy is anchored low, the star owns the band above it
      const band = L.copyTop - navB;
      sx = W * 0.72;
      sy = navB + band * 0.5;
      rOcc = Math.min(0.07 * vmin, 0.16 * band);
      orbYMin = navB + hs;
      orbYMax = L.copyTop - S - hs;
    } else if (L) {
      // tablets / small landscape: beside the name, between its right edge and the viewport
      const left = nameBandRight(L) + 16;
      orbYMin = L.nameTop + hs;
      orbYMax = L.top - 2 * S - hs;
      sx = Math.max(W * 0.62, (left + W) / 2);
      sy = (orbYMin + orbYMax) / 2;
      rOcc = Math.min(0.07 * vmin, (W - left) / 5.4);
    } else {
      sx = W * 0.74;
      sy = refH * 0.3;
    }

    if (orbYMax < Infinity || orbYMin > -Infinity) {
      const room = Math.max(0, Math.min(sy - orbYMin, orbYMax - sy));
      orbA = Math.min(orbA, room / ORB_Y);
      // the planet must clear the occulter on the near side of its projected orbit
      rOcc = Math.min(rOcc, (orbA * ORB_RATIO) / 1.3);
    }
    orbA = Math.max(orbA, 3 * S);
    orbB = orbA * ORB_RATIO;
  }

  function build(): boolean {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 2 || h < 2) return false;
    W = w;
    H = h;
    const dprCap = Math.min(1.5, window.devicePixelRatio || 1);
    dpr = Math.max(0.75, Math.min(dprCap, Math.sqrt(MAX_PIXELS / (W * H))));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    rect = null;

    const mobile = W < 768;
    // the star is placed against the first screen, not the (possibly taller) section
    const refH = Math.min(H, window.innerHeight || H);
    const vmin = Math.min(W, refH);
    wide = W >= 1024 && refH <= W;
    S = mobile ? 10 : Math.max(12, W / 160);
    rMin = mobile ? 0.4 : 0.45;
    rMax = S * 0.42;
    const rowH = S * 0.8660254;
    const cols = Math.ceil(W / S) + 2;
    const rows = Math.ceil(H / rowH) + 2;
    N = cols * rows;
    alloc(N);

    layout = opts.textBox?.() ?? null;
    placeStar(refH, vmin, mobile);
    labelMaxX = W - 12;
    labelMinX = 12;
    if (layout) labelMinX = Math.max(12, (wide ? layout.right : nameBandRight(layout)) + 12);
    pSigma = S * 0.8;
    const navB = Math.min(96, 0.09 * refH);

    // calm zones under the copy
    const L = layout;
    if (wide) {
      const edge = L && L.right > 0 ? L.right : 0.5 * W;
      const f0 = edge - 0.08 * W;
      const f1 = edge + 0.12 * W;
      tfAt = (x) => 0.15 + 0.85 * smooth(f0, f1, x);
    } else {
      // fully calm below the top of the thesis: no stray dots between words
      const top = L && L.top > 0 ? L.top : 0.38 * refH;
      const f0 = top - 0.06 * refH;
      const f1 = top - 0.005 * refH;
      tfAt = (x, y) => {
        const above = 1 - smooth(f0, f1, y);
        const side = 0.55 + 0.45 * smooth(0.25 * W, 0.6 * W, x);
        return above * (0.15 + 0.85 * side);
      };
    }
    const holes = L?.holes ?? [];
    const holePad = 1.6 * S;
    const holeAt = (x: number, y: number) => {
      let m = 1;
      for (let k = 0; k < holes.length; k++) {
        const hr = holes[k];
        const dx = Math.max(hr.l - 4 - x, 0, x - hr.r - 4);
        const dy = Math.max(hr.t - 4 - y, 0, y - hr.b - 4);
        if (dx > holePad || dy > holePad) continue;
        const v = 0.06 + 0.94 * smooth(0, holePad, Math.sqrt(dx * dx + dy * dy));
        if (v < m) m = v;
      }
      return m;
    };
    const fadeB = Math.min(0.26 * H, 260);
    const topA = wide ? 0.06 * refH : 0.5 * navB;
    const topB = wide ? 0.28 * refH : 1.15 * navB;
    vigAt = (x, y) =>
      smooth(0, 0.07 * W, x) * smooth(0, 0.07 * W, W - x) * smooth(topA, topB, y) * smooth(0, fadeB, H - y);

    const rand = mulberry32(7);
    const x0 = (W - (cols - 1) * S) / 2;
    const y0 = (H - (rows - 1) * rowH) / 2;
    const spikeAxes = SPIKES.map((s) => ({
      ux: Math.cos(s.ang),
      uy: Math.sin(s.ang),
      amp: s.amp,
      len: s.len * vmin,
    }));
    const r1 = 1.75 * rOcc;
    const r2 = 2.6 * rOcc;
    const r3 = 3.45 * rOcc;
    const ringS = Math.max(0.1 * rOcc, 0.42 * S);
    const inv2r = 1 / (2 * ringS * ringS);

    let i = 0;
    for (let r = 0; r < rows; r++) {
      const off = r & 1 ? S / 2 : 0;
      for (let c = 0; c < cols; c++, i++) {
        const x = x0 + c * S + off - S / 2;
        const y = y0 + r * rowH;
        px[i] = x;
        py[i] = y;
        const dx = x - sx;
        const dy = y - sy;
        const d = Math.sqrt(dx * dx + dy * dy);

        const o = smooth(rOcc * 0.78, rOcc * 1.08, d);
        occ[i] = o;

        // residual light leaking around the occulter edge
        const hl = d > rOcc * 0.7 ? Math.min(0.8, 0.68 * Math.exp(-(d - rOcc) / (0.6 * rOcc))) : 0;
        halo[i] = hl * o;

        // Airy rings
        const rg =
          0.34 * Math.exp(-(d - r1) * (d - r1) * inv2r) +
          0.19 * Math.exp(-(d - r2) * (d - r2) * inv2r) +
          0.1 * Math.exp(-(d - r3) * (d - r3) * inv2r);

        // diffraction spikes
        let sp = 0;
        for (let k = 0; k < spikeAxes.length; k++) {
          const ax2 = spikeAxes[k];
          const along = Math.abs(dx * ax2.ux + dy * ax2.uy);
          const perp = Math.abs(dx * ax2.uy - dy * ax2.ux);
          const wpx = S * (0.36 + 0.32 * Math.exp(-along / (1.5 * rOcc)));
          if (perp > wpx * 3.2) continue;
          sp += ax2.amp * Math.exp(-(perp * perp) / (2 * wpx * wpx)) * Math.exp(-along / ax2.len);
        }
        psf[i] = (rg + sp) * o;

        env[i] = tfAt(x, y) * vigAt(x, y) * (holes.length ? holeAt(x, y) : 1);
        grain[i] = rand();
        phase[i] = rand() * TAU;
      }
    }
    labelW = -1;
    built = true;
    return true;
  }

  function render(dt: number) {
    if (!built) return;
    const c2 = ctx!;
    const t = simT;

    /* planet on its projected orbit */
    const th = 1.9 + t * (TAU / 150);
    const ex = orbA * Math.cos(th);
    const ey = orbB * Math.sin(th);
    const cr = Math.cos(ORB_ROT);
    const sr = Math.sin(ORB_ROT);
    const plx = sx + ex * cr - ey * sr;
    const ply = sy + ex * sr + ey * cr;
    const pEnv = vigAt(plx, ply) * (0.55 + 0.45 * tfAt(plx, ply));
    const pAmp = 0.95 * pEnv * (0.92 + 0.08 * Math.sin(t * 2.1));
    const pR = pSigma * 3;
    const pR2 = pR * pR;
    const pInv = 1 / (2 * pSigma * pSigma);

    /* detection reticle — locks on after start, never reaches into the copy */
    if (!retInit || reduced) {
      retX = plx;
      retY = ply;
      retInit = true;
    } else {
      const kr = 1 - Math.exp(-dt * 5);
      retX += (plx - retX) * kr;
      retY += (ply - retY) * kr;
    }
    const lock = reduced ? 1 : easeOut(clamp01((t - 0.5) / 1.5));
    let hs = S * 2.3 * (1 + 2.2 * (1 - lock));
    if (orbYMax < Infinity) hs = Math.min(hs, Math.max(S * 2.3, orbYMax + S * 2.3 - retY));
    if (orbYMin > -Infinity) hs = Math.min(hs, Math.max(S * 2.3, retY - orbYMin + S * 2.3));
    const arm = Math.max(5, S * 0.75);
    const rx = Math.round(retX) + 0.5;
    const ry = Math.round(retY) + 0.5;
    const hsr = Math.round(hs);

    /* label beside the reticle; the dots behind it are knocked out */
    let kx0 = 1;
    let kx1 = 0;
    let ky0 = 1;
    let ky1 = 0;
    let lx = 0;
    let ly = 0;
    let show = 0;
    if (label && labelW < 0) {
      labelW = label.offsetWidth;
      labelH = label.offsetHeight;
    }
    if (label && labelW > 0) {
      // keep the label on the outward side of the planet so it never sits on the halo;
      // change sides with hysteresis, hidden while it jumps (fade out → move → fade in)
      const dxs = plx - sx;
      const dys = ply - sy;
      let want = (dxs < 0 ? 1 : 0) | (dys > 0 ? 2 : 0);
      // never run off the canvas or onto the copy: take the other side, or hide
      const fitsR = rx + hsr + 8 + labelW <= labelMaxX;
      const fitsL = rx - hsr - 8 - labelW >= labelMinX;
      if (!(want & 1) && !fitsR && fitsL) want |= 1;
      else if (want & 1 && !fitsL && fitsR) want &= ~1;
      if (labelSide < 0 || reduced) labelSide = want;
      else if (want !== labelSide && labelSwitchT < 0) {
        const flipX = (want ^ labelSide) & 1;
        const flipY = (want ^ labelSide) & 2;
        if ((flipX && Math.abs(dxs) > 0.3 * orbA) || (flipY && Math.abs(dys) > 0.3 * orbB) || (flipX && !(labelSide & 1 ? fitsL : fitsR)))
          labelSwitchT = t;
      }
      if (labelSwitchT >= 0 && t - labelSwitchT > 0.6) {
        labelSide = want;
        labelSwitchT = -1;
      }
      lx = labelSide & 1 ? rx - hsr - 8 - labelW : rx + hsr + 8;
      ly = labelSide & 2 ? ry + hsr - labelH + 1 : ry - hsr - 1;
      const fits = labelSide & 1 ? fitsL : fitsR;
      show = lock > 0.92 && pEnv > 0.4 && labelSwitchT < 0 && fits ? 1 : 0;
      if (show) {
        kx0 = lx - 6;
        kx1 = lx + labelW + 6;
        ky0 = ly - 4;
        ky1 = ly + labelH + 4;
      }
    }

    /* attention */
    const k = 1 - Math.exp(-dt * 7);
    if (!reduced) {
      if (fine) {
        if (pointerOn) {
          if (!rect) rect = canvas.getBoundingClientRect();
          const tx = ((pointerX - rect.left) * W) / (rect.width || 1);
          const ty = ((pointerY - rect.top) * H) / (rect.height || 1);
          if (ax < -1e3) {
            ax = tx;
            ay = ty;
          }
          ax += (tx - ax) * k;
          ay += (ty - ay) * k;
        }
        attS += ((pointerOn ? 1 : 0) - attS) * (1 - Math.exp(-dt * 3));
      } else {
        ax = W * (0.62 + 0.26 * Math.sin(t * 0.11));
        ay = H * (0.42 + 0.22 * Math.sin(t * 0.07 + 1.3));
        attS = 0.7;
      }
    }
    const aR = wide ? 150 : 120;
    const aInv = 2.2 / (aR * aR);
    const aCut = aR * 2.2 * (aR * 2.2);

    /* noise field */
    const f1 = 1 / (S * 8.5);
    const f2 = 1 / (S * 3.2);
    const fb = 1 / (S * 2.2);
    const ox = t * 0.16;
    const oy = t * 0.05;

    counts.fill(0);
    for (let i = 0; i < N; i++) {
      const x = px[i];
      const y = py[i];
      if (x > kx0 && x < kx1 && y > ky0 && y < ky1) {
        lvl[i] = 0;
        continue;
      }
      const e = env[i];

      const n = vnoise(x * f1 + ox, y * f1 + oy) * 0.6 + vnoise(x * f2 - oy * 2, y * f2 + ox * 1.4) * 0.4;
      const tw = 0.55 + 0.45 * Math.sin(t * 1.6 + phase[i]);
      let s = n * 0.72 + grain[i] * tw * 0.28;
      s = s * s * 1.6;
      let b = s * NOISE_GAIN * occ[i];
      // sparse background stars / hot pixels
      const g = grain[i];
      if (g > 0.993) b += (g - 0.993) * 60 * tw * occ[i];

      const hv = halo[i];
      if (hv > 0.003) {
        const boil = vnoise(x * fb + t * 0.55, y * fb - t * 0.4);
        b += hv * (0.12 + 1.15 * boil * boil);
      }
      b += psf[i];
      b *= e;

      let a = 0;
      if (attS > 0.01) {
        const dxa = x - ax;
        const dya = y - ay;
        const da2 = dxa * dxa + dya * dya;
        if (da2 < aCut) a = attS * Math.exp(-da2 * aInv);
      }
      // attention lifts the field, never the calm zones under the copy
      b += a * (0.05 * Math.min(1, e * 3) + 0.22 * e) + a * b * 0.6;

      let p = 0;
      const dxp = x - plx;
      if (dxp > -pR && dxp < pR) {
        const dyp = y - ply;
        const dp2 = dxp * dxp + dyp * dyp;
        if (dp2 < pR2) p = pAmp * Math.exp(-dp2 * pInv);
      }

      if (p > 0.1) {
        const pv = clamp01(p + b * 0.25);
        const l = LEVELS + 1 + Math.min(P_LEVELS - 1, Math.floor(pv * P_LEVELS));
        lvl[i] = l;
        rad[i] = rMin + (rMax - rMin) * Math.sqrt(pv);
        counts[l]++;
        continue;
      }
      if (b < 0.012) {
        lvl[i] = 0;
        continue;
      }
      const bc = b > 1 ? 1 : b;
      const l = 1 + Math.min(LEVELS - 1, Math.floor(bc * LEVELS));
      lvl[i] = l;
      rad[i] = (rMin + (rMax - rMin) * Math.sqrt(bc)) * (1 + 0.4 * a);
      counts[l]++;
    }

    /* bucket indices by level (counting sort), so each level is one slice */
    starts[0] = 0;
    for (let l = 0; l < ALL_LEVELS; l++) {
      starts[l + 1] = starts[l] + (l === 0 ? 0 : counts[l]);
      cursor[l] = starts[l];
    }
    for (let i = 0; i < N; i++) {
      const l = lvl[i];
      if (l) order[cursor[l]++] = i;
    }

    /* draw */
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, W, H);
    c2.fillStyle = fg;
    for (let l = 1; l <= LEVELS; l++) {
      const end = starts[l + 1];
      let j = starts[l];
      if (j === end) continue;
      c2.globalAlpha = alphaFor[l];
      c2.beginPath();
      for (; j < end; j++) {
        const i = order[j];
        const r = rad[i];
        c2.moveTo(px[i] + r, py[i]);
        c2.arc(px[i], py[i], r, 0, TAU);
      }
      c2.fill();
    }

    /* instrument overlay: occulter ring + centre mark + fitted orbit */
    const starEnv = vigAt(sx, sy);
    c2.globalAlpha = 0.16 * inkGain * starEnv;
    c2.strokeStyle = fg;
    c2.lineWidth = 1;
    c2.beginPath();
    c2.arc(sx, sy, rOcc * 0.98, 0, TAU);
    c2.stroke();
    c2.globalAlpha = 0.5 * inkGain * starEnv;
    c2.beginPath();
    c2.arc(sx, sy, Math.max(1.5, S * 0.16), 0, TAU);
    c2.fill();
    c2.globalAlpha = 0.09 * inkGain * starEnv;
    c2.setLineDash(ORBIT_DASH);
    c2.beginPath();
    c2.ellipse(sx, sy, orbA, orbB, ORB_ROT, 0, TAU);
    c2.stroke();
    c2.setLineDash(NO_DASH);

    c2.fillStyle = accent;
    for (let l = LEVELS + 1; l <= LEVELS + P_LEVELS; l++) {
      const end = starts[l + 1];
      let j = starts[l];
      if (j === end) continue;
      c2.globalAlpha = Math.min(1, 0.45 + 0.55 * ((l - LEVELS) / P_LEVELS));
      c2.beginPath();
      for (; j < end; j++) {
        const i = order[j];
        const r = rad[i];
        c2.moveTo(px[i] + r, py[i]);
        c2.arc(px[i], py[i], r, 0, TAU);
      }
      c2.fill();
    }

    /* reticle corners */
    c2.globalAlpha = 0.95 * lock * pEnv;
    c2.strokeStyle = accent;
    c2.lineWidth = 1;
    c2.beginPath();
    for (let q = 0; q < 4; q++) {
      const qx = q & 1 ? 1 : -1;
      const qy = q & 2 ? 1 : -1;
      const cx = rx + qx * hsr;
      const cy = ry + qy * hsr;
      c2.moveTo(cx - qx * arm, cy);
      c2.lineTo(cx, cy);
      c2.lineTo(cx, cy - qy * arm);
    }
    c2.stroke();
    c2.globalAlpha = 1;

    if (label && labelW > 0) {
      label.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
      if (show !== labelShown) {
        label.style.opacity = String(show);
        labelShown = show;
      }
    }

    if (firstFrame) {
      firstFrame = false;
      canvas.style.opacity = "1";
    }
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (minFrameMs && now - lastDraw < minFrameMs) return;
    const dt = Math.min(0.05, Math.max(0, (now - (lastNow || now)) / 1000));
    lastNow = now;
    lastDraw = now;
    simT += dt;
    render(dt || 1 / 60);
  }

  function start() {
    if (running || reduced || paused || destroyed) return;
    running = true;
    lastNow = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function sync() {
    if (destroyed || reduced) return;
    if (inView && !document.hidden && !paused) start();
    else stop();
  }
  function drawStatic() {
    // a static first frame shows the locked-on state, not the opening of the lock-on
    if (reduced || (firstFrame && simT < STATIC_T)) simT = STATIC_T;
    render(1 / 60);
  }

  readColors();
  if (build() && (reduced || paused)) drawStatic();

  let rebuildRaf = 0;
  const rebuild = () => {
    if (destroyed) return;
    if (build() && (reduced || !running)) drawStatic();
  };
  const ro = new ResizeObserver(() => {
    // the observer's first callback reports the size build() already used
    if (built && canvas.clientWidth === W && canvas.clientHeight === H) return;
    cancelAnimationFrame(rebuildRaf);
    rebuildRaf = requestAnimationFrame(rebuild);
  });
  ro.observe(canvas);
  // text metrics change when the display face arrives; rebuild only if the copy moved
  document.fonts?.ready.then(() => {
    if (destroyed || !built) return;
    if (!sameLayout(layout, opts.textBox?.() ?? null)) rebuild();
  });

  const io = new IntersectionObserver(
    (entries) => {
      inView = entries[entries.length - 1]?.isIntersecting ?? true;
      sync();
    },
    { rootMargin: "80px" },
  );
  io.observe(canvas);

  const onVis = () => sync();
  document.addEventListener("visibilitychange", onVis);
  const onTheme = () => {
    readColors();
    if (reduced || !running) drawStatic();
  };
  window.addEventListener("themechange", onTheme);
  // the canvas rect is only needed for pointer mapping; refresh it lazily
  const onScroll = () => {
    rect = null;
  };
  if (fine && !reduced) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  sync();

  return {
    destroy() {
      destroyed = true;
      stop();
      cancelAnimationFrame(rebuildRaf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("themechange", onTheme);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    },
    setPointer(x, y, active = true) {
      pointerX = x;
      pointerY = y;
      pointerOn = active;
    },
    setPaused(p) {
      if (p === paused) return;
      paused = p;
      if (paused) {
        stop();
        if (firstFrame) drawStatic();
      } else sync();
    },
  };
}
