import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useIntroDone } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";
import { readTheme, type Theme } from "@/lib/theme";
import { isTypingTarget, useIsMac } from "./ChromeHelpers";

/* The palette UI (cmdk + Radix internals, icons, toasts) is its own chunk,
   fetched on idle after the intro, on hover/focus of the nav ⌘K button, or
   on first open. This host only owns the shortcuts, open state and focus. */

type DialogModule = typeof import("./CommandPaletteDialog");
let chunk: Promise<DialogModule> | null = null;

/** Start loading the palette chunk (idempotent; a failed load can be retried) */
export function prefetchPalette(): Promise<DialogModule> {
  chunk ??= import("./CommandPaletteDialog").catch((err: unknown) => {
    chunk = null;
    throw err;
  });
  return chunk;
}

const PaletteDialog = lazy(prefetchPalette);

/** A failed chunk load must never take the page down with it */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * ⌘K / Ctrl+K / "/" command menu. Opens from anywhere via the
 * `palette:open` window event too. Everything it lists comes from site.ts.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  // false in renderToString and in the hydration pass: the lazy boundary never renders there
  const [armed, setArmed] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const isMac = useIsMac();
  const ready = useIntroDone();
  const restoreRef = useRef<HTMLElement | null>(null);

  const openRef = useRef(false);
  openRef.current = open;

  const show = useCallback(() => {
    if (openRef.current) return;
    const el = document.activeElement;
    restoreRef.current = el instanceof HTMLElement && el !== document.body ? el : null;
    void prefetchPalette().catch(() => {});
    setTheme(readTheme());
    setArmed(true);
    setOpen(true);
  }, []);

  /** restore = false for navigation commands: scrollToId moves focus to the destination */
  const close = useCallback((restore = true) => {
    if (!restore) restoreRef.current = null;
    setOpen(false);
  }, []);

  // global shortcuts + external open requests
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key || "").toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) setOpen(false);
        else show();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("palette:open", show);
    };
  }, [show]);

  // warm the chunk once the page has settled — only where the palette can be opened
  // (the ⌘K button shows from md up; a keyboard usually comes with a fine pointer)
  useEffect(() => {
    if (!ready) return;
    if (!window.matchMedia("(min-width: 768px), (hover: hover) and (pointer: fine)").matches) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const warm = () => void prefetchPalette().catch(() => {});
    let idle = 0;
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(warm, { timeout: 4000 });
      else warm();
    }, 1500);
    return () => {
      window.clearTimeout(t);
      if (idle) w.cancelIdleCallback?.(idle);
    };
  }, [ready]);

  // while open: lock scroll, Esc closes; on close: give focus back (unless a jump took it)
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      const el = restoreRef.current;
      restoreRef.current = null;
      if (el && el.isConnected) el.focus({ preventScroll: true });
    };
  }, [open]);

  if (!armed) return null;
  return (
    <Quiet>
      <Suspense fallback={null}>
        <PaletteDialog open={open} onClose={close} theme={theme} isMac={isMac} />
      </Suspense>
    </Quiet>
  );
}
