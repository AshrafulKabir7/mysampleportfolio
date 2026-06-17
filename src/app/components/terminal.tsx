import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Line = { type: "input" | "output" | "system"; text: string };

const COMMANDS: Record<string, string[]> = {
  help: [
    "AVAILABLE COMMANDS:",
    "  whoami      → identity & current role",
    "  skills      → core competencies",
    "  projects    → list featured work",
    "  contact     → how to reach me",
    "  social      → external links",
    "  clear       → wipe the console",
  ],
  whoami: [
    "Alex Nexus — Principal Systems Engineer.",
    "Builds fault-tolerant distributed systems & editorial-grade interfaces.",
    "Status: OPEN to high-impact roles.",
  ],
  skills: [
    "LANG  : TypeScript · Rust · Python · Go · C++",
    "INFRA : Kubernetes · AWS · gRPC · Postgres · Redis",
    "FOCUS : low-latency, zero-trust, real-time systems",
  ],
  projects: [
    "01  SYNAPSE_OS   → kernel visualizer (Rust/WASM)",
    "02  VECTOR_CORE  → ML orchestration (Python/Docker)",
    "03  PRISM_DB     → time-series engine (C++/gRPC)",
    "Tip: scroll up to the directory for live demos.",
  ],
  contact: ["email : hello@nexus.dev", "Response time: < 24h."],
  social: ["github.com/alexnexus", "linkedin.com/in/alexnexus", "x.com/alexnexus"],
};

const PROMPT = "nexus@core:~$";

export function Terminal() {
  const [history, setHistory] = useState<Line[]>([
    { type: "system", text: "nexus_shell v2.4.0 — type 'help' to begin." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === "clear") {
      setHistory([{ type: "system", text: "Console cleared." }]);
      return;
    }

    const next: Line[] = [{ type: "input", text: `${PROMPT} ${raw}` }];
    if (COMMANDS[cmd]) {
      COMMANDS[cmd].forEach((t) => next.push({ type: "output", text: t }));
    } else {
      next.push({ type: "output", text: `command not found: ${cmd} — try 'help'` });
    }
    setHistory((h) => [...h, ...next]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput("");
  };

  return (
    <section className="py-24 border-b border-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4">// INTERACTIVE_SHELL</p>
          <h2 className="font-display text-5xl font-bold uppercase tracking-tighter italic">
            Talk to the System
          </h2>
        </div>
        <p className="font-serif text-xl max-w-xs md:text-right text-muted-foreground">
          A live console. Type a command to explore — start with <span className="italic">help</span>.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="border border-foreground bg-foreground text-background"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-background/20">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-background" />
            <span className="w-3 h-3 rounded-full border border-background" />
            <span className="w-3 h-3 rounded-full bg-background" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
            nexus_shell — bash
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">82×24</span>
        </div>

        {/* Output */}
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto p-5 font-mono text-xs md:text-sm leading-relaxed space-y-1"
        >
          {history.map((line, i) => (
            <p
              key={i}
              className={
                line.type === "input"
                  ? "text-background"
                  : line.type === "system"
                  ? "text-background/50"
                  : "text-background/80 whitespace-pre-wrap"
              }
            >
              {line.text}
            </p>
          ))}

          {/* Input row */}
          <form onSubmit={onSubmit} className="flex items-center gap-2 pt-1">
            <span className="text-background shrink-0">{PROMPT}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal command input"
              className="flex-1 bg-transparent border-none outline-none text-background font-mono caret-background placeholder:text-background/30"
              placeholder="type a command…"
            />
          </form>
        </div>
      </motion.div>
    </section>
  );
}
