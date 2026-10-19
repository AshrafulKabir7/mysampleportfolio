import { useEffect, useRef, type RefObject } from "react";
import { isMotionPaused, MOTION_CHANGE } from "@/lib/motionPref";
import { cn } from "@/lib/cn";
import { initSignalField, type FieldRect, type SignalFieldHandle, type TextLayout } from "./SignalField";

const REDUCE = "(prefers-reduced-motion: reduce)";
const FINE = "(hover: hover) and (pointer: fine)";
const COARSE = "(pointer: coarse)";

/** Layout box of `el` relative to `root` (an offsetParent ancestor) — ignores transforms */
function boxIn(el: HTMLElement, root: HTMLElement): FieldRect | null {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  if (n !== root) return null;
  return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight };
}

/**
 * Where the copy sits, for the field's calm zones and the star's placement.
 * Uses layout boxes (offsetTop chains), so it is right even while the CSS
 * entrance is still translating the text.
 */
function measure(text: HTMLElement | null | undefined): TextLayout | null {
  const root = text?.offsetParent as HTMLElement | null | undefined;
  if (!text || !root) return null;
  const copy = boxIn(text, root);
  if (!copy) return null;
  let right = 0;
  for (const el of Array.from(text.querySelectorAll<HTMLElement>("[data-text-edge]"))) {
    const b = boxIn(el, root);
    if (b) right = Math.max(right, b.r);
  }
  const thesis = text.querySelector<HTMLElement>("[data-text-top]");
  const name = text.querySelector<HTMLElement>("[data-name]");
  const tb = thesis ? boxIn(thesis, root) : null;
  const nb = name ? boxIn(name, root) : null;
  const holes: FieldRect[] = [];
  for (const el of Array.from(text.querySelectorAll<HTMLElement>("[data-field-hole]"))) {
    if (!el.offsetWidth) continue; // hidden at this breakpoint
    const b = boxIn(el, root);
    if (b) holes.push(b);
  }
  // first line box of the status row starts below the column's padding
  const first = text.firstElementChild as HTMLElement | null;
  const fb = first ? boxIn(first, root) : null;
  return {
    right,
    top: tb?.t ?? 0,
    copyTop: fb?.t ?? copy.t,
    nameTop: nb?.t ?? 0,
    nameBottom: nb?.b ?? 0,
    nameRight: nb?.r ?? 0,
    holes,
  };
}

/**
 * React mount for the halftone coronagraph. Starts once `ready` (intro lifting
 * or no intro), fades in on its first frame, and feeds pointer positions to the
 * engine without touching React state. Media queries are read live inside the
 * effect, so the hydration-time server values never build a field that is
 * thrown away a frame later.
 */
export function SignalCanvas({
  ready,
  className,
  textRef,
}: {
  ready: boolean;
  className?: string;
  /** the foreground copy column; the field stays calm underneath it */
  textRef?: RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ready || !canvas) return;

    const mqReduce = window.matchMedia(REDUCE);
    const mqFine = window.matchMedia(FINE);
    let field: SignalFieldHandle | null = null;
    let detachPointer = () => {};
    let startT = 0;
    let idle = 0;

    const mount = () => {
      field?.destroy();
      detachPointer();
      const reduce = mqReduce.matches;
      const fine = mqFine.matches;
      const cores = navigator.hardwareConcurrency || 8;
      field = initSignalField(canvas, {
        reducedMotion: reduce,
        paused: isMotionPaused(),
        finePointer: fine,
        lowPower: window.matchMedia(COARSE).matches || cores <= 4,
        label: labelRef.current,
        textBox: () => measure(textRef?.current),
      });
      if (!fine || reduce) {
        detachPointer = () => {};
        return;
      }
      const f = field;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        f.setPointer(e.clientX, e.clientY, true);
      };
      const onOut = (e: PointerEvent) => {
        if (!e.relatedTarget) f.setPointer(0, 0, false);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onOut, { passive: true });
      detachPointer = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerout", onOut);
      };
    };

    // Building the field is a ~10k-dot pass. Keep it off the frames where the intro
    // curtain is lifting, and on low-power devices let the hero text settle first.
    const lifting = document.documentElement.classList.contains("intro-lifting");
    const lowPower = window.matchMedia(COARSE).matches || (navigator.hardwareConcurrency || 8) <= 4;
    const delay = lifting ? 720 : lowPower ? 400 : 0;
    const begin = () => {
      startT = 0;
      if ("requestIdleCallback" in window && delay) {
        idle = window.requestIdleCallback(mount, { timeout: 300 });
      } else mount();
    };
    if (delay) startT = window.setTimeout(begin, delay);
    else mount();

    const onMotion = () => field?.setPaused(isMotionPaused());
    const onReduce = () => mount();
    window.addEventListener(MOTION_CHANGE, onMotion);
    mqReduce.addEventListener("change", onReduce);
    mqFine.addEventListener("change", onReduce);

    return () => {
      window.clearTimeout(startT);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      window.removeEventListener(MOTION_CHANGE, onMotion);
      mqReduce.removeEventListener("change", onReduce);
      mqFine.removeEventListener("change", onReduce);
      detachPointer();
      field?.destroy();
      field = null;
    };
  }, [ready, textRef]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-[1200ms] ease-out"
      />
      <span
        ref={labelRef}
        className="label-mono absolute left-0 top-0 hidden whitespace-nowrap text-[0.66rem] tracking-[0.16em] text-accent-text opacity-0 transition-opacity duration-500 will-change-transform md:block"
      >
        candidate · signal
      </span>
    </div>
  );
}
