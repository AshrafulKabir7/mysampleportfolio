import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 9, suffix: "+", label: "Years_Shipping", sub: "Production systems" },
  { value: 142, suffix: "K", label: "Commits_Pushed", sub: "Across all repos" },
  { value: 38, suffix: "", label: "Systems_Deployed", sub: "At global scale" },
  { value: 99.98, suffix: "%", label: "Mean_Uptime", sub: "Last 12 months", decimals: 2 },
];

function Counter({
  value,
  suffix,
  decimals = 0,
  active,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const duration = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);

  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Stats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="border-b border-foreground">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground border-x-0">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            className="bg-background p-8 md:p-10 flex flex-col gap-3 group hover:bg-foreground hover:text-background transition-colors"
          >
            <span className="font-serif italic leading-[0.85] text-[clamp(2.5rem,6vw,4.5rem)]">
              <Counter
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
                active={inView}
              />
            </span>
            <div className="mt-auto">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-background/50 transition-colors">
                {stat.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
