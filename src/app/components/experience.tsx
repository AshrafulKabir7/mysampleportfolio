import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const TIMELINE = [
  {
    year: "2023 — NOW",
    role: "Principal Systems Engineer",
    org: "Hyperscale Labs",
    desc: "Architecting fault-tolerant distributed runtimes serving 12M+ requests/sec across edge regions.",
    tags: ["Rust", "Kubernetes", "gRPC"],
  },
  {
    year: "2020 — 2023",
    role: "Staff Software Engineer",
    org: "Vector Security",
    desc: "Led the cryptographic audit-trail platform and zero-trust authentication mesh from prototype to GA.",
    tags: ["Go", "PostgreSQL", "Crypto"],
  },
  {
    year: "2017 — 2020",
    role: "Senior Backend Engineer",
    org: "Prism Data",
    desc: "Built a time-series ingestion engine handling petabyte-scale telemetry with sub-50ms query latency.",
    tags: ["C++", "Redis", "WASM"],
  },
  {
    year: "2015 — 2017",
    role: "Software Engineer",
    org: "Synapse OS",
    desc: "Contributed to an open-source kernel visualizer and high-concurrency debugger toolchain.",
    tags: ["TypeScript", "WebGL", "Linux"],
  },
];

export function Experience() {
  return (
    <section id="about" className="py-24 border-b border-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4">// CAREER_LOG</p>
          <h2 className="font-display text-5xl font-bold uppercase tracking-tighter italic">
            Experience
          </h2>
        </div>
        <p className="font-serif text-xl max-w-xs md:text-right text-muted-foreground">
          A decade of shipping resilient infrastructure for systems that cannot fail.
        </p>
      </div>

      <div className="border-t border-foreground">
        {TIMELINE.map((item, i) => (
          <motion.button
            key={item.year}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            onClick={() => toast.info(`Loading record: ${item.org} (${item.year})`)}
            className="group w-full text-left grid md:grid-cols-[160px_1fr_auto] gap-4 md:gap-10 items-start py-10 border-b border-foreground hover:bg-foreground hover:text-background transition-colors px-2 md:px-6 -mx-2 md:-mx-6"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest pt-2">
              {item.year}
            </span>

            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  {item.role}
                </h3>
                <span className="font-serif italic text-xl text-muted-foreground group-hover:text-background/60 transition-colors">
                  @ {item.org}
                </span>
              </div>
              <p className="font-serif text-base text-muted-foreground group-hover:text-background/70 transition-colors mt-3 max-w-2xl">
                {item.desc}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 border border-current font-mono text-[10px] font-bold uppercase opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <ArrowUpRight className="w-7 h-7 opacity-20 group-hover:opacity-100 group-hover:rotate-45 transition-all hidden md:block" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
