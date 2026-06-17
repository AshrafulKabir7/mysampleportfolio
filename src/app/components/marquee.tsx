import { motion } from "motion/react";

const ITEMS = [
  "DISTRIBUTED SYSTEMS",
  "★",
  "CRYPTOGRAPHIC SECURITY",
  "★",
  "RUST / WASM",
  "★",
  "REAL-TIME INFRASTRUCTURE",
  "★",
  "EDITORIAL INTERFACES",
  "★",
  "LOW-LATENCY ENGINEERING",
  "★",
];

export function Marquee({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="border-b border-foreground bg-foreground text-background overflow-hidden py-3 select-none">
      <motion.div
        className="flex whitespace-nowrap gap-8"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span
            key={i}
            className={`font-display font-bold uppercase tracking-tight text-lg ${
              item === "★" ? "opacity-50" : ""
            }`}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
