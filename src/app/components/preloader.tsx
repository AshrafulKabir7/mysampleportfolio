import { motion } from "motion/react";
import { useState, useEffect } from "react";

const BOOT_LINES = [
  "INIT_KERNEL ........................ OK",
  "MOUNT /dev/nexus_core .............. OK",
  "LOAD react@18.3 ................... OK",
  "LOAD motion@12.23 ................. OK",
  "COMPILE rust_wasm.module ......... OK",
  "ESTABLISH postgre_adapter ........ OK",
  "VERIFY cryptographic_signature ... OK",
  "WARM edge_cache_layer ............ OK",
];

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [done, setDone] = useState(false);

  // Drive the percentage counter
  useEffect(() => {
    let frame: number;
    let current = 0;
    const tick = () => {
      // Ease toward 100 with slight jitter for a "real" feel
      const step = current < 80 ? Math.random() * 4 + 1.5 : Math.random() * 1.5 + 0.4;
      current = Math.min(100, current + step);
      setProgress(current);
      if (current < 100) {
        frame = window.setTimeout(tick, 70) as unknown as number;
      } else {
        setTimeout(() => setDone(true), 450);
      }
    };
    frame = window.setTimeout(tick, 300) as unknown as number;
    return () => clearTimeout(frame);
  }, []);

  // Reveal boot lines progressively in sync with progress
  useEffect(() => {
    const target = Math.floor((progress / 100) * BOOT_LINES.length);
    setVisibleLines(target);
  }, [progress]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background text-foreground flex flex-col"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Faint grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top meta bar */}
      <div className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-foreground font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-foreground" />
          Nexus.dev / Boot_Sequence
        </div>
        <span>SECURE_SHELL : ACTIVE</span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12">
        <div className="w-full max-w-3xl">
          {/* Giant counter */}
          <div className="flex items-end justify-between mb-8">
            <span className="font-serif italic leading-[0.8] text-[clamp(5rem,22vw,16rem)] tabular-nums">
              {Math.floor(progress)}
            </span>
            <span className="font-mono text-sm font-bold uppercase tracking-widest mb-6">
              % Loaded
            </span>
          </div>

          {/* Progress rail */}
          <div className="w-full h-px bg-foreground/15 relative mb-10">
            <div
              className="absolute inset-y-0 left-0 bg-foreground"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute -top-1 w-0.5 h-2.5 bg-foreground"
              style={{ left: `calc(${progress}% - 1px)` }}
            />
          </div>

          {/* Boot log */}
          <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider space-y-1.5 min-h-[10rem]">
            {BOOT_LINES.slice(0, visibleLines).map((line) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <span className="text-muted-foreground">›</span>
                <span className="flex-1">{line.split(" .").shift()}</span>
                <span className="text-muted-foreground hidden sm:inline">
                  {line.includes("OK") ? "[ OK ]" : ""}
                </span>
              </motion.div>
            ))}
            {!done && (
              <span className="inline-block w-2.5 h-3.5 bg-foreground animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom meta bar */}
      <div className="flex justify-between items-center px-6 md:px-12 py-6 border-t border-foreground font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>v2.4.0-stable</span>
        <span className="hidden md:inline">© 2026 / Alex Nexus</span>
        <span>40.7128° N · 74.0060° W</span>
      </div>

      {/* Curtain wipe trigger */}
      {done && (
        <motion.div
          className="absolute inset-0 bg-foreground origin-bottom"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={onComplete}
        />
      )}
    </motion.div>
  );
}
